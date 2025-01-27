import React from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, Eye, ThumbsUp } from "lucide-react";

const VideoResults = () => {
  const location = useLocation();
  const videoData = location.state?.data;

  // Function to process links in comment text
  const processCommentText = (text) => {
    // Replace newlines with <br> tags and style links
    return text
      .replace(/\n/g, '<br>')
      .replace(
        /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>(.*?)<\/a>/g,
        '<a href="$1" class="text-blue-600 hover:text-blue-800 hover:underline" target="_blank" rel="noopener noreferrer">$3</a>'
      );
  };

  if (!videoData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
          <h1 className="text-2xl font-bold mb-6 text-center">Error</h1>
          <p className="text-center text-red-600">
            No video data found. Please go back and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex flex-col items-center ">
          <h1 className="text-3xl font-bold mb-6">{videoData.video_title}</h1>
          {videoData.thumbnail && (
            <img
              src={videoData.thumbnail}
              alt={videoData.video_title}
              className="w-8/12 rounded-lg mb-6"
            />
          )}
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">{videoData.view_count.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">{videoData.like_count.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">{videoData.comment_count.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {videoData.comments && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Comments</h2>
            <div className="space-y-6">
              {videoData.comments.map((comment, index) => (
                <div key={index} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                  <div className="flex gap-4">
                    {comment.profile_picture ? (
                      <img
                        src={comment.profile_picture}
                        alt={comment.username}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-lg">
                          {comment.username[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {comment.username}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div 
                        className="text-gray-700 prose prose-sm max-w-none prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
                        dangerouslySetInnerHTML={{
                          __html: processCommentText(comment.comment)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoResults;