import os
import logging
import googleapiclient.discovery
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder="static")
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# YouTube Data API key
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise ValueError("YouTube Data API key is missing. Please check your .env file.")

def get_profile_picture(channel_id):
    """
    Fetch the profile picture URL of a YouTube channel using its channel ID.
    """
    try:
        # Initialize YouTube API client
        youtube = googleapiclient.discovery.build("youtube", "v3", developerKey=API_KEY)

        # Fetch channel details using the channel ID
        request = youtube.channels().list(
            part="snippet",
            id=channel_id,
        )
        response = request.execute()

        if not response.get("items"):
            raise ValueError("Channel not found")

        # Extract profile picture URLs (thumbnails)
        thumbnails = response["items"][0]["snippet"].get("thumbnails", {})
        profile_picture = thumbnails.get("high", {}).get("url") if thumbnails else "N/A"

        return profile_picture

    except googleapiclient.errors.HttpError as e:
        logger.error(f"YouTube API error: {e}")
        raise ValueError(f"YouTube API error: {str(e)}")
    except Exception as e:
        logger.error(f"Error fetching profile picture: {e}")
        raise ValueError(f"Error fetching profile picture: {str(e)}")

def get_channel_data(channel_url):
    """
    Scrape data from a YouTube channel homepage, including the profile picture.
    """
    try:
        # Extract handle or channel ID from the URL
        if "/c/" in channel_url:
            handle_or_id = channel_url.split("/c/")[1].split("/")[0]
        elif "/user/" in channel_url:
            handle_or_id = channel_url.split("/user/")[1].split("/")[0]
        elif "/@" in channel_url:
            handle_or_id = channel_url.split("/@")[1].split("/")[0]
        elif "/channel/" in channel_url:
            handle_or_id = channel_url.split("/channel/")[1].split("/")[0]
        else:
            raise ValueError("Invalid YouTube channel URL")

        # Initialize YouTube API client
        youtube = googleapiclient.discovery.build("youtube", "v3", developerKey=API_KEY)

        # If the extracted value is a channel ID (starts with "UC"), use it directly
        if handle_or_id.startswith("UC"):
            channel_id = handle_or_id
        else:
            # Otherwise, treat it as a handle and resolve it to a channel ID
            search_request = youtube.search().list(
                part="id",
                q=handle_or_id,
                type="channel",
                maxResults=1,
            )
            search_response = search_request.execute()

            if not search_response.get("items"):
                raise ValueError("Channel not found")

            channel_id = search_response["items"][0]["id"]["channelId"]

        # Fetch channel details using the resolved channel ID
        request = youtube.channels().list(
            part="snippet,statistics",
            id=channel_id,
        )
        response = request.execute()

        if not response.get("items"):
            raise ValueError("Channel not found")

        channel_data = response["items"][0]
        snippet = channel_data["snippet"]
        statistics = channel_data["statistics"]

        # Get profile picture using the separate function
        profile_picture = get_profile_picture(channel_id)

        return {
            "channel_name": snippet["title"],
            "subscriber_count": statistics.get("subscriberCount", "N/A"),
            "total_videos": statistics.get("videoCount", "N/A"),
            "channel_description": snippet.get("description", "N/A"),
            "channel_location": snippet.get("country", "N/A"),
            "profile_picture": profile_picture,  # Add profile picture URL
        }

    except googleapiclient.errors.HttpError as e:
        logger.error(f"YouTube API error: {e}")
        raise ValueError(f"YouTube API error: {str(e)}")
    except Exception as e:
        logger.error(f"Error fetching channel data: {e}")
        raise ValueError(f"Error fetching channel data: {str(e)}")

def get_video_data(video_url):
    """
    Scrape data from a YouTube video page, including profile pictures of commenters.
    """
    try:
        # Extract video ID from the URL
        if "/shorts/" in video_url:
            video_id = video_url.split("/shorts/")[1].split("/")[0]
        else:
            video_id = video_url.split("v=")[1].split("&")[0]

        # Initialize YouTube API client
        youtube = googleapiclient.discovery.build("youtube", "v3", developerKey=API_KEY)

        # Get video details
        video_request = youtube.videos().list(
            part="snippet,statistics",
            id=video_id,
        )
        video_response = video_request.execute()

        if not video_response.get("items"):
            raise ValueError("Video not found")

        video_data = video_response["items"][0]
        snippet = video_data["snippet"]
        statistics = video_data["statistics"]

        # Get top 7 comments with profile pictures
        comments = []
        next_page_token = None
        max_comments = 7  # Limit to top 7 comments

        while len(comments) < max_comments:
            comment_request = youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                pageToken=next_page_token,
                maxResults=min(100, max_comments - len(comments)),  # Fetch only what's needed
            )
            comment_response = comment_request.execute()

            for item in comment_response["items"]:
                comment = item["snippet"]["topLevelComment"]["snippet"]
                author_channel_id = comment.get("authorChannelId", {}).get("value")

                # Fetch profile picture for the commenter
                profile_picture = "N/A"
                if author_channel_id:
                    try:
                        profile_picture = get_profile_picture(author_channel_id)
                    except Exception as e:
                        logger.error(f"Error fetching profile picture for commenter: {e}")

                comments.append({
                    "username": comment["authorDisplayName"],
                    "comment": comment["textDisplay"],
                    "timestamp": comment["publishedAt"],
                    "profile_picture": profile_picture,  # Add profile picture URL
                })

                if len(comments) >= max_comments:
                    break  # Stop fetching once we have 7 comments

            next_page_token = comment_response.get("nextPageToken")
            if not next_page_token:
                break  # Exit if there are no more comments

        return {
            "video_title": snippet["title"],
            "view_count": statistics.get("viewCount", "N/A"),
            "like_count": statistics.get("likeCount", "N/A"),
            "comment_count": statistics.get("commentCount", "N/A"),
            "comments": comments,
        }

    except googleapiclient.errors.HttpError as e:
        logger.error(f"YouTube API error: {e}")
        raise ValueError(f"YouTube API error: {str(e)}")
    except Exception as e:
        logger.error(f"Error fetching video data: {e}")
        raise ValueError(f"Error fetching video data: {str(e)}")

@app.route("/scrape", methods=["POST"])
def scrape():
    data = request.get_json()
    url = data.get("url")

    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        if "/channel/" in url or "/c/" in url or "/user/" in url or "/@" in url:
            data = get_channel_data(url)
        elif "/watch?v=" in url or "/shorts/" in url:
            data = get_video_data(url)
        else:
            return jsonify({"error": "Invalid YouTube URL"}), 400

        return jsonify(data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500

# Serve React App
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        if path.endswith('.js'):
            return send_from_directory(app.static_folder, path, mimetype='application/javascript')
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    app.run(debug=True)