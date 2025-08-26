import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal,
  Copy,
  Check,
  Share2
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { formatDistanceToNow } from "date-fns";

export default function UpdatePost({ update, onLike }) {
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLikeClick = () => {
    setIsLiked(!isLiked);
    onLike(update);
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = window.location.href;
  const shareText = `An update on the case of Sarah Johnson: ${update.title}`;

  const author = "Sarah Johnson Family";
  const avatarFallback = author.split(" ").map(n => n[0]).join("");

  return (
    <Card className="w-full bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
      {/* Post Header */}
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-slate-700 text-white text-sm font-semibold">{avatarFallback}</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm text-slate-800">{author}</span>
        </div>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <MoreHorizontal className="w-5 h-5 text-slate-600" />
        </Button>
      </CardHeader>
      
      {/* Post Image */}
      {update.image_url && (
        <div className="w-full aspect-square bg-slate-100">
          <img 
            src={update.image_url} 
            alt={update.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardContent className="p-4">
        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleLikeClick} className="w-8 h-8 -ml-2">
              <Heart 
                className={`w-6 h-6 transition-all duration-200 ${isLiked ? 'text-red-500 fill-current' : 'text-slate-800'}`} 
              />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <MessageCircle className="w-6 h-6 text-slate-800" />
            </Button>

            {/* Share Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <Send className="w-6 h-6 text-slate-800" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                   <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                     <Share2 className="w-4 h-4"/> Share Post
                   </div>
                   <Button asChild variant="outline" className="w-full justify-start">
                     <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
                   </Button>
                   <Button asChild variant="outline" className="w-full justify-start">
                     <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">Twitter</a>
                   </Button>
                   <Button variant="outline" className="w-full justify-start gap-2" onClick={handleCopyLink}>
                     {copied ? <Check className="w-4 h-4 text-green-500"/> : <Copy className="w-4 h-4" />}
                     {copied ? "Link Copied!" : "Copy Link"}
                   </Button>
                </div>
              </PopoverContent>
            </Popover>

          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Bookmark className="w-6 h-6 text-slate-800" />
          </Button>
        </div>
        
        {/* Likes Count */}
        <div className="font-semibold text-sm text-slate-800 mb-2">
          {update.likes_count || 0} likes
        </div>
        
        {/* Caption and Tags */}
        <div className="text-sm text-slate-700 leading-relaxed">
          <span className="font-semibold text-slate-800 mr-2">{author}</span>
          {update.content}
          {update.tags && update.tags.length > 0 && (
            <div className="mt-1">
              {update.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-blue-900 cursor-pointer mr-1.5"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <div className="text-xs text-slate-500 uppercase mt-3 tracking-wide">
          {formatDistanceToNow(new Date(update.created_date))} ago
        </div>
      </CardContent>
    </Card>
  );
}