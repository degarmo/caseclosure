import React from "react";
import { FiUser, FiLogOut } from "react-icons/fi";

export default function Topbar({ user, onLogout }) {
  return (
    <header className="w-full flex items-center justify-between bg-white border-b p-4 shadow">
      <span className="font-medium text-lg">
        Welcome, {user?.first_name ? user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1) : "User"}
      </span>
      <div className="flex items-center gap-4">
        <FiUser className="text-xl" />
        <button onClick={onLogout} className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-1">
          <FiLogOut /> Logout
        </button>
      </div>
    </header>
  );
}
