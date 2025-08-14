
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Eye, Clock, MapPin, MoreHorizontal } from "lucide-react";
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

export default function FeedPost({ post }) {
  const [isRevealed, setIsRevealed] = useState(!post.is_sensitive);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50) + 5);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <div className="font-semibold text-slate-900">{post.case_name || "CaseClosure"}</div>
            <div className="text-sm text-slate-500">
              {format(new Date(post.created_date), 'MMM d, yyyy')} • 
              <span className="ml-1 capitalize">{post.post_type.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.priority !== 'medium' && (
            <Badge className={`${priorityColors[post.priority]} border text-xs capitalize`}>
              {post.priority}
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="relative bg-slate-100">
          {post.is_sensitive && !isRevealed ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <Eye className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-4 font-medium">Sensitive Content</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsRevealed(true)}
                  className="rounded-full"
                >
                  Tap to Reveal
                </Button>
              </div>
            </div>
          ) : (
            <img 
              src={post.image_url}
              alt={post.title}
              className="w-full h-auto max-h-[70vh] object-contain"
            />
          )}
        </div>
      )}

      {/* Actions & Content */}
      <div className="p-4">
        {/* Actions */}
        <div className="flex items-center gap-4 mb-3">
          <Button
            variant="ghost"
            size="sm"
            className={`p-0 h-auto ${liked ? 'text-red-500' : 'text-slate-700 hover:text-red-500'}`}
            onClick={handleLike}
          >
            <Heart className={`w-6 h-6 transition-transform duration-200 ${liked ? 'fill-current scale-110' : ''}`} />
          </Button>
          
          <Button variant="ghost" size="sm" className="p-0 h-auto text-slate-700 hover:text-slate-900">
            <MessageCircle className="w-6 h-6" />
          </Button>
          
          <Button variant="ghost" size="sm" className="p-0 h-auto text-slate-700 hover:text-slate-900">
            <Share2 className="w-6 h-6" />
          </Button>
        </div>

        {/* Likes */}
        <div className="text-sm font-semibold text-slate-900 mb-2">
          {likeCount} {likeCount === 1 ? 'like' : 'likes'}
        </div>

        {/* Caption */}
        <div className="text-sm">
          <span className="font-semibold text-slate-900 mr-2">{post.case_name || "caseclosure"}</span>
          <span className="text-slate-800">{post.content}</span>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-2 text-sm text-blue-800">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="mr-2 cursor-pointer hover:underline">
                #{tag.replace(/\s+/g, '').toLowerCase()}
              </span>
            ))}
          </div>
        )}

        {/* View comments */}
        <div className="mt-3">
          <button className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
            View all comments
          </button>
        </div>
      </div>
    </Card>
  );
}
