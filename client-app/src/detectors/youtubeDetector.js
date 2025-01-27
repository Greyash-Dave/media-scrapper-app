// src/detectors/youtubeDetector.js
const detectYouTube = (url) => {
    let pageType = '';
    let username = '';
  
    if (url.includes('/shorts/')) {
      pageType = 'Shorts';
    } else if (url.includes('/watch?v=')) {
      pageType = 'Video';
    } else if (url.includes('/@')) {
      pageType = 'Channel Page';
      // Extract username
      const match = url.match(/youtube\.com\/@([^\/]+)/);
      username = match ? match[1] : '';
    } else if (url.endsWith('youtube.com') || url.endsWith('youtube.com/')) {
      pageType = 'Homepage';
    } else {
      pageType = 'Unknown';
    }
  
    return { platform: 'YouTube', pageType, username };
  };
  
  export default detectYouTube;