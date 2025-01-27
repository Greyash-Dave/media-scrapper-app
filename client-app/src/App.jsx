import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import VideoResults from "./pages/VideoResults";
import ChannelResults from "./pages/ChannelResults";
import './index.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video-results" element={<VideoResults />} />
        <Route path="/channel-results" element={<ChannelResults />} />
      </Routes>
    </Router>
  );
};

export default App;