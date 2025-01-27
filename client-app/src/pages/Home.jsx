import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Youtube, Loader2, TrendingUp, List, Search } from "lucide-react";

const Home = () => {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [videoCategories, setVideoCategories] = useState([]);
  const navigate = useNavigate();

  const isValidYouTubeUrl = (url) => {
    const patterns = [
      /^(https?:\/\/)?(www\.)?youtube\.com\/channel\/[^/]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/c\/[^/]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/user\/[^/]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/@[^/]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[^&]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[^/]+/,
    ];
    return patterns.some((pattern) => pattern.test(url));
  };

  const extractChannelUsername = (url) => {
    try {
      if (url.includes("/@")) {
        return '@' + url.split("/@")[1].split(/[/?]/)[0];
      }
      if (url.includes("/c/")) {
        return '@' + url.split("/c/")[1].split(/[/?]/)[0];
      }
      if (url.includes("/user/")) {
        return '@' + url.split("/user/")[1].split(/[/?]/)[0];
      }
      if (url.includes("/channel/")) {
        return url.split("/channel/")[1].split(/[/?]/)[0];
      }
      if (url.includes("/watch?v=")) {
        const videoId = url.split("v=")[1].split(/[&?]/)[0];
        return videoId;
      }
      if (url.includes("/shorts/")) {
        return url.split("/shorts/")[1].split(/[/?]/)[0];
      }
      return null;
    } catch (err) {
      console.error("Error extracting channel username:", err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!link.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }
    if (!isValidYouTubeUrl(link)) {
      setError("Invalid YouTube URL. Please check the link.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const identifier = extractChannelUsername(link);
      if (!identifier) {
        throw new Error("Could not extract channel or video identifier. Please use a valid YouTube URL.");
      }
      const isVideo = link.includes("watch?v=") || link.includes("/shorts/");
      const endpoint = isVideo ? "/api/video" : "/api/channel";
      const resultRoute = isVideo ? "/video-results" : "/channel-results";
      const response = await axios.get(`https://media-scrapper-app.vercel.app${endpoint}/${identifier}`);
      if (!response.data) {
        throw new Error("Invalid data received from server");
      }
      navigate(resultRoute, { state: { data: response.data } });
    } catch (err) {
      setError(err.message || err.response?.data?.message || "Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setLink(text);
      setError("");
    } catch (err) {
      setError("Failed to paste from clipboard");
    }
  };

  const fetchTrendingVideos = async () => {
    try {
      const response = await axios.get("https://media-scrapper-app.vercel.app/api/video/trending");
      setTrendingVideos(response.data.trending_videos);
    } catch (err) {
      console.error("Error fetching trending videos:", err);
    }
  };

  const fetchVideoCategories = async () => {
    try {
      const response = await axios.get("https://media-scrapper-app.vercel.app/api/video/categories");
      setVideoCategories(response.data.categories);
    } catch (err) {
      console.error("Error fetching video categories:", err);
    }
  };

  useEffect(() => {
    fetchTrendingVideos();
    fetchVideoCategories();
  }, [])
  

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Floating Search Bar */}
      <div className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Youtube className="w-8 h-8 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-800">YouTube Scraper</h1>
            </div>
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={link}
                  onChange={(e) => {
                    setLink(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter YouTube URL"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-24"
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700 font-medium px-2 py-1"
                >
                  Paste
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </form>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Video Analytics Section */}
      <div className="mt-5 pt-20 pb-8 w-full h-full flex flex-col items-center ">
      <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer">
            <h3 className="text-lg font-semibold text-gray-700">Example URL Formats</h3>
            <svg
              className="w-5 h-5 text-gray-500 transition-transform transform group-open:rotate-180"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </summary>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p>Here are some example formats you can use:</p>
            <ul className="list-disc list-inside">
              <li>
                <code className="bg-gray-100 p-1 rounded">https://www.youtube.com/@User/videos</code> → <span className="font-semibold">@User</span>
              </li>
              <li>
                <code className="bg-gray-100 p-1 rounded">https://www.youtube.com/@User/featured</code> → <span className="font-semibold">@User</span>
              </li>
              <li>
                <code className="bg-gray-100 p-1 rounded">https://www.youtube.com/c/User</code> → <span className="font-semibold">@User</span>
              </li>
              <li>
                <code className="bg-gray-100 p-1 rounded">https://www.youtube.com/channel/UC1234567890</code> → <span className="font-semibold">UC1234567890</span>
              </li>
              <li>
                <code className="bg-gray-100 p-1 rounded">https://www.youtube.com/watch?v=VIDEO_ID</code> → <span className="font-semibold">VIDEO_ID</span>
              </li>
              <li>
                <code className="bg-gray-100 p-1 rounded">https://www.youtube.com/shorts/VIDEO_ID</code> → <span className="font-semibold">VIDEO_ID</span>
              </li>
            </ul>
          </div>
        </details>
      </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2" />
          Popular Video Analytics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trending Videos */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <List className="w-5 h-5 mr-2" />
              Trending Videos
            </h3>
            {/* <button
              onClick={fetchTrendingVideos}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Fetch Trending Videos
            </button> */}
            {trendingVideos.length > 0 && (
              <div className="mt-4 space-y-4 h-full overflow-y-auto">
                {trendingVideos.map((video) => (
                  <div key={video.video_id} className="flex items-center space-x-4">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-16 h-16 rounded-lg"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{video.title}</p>
                      <p className="text-xs text-gray-500">{video.view_count} views</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video Categories */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <List className="w-5 h-5 mr-2" />
              Video Categories
            </h3>
            {/* <button
              onClick={fetchVideoCategories}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Fetch Video Categories
            </button> */}
            {videoCategories.length > 0 && (
              <div className="mt-4 space-y-2 h-full overflow-y-auto">
                {videoCategories.map((category) => (
                  <div key={category.category_id} className="text-sm text-gray-700">
                    {category.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;