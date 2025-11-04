import React, { useState, useEffect } from "react";
import { SpotlightPost } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Share2, 
  MapPin, 
  Calendar,
  MessageCircle,
  Pin,
  Camera,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function SpotlightPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState(new Set());

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const spotlightPosts = await SpotlightPost.list("-created_date");
      setPosts(spotlightPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
    setLoading(false);
  };

  const handleLike = async (postId) => {
    try {
      const post = posts.find(p => p.id === postId);
      const isLiked = likedPosts.has(postId);
      const newLikesCount = isLiked ? post.likes_count - 1 : post.likes_count + 1;
      
      await SpotlightPost.update(postId, { likes_count: newLikesCount });
      
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });
      
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, likes_count: newLikesCount } : p
      ));
    } catch (error) {
      console.error("Error updating likes:", error);
    }
  };

  const handleShare = async (post) => {
    try {
      await SpotlightPost.update(post.id, { shares_count: post.shares_count + 1 });
      
      if (navigator.share) {
        await navigator.share({
          title: "Help Find Sarah Johnson",
          text: post.content,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(`${post.content}\n\nHelp find Sarah: ${window.location.href}`);
        alert("Post copied to clipboard!");
      }
      
      setPosts(prev => prev.map(p => 
        p.id === post.id ? { ...p, shares_count: post.shares_count + 1 } : p
      ));
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Badge className="bg-purple-500/10 text-purple-600 border-purple-200 mb-4 px-6 py-2">
            <Camera className="w-4 h-4 mr-2" />
            SPOTLIGHT UPDATES
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Share Sarah's Story
          </h1>
          <p className="text-lg text-gray-600">
            Every share helps spread awareness and brings us closer to finding her
          </p>
        </motion.div>

        {/* Posts Feed */}
        <div className="space-y-6">
          <AnimatePresence>
            {posts.length > 0 ? (
              posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                    {/* Post Header */}
                    <div className="p-4 bg-white border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <Heart className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Find Sarah Campaign</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(post.created_date), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                        {post.is_pinned && (
                          <Badge variant="outline" className="text-blue-600 border-blue-200">
                            <Pin className="w-3 h-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Post Content */}
                    <CardContent className="p-0">
                      {post.image_url && (
                        <div className="relative">
                          <img
                            src={post.image_url}
                            alt="Post image"
                            className="w-full h-96 object-cover"
                          />
                          {post.location && (
                            <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {post.location}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="p-6">
                        <p className="text-gray-900 text-lg leading-relaxed mb-4">
                          {post.content}
                        </p>

                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.hashtags.map((hashtag, i) => (
                              <Badge key={i} variant="secondary" className="text-blue-600 bg-blue-50">
                                #{hashtag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Engagement Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-6">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLike(post.id)}
                              className={`flex items-center gap-2 ${
                                likedPosts.has(post.id)
                                  ? "text-red-500 hover:text-red-600"
                                  : "text-gray-600 hover:text-red-500"
                              }`}
                            >
                              <Heart 
                                className={`w-5 h-5 ${
                                  likedPosts.has(post.id) ? "fill-current" : ""
                                }`} 
                              />
                              <span>{post.likes_count}</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShare(post)}
                              className="flex items-center gap-2 text-gray-600 hover:text-blue-500"
                            >
                              <Share2 className="w-5 h-5" />
                              <span>{post.shares_count}</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-2 text-gray-600 hover:text-green-500"
                            >
                              <MessageCircle className="w-5 h-5" />
                              <span>Comment</span>
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(post)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No posts yet</h3>
                <p className="text-gray-500">Updates and spotlight posts will appear here</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardContent className="p-8 text-center">
              <Heart className="w-12 h-12 text-white/80 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Help Spread the Word</h3>
              <p className="text-purple-100 mb-6">
                Share these posts on your social media to help more people see Sarah's story
              </p>
              <Button 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-purple-50"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Help Find Sarah Johnson",
                      text: "Please help us find Sarah Johnson. She has been missing since January 15, 2024.",
                      url: window.location.href,
                    });
                  }
                }}
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share This Page
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}