import React from "react";
import { Shield, Heart, Zap, Users } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Empathy First",
    description: "Every interaction is guided by compassion and understanding for families in their darkest hours."
  },
  {
    icon: Shield, 
    title: "Privacy Protected",
    description: "Your family's story is secure. We use ethical tracking and respect your privacy at every step."
  },
  {
    icon: Zap,
    title: "Technology Driven",
    description: "AI-powered insights and modern tools help turn tips into actionable leads faster than ever."
  },
  {
    icon: Users,
    title: "Community Powered",
    description: "Harness the collective power of communities who care and want to help bring answers."
  }
];

export default function MissionSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-slate-50 to-orange-50/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold gradient-text mb-4">
            Our Mission
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            We believe technology should serve humanity's highest purpose: helping families find answers, 
            communities come together, and justice prevail.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <div key={index} className="floating-card text-center group">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 h-full">
                <div className="w-16 h-16 accent-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <value.icon className="w-8 h-8 text-slate-800" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">{value.title}</h3>
                <p className="text-slate-600 leading-relaxed">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-8 py-4 shadow-lg">
            <div className="w-8 h-8 accent-gradient rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-slate-800" />
            </div>
            <span className="font-semibold text-slate-800">
              Together, we bring hope where it's needed most
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}