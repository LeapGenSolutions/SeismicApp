import React from "react";
import { FaHome, FaVideo, FaCalendar, FaSignOutAlt } from "react-icons/fa";

const Sidebar = () => {
  return (
    <aside className="bg-gray-800 text-white w-64 h-screen flex flex-col">
      <div className="text-center py-6">
        <h2 className="text-2xl font-semibold">Seismic Connect</h2>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2 px-4">
          <li>
            <a
              href="/"
              className="flex items-center space-x-3 px-4 py-2 rounded hover:bg-gray-700"
            >
              <FaHome />
              <span>Dashboard</span>
            </a>
          </li>
          <li>
            <a
              href="/video-call"
              className="flex items-center space-x-3 px-4 py-2 rounded hover:bg-gray-700"
            >
              <FaVideo />
              <span>Video Call</span>
            </a>
          </li>
          <li>
            <a
              href="/schedule"
              className="flex items-center space-x-3 px-4 py-2 rounded hover:bg-gray-700"
            >
              <FaCalendar />
              <span>Schedule</span>
            </a>
          </li>
        </ul>
      </nav>
      <div className="px-4 py-6">
        <button className="w-full flex items-center space-x-3 px-4 py-2 bg-red-400 rounded hover:bg-red-500">
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
