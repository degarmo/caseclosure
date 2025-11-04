
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, User, Camera, MessageCircle, Clock, Heart } from "lucide-react";

const navigationItems = [
  {
    title: "Home",
    url: createPageUrl("Home"),
    icon: Home,
  },
  {
    title: "About",
    url: createPageUrl("About"),
    icon: User,
  },
  {
    title: "Spotlight",
    url: createPageUrl("Spotlight"),
    icon: Camera,
  },
  {
    title: "Timeline",
    url: createPageUrl("Timeline"),
    icon: Clock,
  },
  {
    title: "Contact",
    url: createPageUrl("Contact"),
    icon: MessageCircle,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to={createPageUrl("Home")} 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Find Sarah
                </h1>
                <p className="text-xs text-gray-500">Help Bring Her Home</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                    location.pathname === item.url
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>

            {/* Emergency Contact Button */}
            <div className="hidden md:block">
              <a
                href="tel:911"
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-medium transition-colors"
              >
                Call 911
              </a>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden mt-4 flex justify-center">
            <div className="flex gap-1 bg-gray-100 rounded-full p-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-full transition-all duration-200 ${
                    location.pathname === item.url
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-xs">{item.title}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="mb-4">
            <Heart className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Help Bring Sarah Home</h3>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-sm text-gray-400">
            <span>Case #: MP2024-001</span>
            <span className="hidden md:block">|</span>
            <span>Missing since: January 15, 2024</span>
            <span className="hidden md:block">|</span>
            <a href="tel:911" className="text-red-400 hover:text-red-300">
              Emergency: Call 911
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            If you have any information, please contact local authorities immediately.
          </p>
        </div>
      </footer>
    </div>
  );
}
