import os
import logging
from datetime import datetime
from functools import lru_cache
from typing import Dict, Optional, List

import googleapiclient.discovery
from googleapiclient.errors import HttpError
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dateutil import parser

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

# Helper Functions
def is_valid_channel_identifier(identifier: str) -> bool:
    """Validate channel identifier (ID, handle, or custom URL)."""
    if not identifier or len(identifier) < 2:
        return False
    # Check if it's a valid channel ID (starts with UC)
    if identifier.startswith("UC") and len(identifier) == 24:
        return True
    # Check if it's a valid handle (starts with @)
    if identifier.startswith("@"):
        return True
    # Check if it's a custom URL (e.g., youtube.com/c/username)
    if "youtube.com" in identifier:
        return True
    return False

def get_channel_id(youtube, channel_identifier: str) -> str:
    """Get channel ID from channel identifier (ID, handle, or custom URL)."""
    # If it's already a channel ID
    if channel_identifier.startswith("UC"):
        return channel_identifier
        
    # Search for channel by handle/custom URL
    try:
        search_response = youtube.search().list(
            part="id",
            q=channel_identifier,
            type="channel",
            maxResults=1
        ).execute()

        if not search_response.get("items"):
            raise ValueError("Channel not found")

        return search_response["items"][0]["id"]["channelId"]
    except HttpError as e:
        logger.error(f"Search error: {e}")
        raise ValueError("Failed to search for channel")

def get_uploads_playlist_id(youtube, channel_id: str) -> str:
    """Get the uploads playlist ID for a channel."""
    try:
        channel_response = youtube.channels().list(
            part="contentDetails",
            id=channel_id
        ).execute()
        return channel_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
    except Exception as e:
        logger.error(f"Error fetching uploads playlist ID: {e}")
        raise ValueError("Failed to fetch uploads playlist ID")

def get_channel_playlists(youtube, channel_id: str) -> List[Dict]:
    """Fetch playlists created by the channel."""
    try:
        playlists_response = youtube.playlists().list(
            part="snippet,contentDetails",
            channelId=channel_id,
            maxResults=50  # Fetch up to 50 playlists
        ).execute()

        playlists = []
        for playlist in playlists_response.get("items", []):
            playlists.append({
                "id": playlist["id"],
                "title": playlist["snippet"]["title"],
                "description": playlist["snippet"].get("description", ""),
                "thumbnail": playlist["snippet"]["thumbnails"].get("high", {}).get("url"),
                "item_count": playlist["contentDetails"]["itemCount"],
                "published_at": playlist["snippet"]["publishedAt"]
            })

        return playlists

    except Exception as e:
        logger.error(f"Error fetching playlists for channel {channel_id}: {e}")
        return []

def calculate_upload_frequency(youtube, channel_id: str) -> Dict:
    """Calculate average upload frequency based on recent videos."""
    try:
        uploads_playlist_id = get_uploads_playlist_id(youtube, channel_id)
        playlist_items = youtube.playlistItems().list(
            part="snippet",
            playlistId=uploads_playlist_id,
            maxResults=50
        ).execute()

        if not playlist_items.get("items"):
            return {"frequency": "No recent uploads", "uploads_per_month": 0}

        upload_dates = [
            parser.parse(item["snippet"]["publishedAt"])
            for item in playlist_items["items"]
        ]
        upload_dates.sort(reverse=True)

        if len(upload_dates) < 2:
            return {"frequency": "Insufficient data", "uploads_per_month": 0}

        total_days = (upload_dates[0] - upload_dates[-1]).days
        if total_days == 0:
            return {"frequency": "Multiple uploads per day", "uploads_per_month": 30}

        uploads_per_month = (len(upload_dates) * 30) / total_days

        if uploads_per_month >= 30:
            frequency = "Daily or more"
        elif uploads_per_month >= 4:
            frequency = f"{round(uploads_per_month / 4, 1)} times per week"
        else:
            frequency = f"{round(uploads_per_month, 1)} times per month"

        return {
            "frequency": frequency,
            "uploads_per_month": round(uploads_per_month, 2)
        }

    except Exception as e:
        logger.error(f"Error calculating upload frequency: {e}")
        return {"frequency": "Unable to calculate", "uploads_per_month": 0}

def calculate_engagement_rate(statistics: Dict) -> float:
    """Calculate channel engagement rate."""
    try:
        subscribers = int(statistics.get("subscriberCount", 0))
        if subscribers == 0:
            return 0.0

        views = int(statistics.get("viewCount", 0))
        videos = int(statistics.get("videoCount", 0))

        if videos == 0:
            return 0.0

        average_views = views / videos
        engagement_rate = (average_views / subscribers) * 100

        return round(engagement_rate, 2)
    except (ValueError, TypeError, KeyError) as e:
        logger.error(f"Error calculating engagement rate: {e}")
        return 0.0

def format_count(count) -> str:
    """Format large numbers for readability."""
    try:
        count = int(count)
        if count >= 1_000_000:
            return f"{count/1_000_000:.1f}M"
        elif count >= 1_000:
            return f"{count/1_000:.1f}K"
        return str(count)
    except (ValueError, TypeError):
        return "0"

