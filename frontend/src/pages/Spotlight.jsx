import React, { useState, useEffect } from "react";
import { CasePost } from "@/api/entities";
import FeedPost from "../components/spotlight/FeedPost";
import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Spotlight() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    const fetchedPosts = await CasePost.list('-created_date');
    setPosts(fetchedPosts);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-500" />
              <h1 className="text-xl font-bold gradient-text">Spotlight</h1>
            </div>
            <Button size="sm" className="bg-slate-800 hover:bg-slate-700 text-white">
              <Plus className="w-4 h-4 mr-1" />
              Post
            </Button>
          </div>
        </div>
      </div>

      {/* Feed Container - Wider and centered */}
      <div className="flex justify-center py-8">
        <div className="w-full max-w-xl">
          {isLoading ? (
            <div className="space-y-8">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-24 mb-1" />
                      <div className="h-3 bg-slate-200 rounded w-16" />
                    </div>
                  </div>
                  <div className="h-96 bg-slate-200 rounded-lg mb-4" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {posts.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">No posts yet</h3>
                  <p className="text-slate-500 mb-6">Be the first to share an update with the community.</p>
                  <Button className="bg-slate-800 hover:bg-slate-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Post
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  {posts.map((post) => (
                    <FeedPost key={post.id} post={post} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}