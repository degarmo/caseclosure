
import React from "react";
import { Heart, Target, Shield, Users, FileText, Share2, Eye, MessageSquare, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const steps = [
  {
    icon: FileText,
    title: "Create Your Case Page",
    description: "Tell your loved one's story with photos, details, and timeline. We help you build a compelling, professional case page.",
    features: ["Custom subdomain (e.g., sarah.caseclosure.org)", "Photo galleries and timeline", "Reward information display"],
    color: "bg-blue-100 text-blue-600"
  },
  {
    icon: Share2, 
    title: "Share Across Communities",
    description: "We provide tools and guidance to amplify your case across social media, local networks, and relevant communities.",
    features: ["Social media templates", "Local media outreach tools", "QR codes for physical flyers"],
    color: "bg-purple-100 text-purple-600"
  },
  {
    icon: Eye,
    title: "Crowdsourced Engagement Insights", 
    description: "Harness the power of the community to see how your case is resonating — anonymously. View geographic patterns, repeat visits, and interaction trends to understand where interest is growing.",
    features: ["Geographic engagement mapping", "Community return visits", "Anonymous interaction dashboard"],
    color: "bg-green-100 text-green-600"
  },
  {
    icon: MessageSquare,
    title: "Collect & Manage Tips",
    description: "Secure tip submission system allows people to share information anonymously or with contact details.",
    features: ["Anonymous tip submission", "Secure contact information handling", "Tip categorization and tagging"],
    color: "bg-orange-100 text-orange-600"
  },
  {
    icon: Search,
    title: "AI-Powered Analysis",
    description: "Our AI helps identify patterns, prioritize leads, and suggest investigation strategies based on your case data.",
    features: ["Pattern recognition in tips", "Lead prioritization algorithms", "Investigation strategy suggestions"],
    color: "bg-red-100 text-red-600"
  },
  {
    icon: CheckCircle,
    title: "Find Answers",
    description: "Work with law enforcement and private investigators, armed with organized data and community-generated leads.",
    features: ["Law enforcement collaboration tools", "Private investigator referrals", "Case closure celebration features"],
    color: "bg-teal-100 text-teal-600"
  }
];

export default function About() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* About Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold gradient-text mb-6">
          Our Story
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Case Closure provides families with the tools and support they need to seek justice and closure. We connect families, investigators, and communities to raise awareness and uncover truth. Our platform empowers responsible action, ensuring justice is pursued within the law.
        </p>
      </div>

      <div className="space-y-16 mb-20">
        <div className="floating-card bg-white/80 backdrop-blur-sm rounded-3xl p-8 lg:p-12 shadow-xl border border-white/20">
          <div className="flex items-start gap-6 mb-8">
            <div className="w-16 h-16 accent-gradient rounded-2xl flex items-center justify-center flex-shrink-0">
              <Heart className="w-8 h-8 text-slate-800" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Why We Exist</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Case Closure was created with a deep understanding of the pain that comes with losing a loved one to injustice.
                We grieve with you, stand with you, and remind you — <strong>you are not alone</strong>. With innovative, user-friendly tools, we empower anyone to participate in the search for truth and justice.
                Together, we ensure that no case is forgotten, no voice is silenced, and every truth has the chance to be uncovered.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="text-center mb-16">
        <h2 className="text-3xl lg:text-4xl font-bold gradient-text mb-6">
          How CaseClosure Works
        </h2>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          A step-by-step guide to creating your case page and mobilizing your community 
          to help find the answers you need.
        </p>
      </div>

      <div className="space-y-12">
        {steps.map((step, index) => (
          <div key={index} className="floating-card">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 lg:p-12 shadow-xl border border-white/20">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex items-center gap-6 lg:w-1/2">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold gradient-text">{index + 1}</span>
                    </div>
                    <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">{step.title}</h3>
                    <p className="text-lg text-slate-600 leading-relaxed mb-6">{step.description}</p>
                    <div className="space-y-2">
                      {step.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-2 h-2 accent-gradient rounded-full" />
                          <span className="text-slate-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="lg:w-1/2">
                  <div className="bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-2xl p-8 border border-slate-100">
                    <div className="text-center">
                      <div className="text-6xl mb-4">
                        {index === 0 && "📝"}
                        {index === 1 && "📢"}
                        {index === 2 && "👀"}
                        {index === 3 && "💌"}
                        {index === 4 && "🤖"}
                        {index === 5 && "🎉"}
                      </div>
                      <p className="text-slate-500 text-sm">
                        {index === 0 && "Professional case pages that honor your loved one's story"}
                        {index === 1 && "Reach thousands in your local community and beyond"}
                        {index === 2 && "Gain a clear picture of community involvement in your case"}
                        {index === 3 && "Secure, organized tip collection and management"}
                        {index === 4 && "Technology working around the clock for your case"}
                        {index === 5 && "Celebrate answers found and cases closed"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20">
        <div className="floating-card bg-gradient-to-r from-slate-800 to-slate-700 rounded-3xl p-8 lg:p-12 shadow-2xl text-white text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join hundreds of families who have found hope, answers, and community through CaseClosure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild
              size="lg"
              className="accent-gradient text-slate-800 hover:shadow-xl transition-all duration-300 rounded-full px-8"
            >
              <Link to={createPageUrl("Pricing")}>Start Your Case Page</Link>
            </Button>
            <Button 
              asChild
              size="lg" 
              className="accent-gradient text-slate-800 hover:shadow-xl transition-all duration-300 rounded-full px-8"
            >
              <Link to={createPageUrl("Contact")}>Ask Questions First</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
