// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// --- ADD THIS LINE ---
// Tell the index.html script that the React app is ready
if (window.markAppAsReady) {
  window.markAppAsReady();
}
// --- END ---