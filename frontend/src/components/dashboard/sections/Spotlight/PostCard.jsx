import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Eye, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

const priorityColors = {
  low: "bg-blue-100 text-blue-800 border-blue-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200", 
  high: "bg-orange-100 text-orange-800 border-orange-200",
  urgent: "bg-red-100 text-red-800 border-red-200"
};

const typeColors = {
  update: "bg-slate-100 text-slate-800",
  memorial: "bg-purple-100 text-purple-800",
  appeal: "bg-orange-100 text-orange-800",
  news: "bg-blue-100 text-blue-800",
  evidence: "bg-red-100 text-red-800"
};

export default function PostCard({ post }) {
  const [isRevealed, setIsRevealed] = useState(!post.is_sensitive);
  const [liked, setLiked] = useState(false);

  return (
    <Card className="floating-card bg-white/90 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
      {post.image_url && (
        <div className="relative">
          {post.is_sensitive && !isRevealed ? (
            <div className="h-48 bg-slate-100 flex items-center justify-center">
              <div className="text-center">
                <Eye className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 mb-3">Sensitive Content</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsRevealed(true)}
                >
                  Tap to Reveal
                </Button>
              </div>
            </div>
          ) : (
            <img 
              src={post.image_url}
              alt={post.title}
              className="w-full h-48 object-cover"
            />
          )}
          
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={`${typeColors[post.post_type]} border font-medium`}>
              {post.post_type.replace('_', ' ')}
            </Badge>
            {post.priority !== 'medium' && (
              <Badge className={`${priorityColors[post.priority]} border font-medium`}>
                {post.priority}
              </Badge>
            )}
          </div>
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">
              {post.title}
            </h3>
            <p className="text-slate-600 line-clamp-3 leading-relaxed">
              {post.content}
            </p>
          </div>
          
          {post.case_name && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{post.case_name}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{format(new Date(post.created_date), 'MMM d, yyyy')}</span>
          </div>
          
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <Badge variant="outline" className="text-xs text-slate-400">
                  +{post.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${liked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}
                onClick={() => setLiked(!liked)}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                <span className="text-xs">Support</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-700">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">Comment</span>
              </Button>
            </div>
            
            <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-slate-700">
              <Share2 className="w-4 h-4" />
              <span className="text-xs">Share</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}