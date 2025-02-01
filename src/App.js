import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./Pages/Dashboard";
import VideoRecorder from "./Pages/VideoRecorder";

const App = () => {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="p-6 bg-gray-100 min-h-screen">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/video-call" element={<VideoRecorder />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
