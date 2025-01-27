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

# Get allowed origins from environment variable
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*').split(',')
cors = CORS(app, origins=ALLOWED_ORIGINS)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize YouTube API client
def get_youtube_client():
    """Initialize and return the YouTube API client."""
    api_service_name = "youtube"
    api_version = "v3"
    api_key = os.getenv("API_KEY")
    if not api_key:
        raise ValueError("YouTube Data API key is missing. Please check your .env file.")
    youtube = googleapiclient.discovery.build(api_service_name, api_version, developerKey=api_key)
    return youtube

# API Routes
@app.route("/api/video/<video_id>", methods=["GET"])
def get_video(video_id):
    """Get video details and top comments."""
    try:
        youtube = get_youtube_client()
        
        # Get video details
        video_response = youtube.videos().list(
            part="snippet,statistics",
            id=video_id
        ).execute()

        if not video_response.get("items"):
            return jsonify({"error": "Video not found"}), 404

        video_data = video_response["items"][0]
        snippet = video_data["snippet"]
        statistics = video_data["statistics"]
        
        # Add thumbnail to the response
        # video_data["thumbnail"] = thumbnail


        # Get top comments
        comments = []
        next_page_token = None
        max_comments = 7

        while len(comments) < max_comments:
            comment_response = youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                pageToken=next_page_token,
                maxResults=min(100, max_comments - len(comments))
            ).execute()

            for item in comment_response["items"]:
                comment = item["snippet"]["topLevelComment"]["snippet"]
                author_channel_id = comment.get("authorChannelId", {}).get("value")

                # Get commenter's profile picture
                profile_picture = None
                if author_channel_id:
                    try:
                        channel_response = youtube.channels().list(
                            part="snippet",
                            id=author_channel_id
                        ).execute()
                        if channel_response.get("items"):
                            thumbnails = channel_response["items"][0]["snippet"]["thumbnails"]
                            profile_picture = thumbnails.get("high", {}).get("url")
                    except Exception as e:
                        logger.error(f"Error fetching commenter profile picture: {e}")

                comments.append({
                    "username": comment["authorDisplayName"],
                    "comment": comment["textDisplay"],
                    "timestamp": comment["publishedAt"],
                    "profile_picture": profile_picture
                })

                if len(comments) >= max_comments:
                    break

            next_page_token = comment_response.get("nextPageToken")
            if not next_page_token:
                break

        return jsonify({
            "video_title": snippet["title"],
            "view_count": statistics.get("viewCount", "N/A"),
            "like_count": statistics.get("likeCount", "N/A"),
            "comment_count": statistics.get("commentCount", "N/A"),
            "thumbnail" : snippet["thumbnails"]["high"]["url"],
            "comments": comments
        })

    except Exception as e:
        logger.error(f"Error getting video data: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/channel/<channel_identifier>", methods=["GET"])
def get_channel(channel_identifier):
    """Get channel details using ID, handle, or custom URL."""
    try:
        youtube = get_youtube_client()
        
        # Determine if the identifier is a channel ID
        if channel_identifier.startswith("UC"):
            channel_id = channel_identifier
        else:
            # Search for channel by handle/custom URL
            search_response = youtube.search().list(
                part="id",
                q=channel_identifier,
                type="channel",
                maxResults=1
            ).execute()

            if not search_response.get("items"):
                return jsonify({"error": "Channel not found"}), 404

            channel_id = search_response["items"][0]["id"]["channelId"]

        # Get channel details
        channel_response = youtube.channels().list(
            part="snippet,statistics",
            id=channel_id
        ).execute()

        if not channel_response.get("items"):
            return jsonify({"error": "Channel not found"}), 404

        channel_data = channel_response["items"][0]
        snippet = channel_data["snippet"]
        statistics = channel_data["statistics"]
        thumbnails = snippet.get("thumbnails", {})

        return jsonify({
            "channel_name": snippet["title"],
            "subscriber_count": statistics.get("subscriberCount", "N/A"),
            "total_videos": statistics.get("videoCount", "N/A"),
            "channel_description": snippet.get("description", "N/A"),
            "channel_location": snippet.get("country", "N/A"),
            "profile_picture": thumbnails.get("high", {}).get("url")
        })

    except Exception as e:
        logger.error(f"Error getting channel data: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/profile-picture/<channel_identifier>", methods=["GET"])
def get_profile_picture(channel_identifier):
    """Get channel profile picture by channel ID, @username, or username."""
    try:
        youtube = get_youtube_client()

        # Remove the '@' symbol if present
        if channel_identifier.startswith("@"):
            channel_identifier = channel_identifier[1:]

        # First, try to fetch the channel directly using the identifier as a channel ID
        channel_response = youtube.channels().list(
            part="snippet",
            id=channel_identifier
        ).execute()

        # If the channel is not found, try searching by username
        if not channel_response.get("items"):
            # Search for the channel using the identifier as a username
            search_response = youtube.search().list(
                part="snippet",
                q=channel_identifier,
                type="channel",
                maxResults=1
            ).execute()

            if not search_response.get("items"):
                return jsonify({"error": "Channel not found"}), 404

            # Extract the channel ID from the search results
            channel_id = search_response["items"][0]["snippet"]["channelId"]

            # Fetch channel details using the channel ID
            channel_response = youtube.channels().list(
                part="snippet",
                id=channel_id
            ).execute()

        # Check if the channel exists
        if not channel_response.get("items"):
            return jsonify({"error": "Channel not found"}), 404

        # Extract the profile picture URL from the thumbnails
        thumbnails = channel_response["items"][0]["snippet"]["thumbnails"]
        profile_picture = thumbnails.get("high", {}).get("url")

        # Return the profile picture URL
        return jsonify({
            "profile_picture": profile_picture
        })

    except Exception as e:
        logger.error(f"Error getting profile picture: {e}")
        return jsonify({"error": str(e)}), 500

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