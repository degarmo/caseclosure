import React, { useState, useEffect } from "react";
import { BlogPost } from "@/entities/BlogPost"; // Assumed abstraction over your API or DB
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, User, Tag, MessageCircle } from "lucide-react";
import { format } from "date-fns";

// MAIN WIDGET
export default function CaseThread() {
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  // Loads the posts (ordered by creation date desc)
  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const data = await BlogPost.list('-created_date');
      setPosts(data);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
    setIsLoading(false);
  };

  // Handles liking a post (prevents double-liking)
  const handleLike = async (post) => {
    if (likedPosts.has(post.id)) return;
    try {
      await BlogPost.update(post.id, { hearts_count: (post.hearts_count || 0) + 1 });
      setLikedPosts(prev => new Set(prev).add(post.id));
      setPosts(prev =>
        prev.map(p =>
          p.id === post.id
            ? { ...p, hearts_count: (p.hearts_count || 0) + 1 }
            : p
        )
      );
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Case <span className="text-blue-500">Thread</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Every detail. Every voice. Every step closer.
            </p>
          </div>
        </div>
      </section>
      {/* Feed Section */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="space-y-12">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i} className="border-gray-200 shadow-md animate-pulse">
                  <CardHeader className="flex flex-row items-center gap-3 p-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </CardHeader>
                  <div className="aspect-square bg-gray-200"></div>
                  <CardContent className="p-4 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Updates Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Case updates and stories will appear here as they are posted by the admin.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className={`border-gray-200 shadow-lg transition-all duration-300 bg-white ${
                    post.is_featured ? 'ring-2 ring-blue-200' : ''
                  }`}
                >
                  <CardHeader className="flex flex-row items-center gap-3 p-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Remember Team</p>
                      {post.is_featured && (
                        <p className="text-xs text-blue-500">Featured Update</p>
                      )}
                    </div>
                  </CardHeader>
                  {post.image_url && (
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleLike(post)}
                        disabled={likedPosts.has(post.id)}
                        aria-label={likedPosts.has(post.id) ? "Liked" : "Like"}
                        className={`hover:text-red-500 transition-colors ${
                          likedPosts.has(post.id) ? "text-red-500" : "text-gray-600"
                        }`}
                      >
                        <Heart
                          className={`w-6 h-6 ${likedPosts.has(post.id) ? "fill-red-500" : ""}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-600 hover:text-blue-500"
                        aria-label="Comment"
                      >
                        <MessageCircle className="w-6 h-6" />
                      </Button>
                    </div>
                    <p className="font-semibold text-gray-800 mb-2">
                      {post.hearts_count || 0} hearts
                    </p>
                    <div className="text-gray-700 leading-relaxed">
                      <span className="font-bold text-gray-900">{post.title}</span>
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {post.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      {format(new Date(post.created_date), "MMMM d, yyyy")}
                    </p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
