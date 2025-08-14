import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users } from "lucide-react";

const featuredCases = [
  {
    name: "Maria Rodriguez",
    location: "Austin, TX",
    timeAgo: "3 months ago",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
    status: "Active",
    tipCount: 43,
    reward: "$25,000"
  },
  {
    name: "James Chen",
    location: "Seattle, WA", 
    timeAgo: "8 months ago",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    status: "Solved",
    tipCount: 89,
    reward: null
  },
  {
    name: "Emily Thompson",
    location: "Denver, CO",
    timeAgo: "1 year ago", 
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face",
    status: "Active",
    tipCount: 156,
    reward: "$50,000"
  }
];

export default function FeaturedCases() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold gradient-text mb-4">
            Recent Cases
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Every case matters. Every family deserves answers. See how our community 
            is making a difference.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {featuredCases.map((case_item, index) => (
            <Card key={index} className="floating-card bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
              <div className="relative">
                <img 
                  src={case_item.image}
                  alt={case_item.name}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge 
                    variant={case_item.status === "Solved" ? "default" : "secondary"}
                    className={
                      case_item.status === "Solved" 
                        ? "bg-green-500 hover:bg-green-600 text-white" 
                        : "accent-gradient text-slate-800 font-semibold"
                    }
                  >
                    {case_item.status}
                  </Badge>
                </div>
                {case_item.reward && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-red-500 hover:bg-red-600 text-white font-semibold">
                      Reward: {case_item.reward}
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{case_item.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {case_item.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {case_item.timeAgo}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{case_item.tipCount} tips received</span>
                  </div>
                  {case_item.status === "Solved" && (
                    <span className="text-sm font-medium text-green-600">Case Closed ✓</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}