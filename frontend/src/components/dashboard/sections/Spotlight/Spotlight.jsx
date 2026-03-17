// Spotlight.jsx
import React, { useState, useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import SpotlightFeed from './SpotlightFeed';
import SpotlightEditor from './SpotlightEditor';
import SpotlightScheduler from './SpotlightScheduler';
import { apiMethods } from '@/api';
import { getCurrentUser } from '@/utils/auth';
import './Spotlight.css';

const Spotlight = () => {
  const [posts, setPosts] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);


  // Get current user on mount
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Check if user is LEO (read-only)
  const isLEO = currentUser?.account_type === 'leo';

  useEffect(() => {
    if (currentUser) {
      fetchPosts();
    }
  }, [filter, currentUser]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // Build params with status filter
      const params = {};

      // Only filter by author if NOT a LEO user
      // LEO users should see all posts for cases they have access to
      if (currentUser.account_type !== 'leo') {
        params.author = currentUser.username;
      }


      // Add status filter if not 'all'
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await apiMethods.spotlight.list(params);
      setPosts(response.data);
    } catch (e) {
      // silently handled
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      const response = await apiMethods.spotlight.create(postData);
      setPosts([response.data, ...posts]);
      setIsCreating(false);
    } catch (e) {
      // silently handled
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await apiMethods.spotlight.like(postId);
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, is_liked: response.data.liked, likes_count: response.data.likes_count }
          : post
      ));
    } catch (e) {
      // silently handled
    }
  };

  const handleCommentPost = async (postId, comment) => {
    try {
      const response = await apiMethods.spotlight.comment(postId, { content: comment });
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, comments: [...post.comments, response.data], comments_count: post.comments_count + 1 }
          : post
      ));
    } catch (e) {
      // silently handled
    }
  };

  return (
    <div className="spotlight-container">
      <div className="spotlight-header">
        <h1>Spotlight</h1>
        <div className="spotlight-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Posts</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Drafts</option>
          </select>
          {/* Only show Create Post button if NOT LEO */}
          {!isLEO && (
            <button 
              className="btn-create-post"
              onClick={() => setIsCreating(true)}
            >
              Create Post
            </button>
          )}
        </div>
      </div>

      {isCreating && (
        <SpotlightEditor
          onSubmit={handleCreatePost}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {loading ? (
        <div className="spotlight-loading">Loading posts...</div>
      ) : (
        <SpotlightFeed
          posts={posts}
          onLike={handleLikePost}
          onComment={handleCommentPost}
          onEdit={setSelectedPost}
        />
      )}
    </div>
  );
};

export default Spotlight;