import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Terminal, LogIn, LogOut, User } from "lucide-react";
import logo from "../assets/uam-logo.png";

const Navbar: React.FC = () => {
  const location = useLocation();
  const isAuthenticated =
    location.pathname.includes("dashboard") ||
    location.pathname.includes("register-student");

  // Try to retrieve user from local storage
  const savedUser = localStorage.getItem("it_logger_user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <nav className="bg-[#28a745] border-b border-[#28a745] sticky top-0 z-50 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="">
                <img src={logo} width={50} height={50} alt="" />
              </div>

              <span className="font-bold text-xl tracking-tight">
                IT Logger System
              </span>
            </Link>
          </div>

          {!isAuthenticated && (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors hover:bg-[#28a745]/20"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            </div>
          )}

          {isAuthenticated && user && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-white">
                  {user.full_name || "User"}
                </span>
                <span className="text-xs text-green-200 capitalize">
                  {user.userRole === "STUDENT" ? "Student" : "Administrator"}
                </span>
              </div>

              <div className="h-9 w-9 rounded-full bg-[#28a745] flex items-center justify-center text-white font-bold border-2 border-[#1e5c30] shadow-lg overflow-hidden relative">
                {user.photo_url ? (
                  <img
                    src={user.photo_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs">{getInitials(user.full_name)}</span>
                )}
              </div>

              <Link
                to="/login"
                onClick={() => localStorage.removeItem("it_logger_user")}
                className="ml-4 text-green-200 hover:text-white p-2 rounded-full hover:bg-[#28a745]/20 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
