import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusColors = {
  active: "accent-gradient text-slate-800 font-semibold",
  solved: "bg-green-500 hover:bg-green-600 text-white",
  cold_case: "bg-blue-500 hover:bg-blue-600 text-white",
  memorial: "bg-purple-500 hover:bg-purple-600 text-white",
};

export default function CaseCard({ caseData }) {
  return (
    <Card className="floating-card bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden h-full flex flex-col">
      <div className="relative">
        <img 
          src={caseData.cover_image_url}
          alt={caseData.person_name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-4 left-4">
          <Badge className={statusColors[caseData.status]}>
            {caseData.status.replace('_', ' ')}
          </Badge>
        </div>
        {caseData.reward_amount > 0 && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-red-500 hover:bg-red-600 text-white font-semibold">
              Reward: ${caseData.reward_amount.toLocaleString()}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-6 space-y-4 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">{caseData.person_name}</h3>
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {caseData.location}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {formatDistanceToNow(new Date(caseData.last_seen_date), { addSuffix: true })}
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed line-clamp-3">
            {caseData.summary}
          </p>
        </div>
        <button className="w-full text-center mt-4 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">
          View Case Details →
        </button>
      </CardContent>
    </Card>
  );
}