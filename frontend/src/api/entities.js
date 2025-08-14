/**
 * API Entities
 * Location: src/api/entities.js
 */

import { base44API } from './base44Client';

/**
 * Case entity
 */
export const Case = {
  async list(ordering = '-created_date') {
    try {
      const response = await base44API.cases.list({ ordering });
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('Error fetching cases:', error);
      return [];
    }
  },

  async get(id) {
    try {
      const response = await base44API.cases.get(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching case:', error);
      return null;
    }
  },

  async create(data) {
    try {
      const response = await base44API.cases.create(data);
      return response.data;
    } catch (error) {
      console.error('Error creating case:', error);
      throw error;
    }
  },

  async update(id, data) {
    try {
      const response = await base44API.cases.update(id, data);
      return response.data;
    } catch (error) {
      console.error('Error updating case:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      await base44API.cases.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting case:', error);
      return false;
    }
  }
};

/**
 * CasePost entity
 */
export const CasePost = {
  async list(ordering = '-created_date') {
    try {
      const response = await base44API.posts.list({ ordering });
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  },

  async get(id) {
    try {
      const response = await base44API.posts.get(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      return null;
    }
  },

  async create(data) {
    try {
      const response = await base44API.posts.create(data);
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }
};

/**
 * ContactInquiry entity
 */
export const ContactInquiry = {
  async create(data) {
    try {
      const response = await base44API.contactInquiries.create(data);
      return response.data;
    } catch (error) {
      console.error('Error submitting contact inquiry:', error);
      throw error;
    }
  }
};

/**
 * AccountRequest entity
 */
export const AccountRequest = {
  async create(data) {
    try {
      const response = await base44API.accountRequests.create(data);
      return response.data;
    } catch (error) {
      console.error('Error submitting account request:', error);
      throw error;
    }
  }
};

/**
 * Mock data for development
 * Remove this when your backend endpoints are ready
 */
const MOCK_DATA = {
  cases: [
    {
      id: 1,
      person_name: "Sarah Mitchell",
      location: "Austin, TX",
      last_seen_date: "2024-01-15",
      status: "active",
      reward_amount: "$50,000",
      image_url: "https://via.placeholder.com/400x300",
      summary: "Sarah Mitchell, 28, was last seen leaving her workplace in downtown Austin.",
      tags: ["missing", "austin", "urgent"]
    },
    {
      id: 2,
      person_name: "Michael Chen",
      location: "San Francisco, CA",
      last_seen_date: "2024-02-20",
      status: "cold",
      reward_amount: "$25,000",
      image_url: "https://via.placeholder.com/400x300",
      summary: "Michael was last seen at Golden Gate Park on February 20th.",
      tags: ["missing", "san-francisco", "cold-case"]
    },
    {
      id: 3,
      person_name: "Emma Rodriguez",
      location: "Miami, FL",
      last_seen_date: "2024-03-10",
      status: "active",
      reward_amount: "$75,000",
      image_url: "https://via.placeholder.com/400x300",
      summary: "Emma disappeared after leaving a friend's house in Miami Beach.",
      tags: ["missing", "miami", "recent"]
    }
  ],
  posts: [
    {
      id: 1,
      author: "John Doe",
      case_name: "Sarah Mitchell",
      created_date: "2024-03-15T10:30:00",
      content: "We're organizing a search party this weekend. Please join us.",
      image_url: "https://via.placeholder.com/600x400",
      likes: 45,
      comments: 12
    },
    {
      id: 2,
      author: "Community Watch",
      case_name: "Michael Chen",
      created_date: "2024-03-14T15:45:00",
      content: "New information has come to light. Please share widely.",
      image_url: "https://via.placeholder.com/600x400",
      likes: 89,
      comments: 23
    }
  ]
};

/**
 * Development mode flag
 */
const USE_MOCK_DATA = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Override entities with mock data in development
 */
if (USE_MOCK_DATA) {
  console.log('Using mock data for development');
  
  Case.list = async () => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return MOCK_DATA.cases;
  };
  
  Case.get = async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_DATA.cases.find(c => c.id === parseInt(id)) || null;
  };
  
  CasePost.list = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_DATA.posts;
  };
  
  ContactInquiry.create = async (data) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Mock contact inquiry submitted:', data);
    return { success: true, id: Date.now() };
  };
  
  AccountRequest.create = async (data) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Mock account request submitted:', data);
    return { success: true, id: Date.now() };
  };
}