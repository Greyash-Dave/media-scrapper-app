// src/detectors/instagramDetector.js
const detectInstagram = (url) => {
    let pageType = '';
    let username = '';
  
    // Remove trailing slash for consistency
    const cleanedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  
    if (cleanedUrl.includes('/p/') || cleanedUrl.includes('/reel/')) {
      pageType = 'Post';
    } else if (cleanedUrl.split('/').length === 4) {
      pageType = 'Profile Page';
      // Extract username
      const match = cleanedUrl.match(/instagram\.com\/([^\/]+)/);
      username = match ? match[1] : '';
    } else if (cleanedUrl === 'https://www.instagram.com' || cleanedUrl === 'https://www.instagram.com/') {
      pageType = 'Homepage';
    } else {
      pageType = 'Unknown';
    }
  
    return { platform: 'Instagram', pageType, username };
  };
  
  export default detectInstagram;