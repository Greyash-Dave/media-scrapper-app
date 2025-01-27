import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'https://media-scrapper-app.vercel.app'  // Your Flask app URL
});

const Home = () => {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  const extractIdentifier = (url) => {
    if (url.includes("/channel/")) {
      return url.split("/channel/")[1].split("/")[0];
    } else if (url.includes("/c/") || url.includes("/user/") || url.includes("/@")) {
      return url.split("/").pop();
    } else if (url.includes("v=")) {
      return url.split("v=")[1].split("&")[0];
    } else if (url.includes("/shorts/")) {
      return url.split("/shorts/")[1].split("/")[0];
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidYouTubeUrl(link)) {
      setError("Invalid YouTube URL. Please check the link.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const identifier = extractIdentifier(link);
      let endpoint = "/api/video";
      if (!link.includes("watch?v=") && !link.includes("/shorts/")) {
        endpoint = "/api/channel";
      }

      const response = await api.get(`${endpoint}/${identifier}`);
      navigate("/results", { state: { data: response.data } });
    } catch (err) {
      console.error('API Error:', err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
      setLink("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">YouTube Scraper</h1>
        <form onSubmit={handleSubmit} className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter YouTube URL
          </label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://www.youtube.com/@username/"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? "Loading..." : "Scrape Data"}
          </button>
        </form>
        {error && <div className="mt-4 text-red-600 text-sm">{error}</div>}
      </div>
    </div>
  );
};

export default Home;