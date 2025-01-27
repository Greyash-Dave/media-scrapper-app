// src/detectors/platformDetector.js
import detectYouTube from './youtubeDetector';
import detectInstagram from './instagramDetector';
import detectTikTok from './tiktokDetector';
import detectFacebook from './facebookDetector';

const identifyPlatformAndPageType = (url) => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return detectYouTube(url);
  } else if (url.includes('tiktok.com')) {
    return detectTikTok(url);
  } else if (url.includes('instagram.com')) {
    return detectInstagram(url);
  } else if (url.includes('facebook.com')) {
    return detectFacebook(url);
  } else {
    return { platform: 'Unknown', pageType: 'Unknown', username: '' };
  }
};

export default identifyPlatformAndPageType;