// Spotlight.jsx
import React, { useState, useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import SpotlightFeed from './SpotlightFeed';
import SpotlightEditor from './SpotlightEditor';
import SpotlightScheduler from './SpotlightScheduler';
import { spotlightAPI } from '@/api/spotlight';
import './Spotlight.css';

const Spotlight = () => {
  const [posts, setPosts] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await spotlightAPI.getPosts({ status: filter });
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      const response = await spotlightAPI.createPost(postData);
      setPosts([response.data, ...posts]);
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await spotlightAPI.likePost(postId);
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, is_liked: response.data.liked, likes_count: response.data.likes_count }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentPost = async (postId, comment) => {
    try {
      const response = await spotlightAPI.commentPost(postId, { content: comment });
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, comments: [...post.comments, response.data], comments_count: post.comments_count + 1 }
          : post
      ));
    } catch (error) {
      console.error('Error commenting on post:', error);
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
          <button 
            className="btn-create-post"
            onClick={() => setIsCreating(true)}
          >
            Create Post
          </button>
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