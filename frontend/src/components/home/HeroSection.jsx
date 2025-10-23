import React from "react";
import { ArrowRight, Heart, Search } from "lucide-react";

export default function HeroSection() {
  const handleSignupClick = () => {
    window.location.href = "/signup";
  };

  const handleAboutClick = () => {
    window.location.href = "/about";
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-orange-100/20 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                <span className="gradient-text">Every Story</span>
                <br />
                <span className="text-slate-800">Deserves Justice</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-lg">
                Create a dedicated space for your loved one's case. Connect with your community. 
                Turn tips into breakthroughs. Never give up hope.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleSignupClick}
                className="accent-gradient text-slate-800 hover:shadow-lg transition-all duration-300 rounded-full px-8 py-4 text-lg font-semibold inline-flex items-center justify-center group cursor-pointer"
              >
                Start a Case Page
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={handleAboutClick}
                className="border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-full px-8 py-4 text-lg inline-flex items-center justify-center transition-all duration-300 cursor-pointer"
              >
                Learn How It Works
              </button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">1000+</div>
                <div className="text-sm text-slate-500">Cases Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">50+</div>
                <div className="text-sm text-slate-500">Cases Solved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">24/7</div>
                <div className="text-sm text-slate-500">Community Support</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="floating-card bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Sarah's Story</div>
                    <div className="text-sm text-slate-500">Missing since March 2023</div>
                  </div>
                </div>
                
                <img 
                  src="https://images.unsplash.com/photo-1494790108755-2616c64e8e03?w=400&h=300&fit=crop&crop=face"
                  alt="Case example"
                  className="w-full h-48 object-cover rounded-2xl"
                />
                
                <div className="space-y-3">
                  <div className="text-sm text-slate-600">
                    "Thanks to CaseClosure, we received 127 new tips and finally found the breakthrough we needed."
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Last tip: 2 hours ago</span>
                    <div className="flex items-center gap-1">
                      <Search className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-400">Active investigation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -top-4 -right-4 w-24 h-24 accent-gradient rounded-full opacity-20 blur-xl" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-slate-200 rounded-full opacity-30 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}