@lru_cache(maxsize=1000)
def get_cached_channel_data(channel_id: str) -> Optional[Dict]:
    """Get cached channel data if available and not expired."""
    # Example: Use a dictionary to simulate caching
    cache = {}
    return cache.get(channel_id)

# API Routes
@app.route("/api/channel/<channel_identifier>", methods=["GET"])
def get_channel(channel_identifier: str):
    """Get channel details and analytics using ID, handle, or custom URL."""
    try:
        # Input validation
        if not is_valid_channel_identifier(channel_identifier):
            return jsonify({"error": "Invalid channel identifier"}), 400

        # Remove @ symbol if present in handle
        channel_identifier = channel_identifier.lstrip('@')

        youtube = get_youtube_client()

        try:
            channel_id = get_channel_id(youtube, channel_identifier)
        except ValueError as e:
            return jsonify({"error": str(e)}), 404

        # Get cached data if available
        cached_data = get_cached_channel_data(channel_id)
        if cached_data:
            return jsonify(cached_data)

        # Get channel details
        try:
            channel_response = youtube.channels().list(
                part="snippet,statistics,contentDetails,brandingSettings",
                id=channel_id
            ).execute()
        except HttpError as e:
            if e.resp.status == 403:
                return jsonify({"error": "YouTube API quota exceeded"}), 429
            raise

        if not channel_response.get("items"):
            return jsonify({"error": "Channel not found"}), 404

        channel_data = channel_response["items"][0]
        snippet = channel_data["snippet"]
        statistics = channel_data["statistics"]
        content_details = channel_data.get("contentDetails", {})
        thumbnails = snippet.get("thumbnails", {})

        # Get enhanced analytics
        analytics = {
            "upload_frequency": calculate_upload_frequency(youtube, channel_id),
            "playlists": get_channel_playlists(youtube, channel_id),
            "engagement_rate": calculate_engagement_rate(statistics)
        }

        response_data = {
            "channel_id": channel_id,
            "channel_name": snippet["title"],
            "subscriber_count": format_count(statistics.get("subscriberCount", "0")),
            "total_videos": format_count(statistics.get("videoCount", "0")),
            "view_count": format_count(statistics.get("viewCount", "0")),
            "channel_description": snippet.get("description", "N/A"),
            "channel_location": snippet.get("country", "N/A"),
            "profile_picture": thumbnails.get("high", {}).get("url"),
            "analytics": analytics,
            "created_at": snippet.get("publishedAt"),
            "last_updated": datetime.utcnow().isoformat()
        }

        # Cache the response
        cache = {}
        cache[channel_id] = response_data

        return jsonify(response_data)

    except HttpError as e:
        logger.error(f"YouTube API error: {e}")
        return jsonify({"error": "YouTube API error", "details": str(e)}), 500
    except Exception as e:
        logger.error(f"Error getting channel data: {e}")
        return jsonify({"error": "Internal server error"}), 500

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

@app.route("/api/video/trending", methods=["GET"])
def get_trending_videos():
    """Fetch trending videos in a specific region or globally."""
    try:
        youtube = get_youtube_client()

        # Get region from query parameters (default to global if not provided)
        region_code = request.args.get("regionCode", "US")  # Default to US if not specified
        max_results = int(request.args.get("maxResults", 10))  # Default to 10 results

        # Fetch trending videos
        trending_response = youtube.videos().list(
            part="snippet,statistics",
            chart="mostPopular",
            regionCode=region_code,
            maxResults=max_results
        ).execute()

        trending_videos = []
        for video in trending_response.get("items", []):
            snippet = video["snippet"]
            statistics = video["statistics"]
            trending_videos.append({
                "video_id": video["id"],
                "title": snippet["title"],
                "description": snippet.get("description", ""),
                "thumbnail": snippet["thumbnails"]["high"]["url"],
                "view_count": statistics.get("viewCount", "N/A"),
                "like_count": statistics.get("likeCount", "N/A"),
                "comment_count": statistics.get("commentCount", "N/A"),
                "published_at": snippet["publishedAt"]
            })

        return jsonify({
            "region_code": region_code,
            "trending_videos": trending_videos
        })

    except HttpError as e:
        logger.error(f"YouTube API error: {e}")
        return jsonify({"error": "YouTube API error", "details": str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching trending videos: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/video/categories", methods=["GET"])
def get_video_categories():
    """Fetch video categories and their popularity."""
    try:
        youtube = get_youtube_client()

        # Get region from query parameters (default to global if not provided)
        region_code = request.args.get("regionCode", "US")  # Default to US if not specified

        # Fetch video categories
        categories_response = youtube.videoCategories().list(
            part="snippet",
            regionCode=region_code
        ).execute()

        categories = []
        for category in categories_response.get("items", []):
            categories.append({
                "category_id": category["id"],
                "title": category["snippet"]["title"],
                "assignable": category["snippet"]["assignable"]
            })

        return jsonify({
            "region_code": region_code,
            "categories": categories
        })

    except HttpError as e:
        logger.error(f"YouTube API error: {e}")
        return jsonify({"error": "YouTube API error", "details": str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching video categories: {e}")
        return jsonify({"error": "Internal server error"}), 500

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