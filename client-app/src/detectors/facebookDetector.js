// src/detectors/facebookDetector.js
const detectFacebook = (url) => {
    let pageType = '';
    let username = '';
  
    if (url.includes('/posts/') || url.includes('/photos/') || url.includes('/videos/')) {
      pageType = 'Post';
    } else if (url.includes('/profile.php') || (url.split('/').length === 4 && !url.includes('/posts/'))) {
      pageType = 'Profile Page';
      // Extract username
      const match = url.match(/facebook\.com\/([^\/]+)/);
      username = match ? match[1] : '';
    } else if (url.endsWith('facebook.com') || url.endsWith('facebook.com/')) {
      pageType = 'Homepage';
    } else {
      pageType = 'Unknown';
    }
  
    return { platform: 'Facebook', pageType, username };
  };
  
  export default detectFacebook;