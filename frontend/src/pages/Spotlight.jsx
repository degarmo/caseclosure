// src/pages/Spotlight.jsx - Enhanced version with Tailwind
import React, { useState, useEffect } from "react";

export default function Spotlight() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/spotlight/?status=published');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Posts loaded:', data);
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
      setError(error.message);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return formatDate(dateString);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-6 mb-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-64 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error loading posts</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadPosts}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="mr-2">✨</span>
            Community Spotlight
          </h1>
          <p className="text-sm text-gray-600 mt-1">Updates and news from our community</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No posts yet</h3>
            <p className="text-gray-500">Check back soon for community updates</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Author Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {post.author_username ? post.author_username[0].toUpperCase() : 'A'}
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-gray-900">
                        {post.author_username || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(post.published_at)}
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </button>
                </div>
                
                {/* Title */}
                {post.title && (
                  <div className="px-4 pb-2">
                    <h2 className="text-xl font-bold text-gray-900">{post.title}</h2>
                  </div>
                )}
                
                {/* Media */}
                {post.media && post.media.length > 0 && (
                  <div className="relative bg-black">
                    <img 
                      src={post.media[0].file} 
                      alt="Post content"
                      className="w-full object-contain"
                      style={{ maxHeight: '500px', margin: '0 auto' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.parentElement.style.display = 'none';
                      }}
                    />
                    {post.media.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                        +{post.media.length - 1} more
                      </div>
                    )}
                  </div>
                )}
                
                {/* Content */}
                <div className="px-4 py-3">
                  <div 
                    className="prose prose-sm max-w-none text-gray-800"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                    style={{ 
                      lineHeight: '1.6',
                      wordBreak: 'break-word'
                    }}
                  />
                  
                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="text-blue-600 text-sm hover:underline cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button 
                      className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors"
                      onClick={() => alert('Please log in to like posts')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="text-sm font-medium">{post.likes_count || 0}</span>
                    </button>
                    
                    <button 
                      className="flex items-center space-x-1 text-gray-600 hover:text-blue-500 transition-colors"
                      onClick={() => alert('Please log in to comment')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-sm font-medium">{post.comments_count || 0}</span>
                    </button>
                    
                    <button className="text-gray-600 hover:text-blue-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    {post.views_count || 0} views
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}