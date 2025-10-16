// src/hooks/useSpotlight.js
import { useState, useEffect, useCallback } from 'react';
import api from '@/utils/axios';

/**
 * Custom hook for managing case-specific spotlight posts
 * Eliminates code duplication across dashboards
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.caseId - Filter by specific case (required for users)
 * @param {string} options.subdomain - Filter by case subdomain (for public pages)
 * @param {boolean} options.autoFetch - Automatically fetch on mount (default: true)
 * @returns {Object} Spotlight state and methods
 */
export function useSpotlight(options = {}) {
  const { 
    caseId = null, 
    subdomain = null,
    autoFetch = true 
  } = options;

  const [posts, setPosts] = useState([]);
  const [publishedPosts, setPublishedPosts] = useState([]);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [draftPosts, setDraftPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    scheduled: 0,
    drafts: 0
  });

  /**
   * Fetch all posts with optional filters
   */
  const fetchPosts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        ...filters,
        ...(caseId && { case_id: caseId }),
        ...(subdomain && { subdomain })
      };

      const response = await api.get('/spotlight/', { params });
      
      // Handle both array and paginated responses
      const allPosts = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      
      // Categorize posts
      const now = new Date();
      const published = allPosts.filter(post => 
        post.status === 'published'
      );
      const scheduled = allPosts.filter(post => 
        post.status === 'scheduled' && new Date(post.scheduled_for) > now
      );
      const drafts = allPosts.filter(post => 
        post.status === 'draft'
      );
      
      setPosts(allPosts);
      setPublishedPosts(published);
      setScheduledPosts(scheduled);
      setDraftPosts(drafts);
      
      setStats({
        total: allPosts.length,
        published: published.length,
        scheduled: scheduled.length,
        drafts: drafts.length
      });
      
      return allPosts;
    } catch (err) {
      console.error('Error fetching spotlight posts:', err);
      setError(err.response?.data?.detail || err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [caseId, subdomain]);

  /**
   * Fetch only published posts (for public pages)
   */
  const fetchPublishedPosts = useCallback(async () => {
    return fetchPosts({ status: 'published' });
  }, [fetchPosts]);

  /**
   * Create a new spotlight post
   */
  const createPost = useCallback(async (postData) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      // Add all text fields
      Object.keys(postData).forEach(key => {
        if (key === 'featured_image') {
          // Skip, handle separately
          return;
        }
        
        if (key === 'image_gallery' || key === 'tags') {
          // JSON fields
          formData.append(key, JSON.stringify(postData[key] || []));
        } else if (postData[key] !== null && postData[key] !== undefined) {
          formData.append(key, postData[key]);
        }
      });
      
      // Add case if provided in options and not in postData
      if (caseId && !postData.case) {
        formData.append('case', caseId);
      }
      
      // Add featured image
      if (postData.featured_image instanceof File) {
        formData.append('featured_image', postData.featured_image);
      }
      
      const response = await api.post('/spotlight/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Refresh posts
      await fetchPosts();
      
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error creating spotlight post:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.error ||
                          Object.values(err.response?.data || {}).flat().join(', ') ||
                          err.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [caseId, fetchPosts]);

  /**
   * Update an existing post
   */
  const updatePost = useCallback(async (postId, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      Object.keys(updates).forEach(key => {
        if (key === 'featured_image' && updates[key] instanceof File) {
          formData.append(key, updates[key]);
        } else if (key === 'image_gallery' || key === 'tags') {
          formData.append(key, JSON.stringify(updates[key] || []));
        } else if (updates[key] !== null && updates[key] !== undefined) {
          formData.append(key, updates[key]);
        }
      });
      
      const response = await api.patch(`/spotlight/${postId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      await fetchPosts();
      
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error updating spotlight post:', err);
      const errorMessage = err.response?.data?.detail || err.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchPosts]);

  /**
   * Delete a post
   */
  const deletePost = useCallback(async (postId) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.delete(`/spotlight/${postId}/`);
      await fetchPosts();
      return { success: true };
    } catch (err) {
      console.error('Error deleting spotlight post:', err);
      const errorMessage = err.response?.data?.detail || err.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchPosts]);

  /**
   * Increment view count for a post
   */
  const incrementViewCount = useCallback(async (postId) => {
    try {
      await api.post(`/spotlight/${postId}/increment_view/`);
    } catch (err) {
      console.error('Error incrementing view count:', err);
    }
  }, []);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchPosts();
    }
  }, [autoFetch, fetchPosts]);

  return {
    // State
    posts,
    publishedPosts,
    scheduledPosts,
    draftPosts,
    loading,
    error,
    stats,
    
    // Methods
    fetchPosts,
    fetchPublishedPosts,
    createPost,
    updatePost,
    deletePost,
    incrementViewCount,
    refresh: fetchPosts
  };
}

export default useSpotlight;