import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Users, Video, Upload, Eye } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const ChannelResults = () => {
  const location = useLocation();
  const channelData = location.state?.data;

  if (!channelData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm w-96">
          <h2 className="text-xl font-bold text-center">Error</h2>
          <p className="text-center text-red-600 mt-2">
            No channel data found. Please try again.
          </p>
        </div>
      </div>
    );
  }

  const { analytics = {}, playlists = [] } = channelData.analytics || {};
  const uploadStats = analytics.upload_frequency || {};

  const statsCards = [
    {
      title: 'Subscribers',
      value: channelData.subscriber_count,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Total Videos',
      value: channelData.total_videos,
      icon: Video,
      color: 'text-purple-600',
    },
    {
      title: 'Total Views',
      value: channelData.view_count,
      icon: Eye,
      color: 'text-orange-600',
    },
  ];

  const playlistData = playlists.map((playlist) => ({
    name: playlist.title.length > 20 ? playlist.title.substring(0, 20) + '...' : playlist.title,
    value: playlist.item_count,
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#f43f5e', '#14b8a6'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-6 bg-white p-6 rounded-lg shadow-sm">
          <img
            src={channelData.profile_picture}
            alt={channelData.channel_name}
            className="w-24 h-24 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold">{channelData.channel_name}</h1>
            <p className="text-gray-600 mt-1">
              {channelData.channel_description.substring(0, 200)}...
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 items-center ">
          {/* Upload Frequency Card */}
          {/* <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Upload Frequency</h2>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{uploadStats.frequency}</p>
                <p className="text-gray-600 mt-2">Average Upload Rate</p>
              </div>
            </div>
          </div> */}

          {/* Top Playlists Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Top Playlists</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={playlistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {playlistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* All Playlists Grid */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">All Playlists</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
              <div key={playlist.id} className="p-4 border rounded-lg">
                <img
                  src={playlist.thumbnail}
                  alt={playlist.title}
                  className="w-full h-32 object-cover rounded-md"
                />
                <h3 className="font-semibold mt-2">
                  {playlist.title.length > 30 ? playlist.title.substring(0, 30) + '...' : playlist.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{playlist.item_count} videos</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelResults;
