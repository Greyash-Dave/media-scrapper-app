import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Results from "./pages/Results";
import UserDetails from "./pages/UserDetails";
import './index.css'; // Import Tailwind CSS

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/results" element={<Results />} />
        <Route path="/user-details/:username" element={<UserDetails />} />
      </Routes>
    </Router>
  );
};

export default App;