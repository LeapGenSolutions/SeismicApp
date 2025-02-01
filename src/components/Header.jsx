import React from "react";

const Header = () => {
  return (
    <header className="bg-blue-500 text-white shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Seismic Video Call</h1>
      <nav className="space-x-4">
        <a href="/" className="hover:underline">
          Help
        </a>
        {/* <a href="/video-call" className="hover:underline">
          Video Call
        </a> */}
      </nav>
    </header>
  );
};

export default Header;
