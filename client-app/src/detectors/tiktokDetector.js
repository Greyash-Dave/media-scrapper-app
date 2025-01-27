// src/detectors/tiktokDetector.js
const detectTikTok = (url) => {
    let pageType = '';
    let username = '';
  
    if (url.includes('/video/')) {
      pageType = 'Post';
    } else if (url.includes('/@')) {
      pageType = 'Profile Page';
      // Extract username
      const match = url.match(/tiktok\.com\/@([^\/]+)/);
      username = match ? match[1] : '';
    } else if (url.endsWith('tiktok.com') || url.endsWith('tiktok.com/')) {
      pageType = 'Homepage';
    } else {
      pageType = 'Unknown';
    }
  
    return { platform: 'TikTok', pageType, username };
  };
  
  export default detectTikTok;