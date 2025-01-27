import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const scrapedData = location.state?.data;

  // Function to handle button click
  const handleUserClick = (username) => {
    navigate(`/user-details/${username}`);
  };

  // Check if the data is valid
  if (!scrapedData || (!scrapedData.channel_name && !scrapedData.video_title)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">Error</h1>
          <p className="text-center text-red-600">
            No valid data found. Please go back and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Scraped Data</h1>

        <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-700">
          {/* Display Channel Data */}
          {scrapedData.channel_name && (
            <>
              {/* Display Profile Picture */}
              {scrapedData.profile_picture && (
                <div className="flex justify-center mb-4">
                  <img
                    src={scrapedData.profile_picture}
                    alt="Profile"
                    className="w-24 h-24 rounded-full"
                  />
                </div>
              )}
              <p><strong>Channel Name:</strong> {scrapedData.channel_name}</p>
              <p><strong>Subscribers:</strong> {scrapedData.subscriber_count}</p>
              <p><strong>Total Videos:</strong> {scrapedData.total_videos}</p>
              <p><strong>Description:</strong> {scrapedData.channel_description}</p>
              <p><strong>Location:</strong> {scrapedData.channel_location}</p>
            </>
          )}

          {/* Display Video Data */}
          {scrapedData.video_title && (
            <>
              <p><strong>Video Title:</strong> {scrapedData.video_title}</p>
              <p><strong>Views:</strong> {scrapedData.view_count}</p>
              <p><strong>Likes:</strong> {scrapedData.like_count}</p>
              <p><strong>Comments:</strong> {scrapedData.comment_count}</p>
              {scrapedData.thumbnail && (
                            <img
                              src={scrapedData.thumbnail}
                              alt={scrapedData.thumbnail}
                              className="w-auto h-auto my-5"
                            />
              )}
              {scrapedData.comments && (
                <div>
                  <h3 className="font-semibold mt-4">Comments:</h3>
                  <ul>
                    {scrapedData.comments.map((comment, index) => (
                      <li key={index} className="mt-2">
                        <div className="flex items-center space-x-2">
                          {/* Display Commenter's Profile Picture */}
                          {comment.profile_picture && (
                            <img
                              src={comment.profile_picture}
                              alt={comment.username}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <p><strong>{comment.username}</strong>: {comment.comment}</p>
                            <p className="text-xs text-gray-500">{comment.timestamp}</p>
                            {/* Button to view user details */}
                            <button
                              onClick={() => handleUserClick(comment.username)}
                              className="mt-1 text-blue-600 hover:underline"
                            >
                              View Channel
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Results;