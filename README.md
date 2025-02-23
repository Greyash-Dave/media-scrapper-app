# YouTube Scraper

## Overview
A comprehensive analytics dashboard that provides insights into YouTube channels and videos. Built with a Flask backend and React frontend, this application interacts with the YouTube Data API to deliver detailed analytics about channels, videos, and trends.

<iframe width="560" height="315" src="https://www.youtube.com/embed/Ec6fSGSY0Ls" frameborder="0" allowfullscreen></iframe>
🔗 [Watch the video on YouTube](https://www.youtube.com/watch?v=Ec6fSGSY0Ls)


## Features

### Backend Features
- **Channel Analytics**
  - Channel details (name, description, subscriber count, view count)
  - Engagement rate and upload frequency calculation
  - Playlist fetching
- **Video Analytics**
  - Detailed video metrics (title, views, likes, comments)
  - Top comments analysis
- **Trending Videos**
  - Global and region-specific trending content
- **Video Categories**
  - Category popularity analysis
- **Performance Optimization**
  - In-memory caching to reduce API calls

### Frontend Features
- **Modern UI**
  - Responsive design with Tailwind CSS
  - Floating search bar
  - Collapsible sections for URL format examples
- **Interactive Components**
  - User-friendly analytics displays
  - Trending video and category visualization
- **Error Handling**
  - Clear error messages for invalid inputs
  - API failure notifications

## Tech Stack

### Backend
- Flask (Python web framework)
- YouTube Data API v3
- Python Libraries:
  - googleapiclient
  - python-dotenv
  - functools.lru_cache
  - python-dateutil

### Frontend
- React
- Tailwind CSS
- Axios
- Lucide Icons

### Development Tools
- Postman
- Git

## Project Structure

```
backend/
├── app.py                  # Flask application and API routes
├── .env                    # Environment variables (API key, etc.)
├── requirements.txt        # Python dependencies

frontend/
├── public/
│   └── index.html         # HTML template for React app
├── src/
│   ├── components/        # Reusable React components
│   ├── App.js             # Main application component
│   ├── index.js           # Entry point for React app
│   └── styles/            # Tailwind CSS styles
```

## Setup Instructions

### Backend Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure environment variables:
   - Create `.env` file in backend directory
   - Add YouTube API key:
     ```
     API_KEY=your_youtube_api_key
     ```

3. Start Flask server:
   ```bash
   python app.py
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start React app:
   ```bash
   npm start
   ```

3. Access the application at `http://localhost:3000`

## API Endpoints

### Channel Analytics
```bash
GET /api/channel/<channel_identifier>
# Example: GET /api/channel/@ThinkSchool
```

### Video Analytics
```bash
GET /api/video/<video_id>
```

### Trending Videos
```bash
GET /api/video/trending?regionCode=US&maxResults=10
```

### Video Categories
```bash
GET /api/video/categories?regionCode=US
```

## Challenges and Solutions

- **API Quota Management**
  - Challenge: YouTube API's strict quota limits
  - Solution: Implemented LRU caching to minimize API calls

- **Input Validation**
  - Challenge: Handling invalid YouTube URLs
  - Solution: Added comprehensive input validation and error handling

- **Performance Optimization**
  - Challenge: Large dataset rendering
  - Solution: Implemented pagination and lazy loading

## Future Enhancements

- User authentication system
- Advanced analytics features
- Data export functionality (CSV/PDF)
- Mobile app version using React Native

## Contact

- **Name**: [Gresham Dave C]
- **Email**: [greyashdave@gmail.com]
- **GitHub**: [[Greyash-Dave](https://github.com/Greyash-Dave)]
- **LinkedIn**: [[Gresham-Dave](https://www.linkedin.com/in/gresham-dave)]
