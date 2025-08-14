import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Home", url: "/" },
  { title: "About", url: "/about" },
  { title: "Services", url: "/pricing" },
  { title: "Discover", url: "/discover" },
  { title: "Spotlight", url: "/spotlight" },
  { title: "Contact", url: "/contact" },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/signin');  // Changed from '/login' to '/signin'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <style>
        {`
          :root {
            --cc-midnight: #0E1E2F;
            --cc-slate: #2A2F38;
            --cc-peach: #F7C9A6;
            --cc-gold: #FEE7B0;
          }
          
          .gradient-text {
            background: linear-gradient(135deg, var(--cc-midnight), var(--cc-slate));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .accent-gradient {
            background: linear-gradient(135deg, var(--cc-peach), var(--cc-gold));
          }
          
          .floating-card {
            transform: translateY(0);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .floating-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }

          .nav-link {
            position: relative;
            padding: 8px 16px;
            border-radius: 8px;
            transition: all 0.2s ease;
            color: #64748b;
            font-weight: 500;
          }

          .nav-link:hover {
            color: #1e293b;
            outline: 1px solid rgba(148, 163, 184, 0.3);
            background: rgba(255, 255, 255, 0.5);
          }

          .nav-link.active {
            color: #1e293b;
            background: rgba(255, 255, 255, 0.8);
            outline: 1px solid rgba(148, 163, 184, 0.2);
          }
        `}
      </style>
      
      {/* Simple Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 accent-gradient rounded-full flex items-center justify-center">
                <span className="text-slate-800 font-bold text-lg">CC</span>
              </div>
              <span className="font-bold text-2xl gradient-text">CaseClosure</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`nav-link ${location.pathname === item.url ? 'active' : ''}`}
                >
                  {item.title}
                </Link>
              ))}
            </div>
            
            <Button 
              onClick={handleLogin}
              className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Simple Bottom Navigation */}
      <div className="fixed bottom-4 left-4 right-4 lg:hidden z-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl border border-white/20">
          <div className="grid grid-cols-6 gap-1">
            {navigationItems.map((item) => (
              <Link
                key={item.title}
                to={item.url}
                className={`text-center py-2 px-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                  location.pathname === item.url
                    ? "bg-slate-800 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-20 pb-24 lg:pb-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 accent-gradient rounded-full flex items-center justify-center">
                  <span className="text-slate-800 font-bold text-lg">CC</span>
                </div>
                <span className="font-bold text-xl">CaseClosure</span>
              </div>
              <p className="text-slate-300 mb-4">
                Empowering families to seek justice through technology, community, and hope.
              </p>
              <div className="text-sm text-slate-400">
                © 2024 CaseClosure.org. All rights reserved.
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="space-y-2 text-sm text-slate-300">
                <Link to="/about" className="block hover:text-white transition-colors">How It Works</Link>
                <Link to="/pricing" className="block hover:text-white transition-colors">Services</Link>
                <a href="#" className="block hover:text-white transition-colors">Success Stories</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-sm text-slate-300">
                <Link to="/contact" className="block hover:text-white transition-colors">Contact Us</Link>
                <Link to="/request-account" className="block hover:text-white transition-colors">Request Account</Link>
                <a href="#" className="block hover:text-white transition-colors">Help Center</a>
                <a href="#" className="block hover:text-white transition-colors">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}