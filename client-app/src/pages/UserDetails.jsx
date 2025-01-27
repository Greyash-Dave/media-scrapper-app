import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserCircle } from "lucide-react";

const UserDetails = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Construct proper YouTube URL
        let youtubeUrl;
        if (username.startsWith('UC')) {
          // If it's a channel ID
          youtubeUrl = `https://youtube.com/channel/${username}`;
        } else if (username.startsWith('@')) {
          // If it's already a handle
          youtubeUrl = `https://youtube.com/${username}`;
        } else {
          // Assume it's a handle and add @
          youtubeUrl = `https://youtube.com/@${username}`;
        }

        const response = await axios.post("/scrape", {
          url: youtubeUrl,
        });

        if (response.data.error) {
          throw new Error(response.data.error);
        }

        setUserData(response.data);
      } catch (err) {
        setError(err.message || "Failed to fetch user data");
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="text-center">Loading channel information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-blue-600 hover:underline"
          >
            &larr; Back to Video
          </button>
          <div className="text-center text-red-600">
            <p className="font-medium">Error loading channel</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Channel Details</h1>

        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-blue-600 hover:underline"
        >
          &larr; Back to Video
        </button>

        <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-700">
          {userData && userData.channel_name ? (
            <>
              <div className="flex justify-center mb-4">
                {userData.profile_picture ? (
                  <img
                    src={userData.profile_picture}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle size={96} className="text-gray-400" />
                )}
              </div>
              <div className="space-y-2">
                <p><strong>Channel Name:</strong> {userData.channel_name}</p>
                <p><strong>Subscribers:</strong> {Number(userData.subscriber_count).toLocaleString()}</p>
                <p><strong>Total Videos:</strong> {Number(userData.total_videos).toLocaleString()}</p>
                <p><strong>Location:</strong> {userData.channel_location !== "N/A" ? userData.channel_location : "Not specified"}</p>
                {userData.channel_description !== "N/A" && (
                  <div>
                    <strong>Description:</strong>
                    <p className="mt-1 whitespace-pre-wrap text-xs">{userData.channel_description}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <UserCircle size={96} className="text-gray-400" />
              </div>
              <p className="font-medium text-base">{username}</p>
              <p className="text-gray-500 mt-2">Channel information not available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetails;