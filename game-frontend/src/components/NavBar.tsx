import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const NavBar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-semibold hover:opacity-80">Home</Link>
          <Link to="/game" className="text-gray-700 hover:text-gray-900">Game</Link>
          <Link to="/leaderboard" className="text-gray-700 hover:text-gray-900">Leaderboard</Link>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-700">👋 {user?.nickname || user?.email}</span>
              <button
                onClick={logout}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-gray-900">Login</Link>
              <Link to="/signup" className="text-gray-700 hover:text-gray-900">Signup</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
