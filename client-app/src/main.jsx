import React from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot
import App from './App';
import './index.css'; // Import Tailwind CSS

// Replace ReactDOM.render with createRoot
const container = document.getElementById('root');
const root = createRoot(container); // Create a root
root.render(<App />); // Render your app