/**
 * Dashboard API Service
 * Location: frontend/src/services/dashboard/dashboardService.js
 * 
 * This service handles all API calls to the dashboard endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class DashboardService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.pollingIntervals = new Map();
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // If using session auth instead of tokens
    const sessionId = localStorage.getItem('sessionid');
    if (sessionId) {
      headers['Cookie'] = `sessionid=${sessionId}`;
    }

    return headers;
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Fetch complete dashboard overview
   */
  async fetchDashboard(caseSlug, forceRefresh = false) {
    try {
      const url = `${this.baseUrl}/dashboard/${caseSlug}/overview/${forceRefresh ? '?refresh=true' : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include', // Include cookies
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  }

  /**
   * Fetch visitor metrics widget data
   */
  async fetchVisitorMetrics(caseSlug) {
    try {
      const response = await fetch(
        `${this.baseUrl}/dashboard/${caseSlug}/widgets/visitor-metrics/`,
        {
          headers: this.getAuthHeaders(),
          credentials: 'include',
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching visitor metrics:', error);
      throw error;
    }
  }

  /**
   * Fetch suspicious activity widget data
   */
  async fetchSuspiciousActivity(caseSlug) {
    try {
      const response = await fetch(
        `${this.baseUrl}/dashboard/${caseSlug}/widgets/suspicious-activity/`,
        {
          headers: this.getAuthHeaders(),
          credentials: 'include',
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching suspicious activity:', error);
      throw error;
    }
  }

  /**
   * Fetch geographic map widget data
   */
  async fetchGeographicMap(caseSlug) {
    try {
      const response = await fetch(
        `${this.baseUrl}/dashboard/${caseSlug}/widgets/geographic-map/`,
        {
          headers: this.getAuthHeaders(),
          credentials: 'include',
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching geographic map:', error);
      throw error;
    }
  }

  /**
   * Fetch activity timeline widget data
   */
  async fetchActivityTimeline(caseSlug, hours = 24) {
    try {
      const response = await fetch(
        `${this.baseUrl}/dashboard/${caseSlug}/widgets/activity-timeline/?hours=${hours}`,
        {
          headers: this.getAuthHeaders(),
          credentials: 'include',
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching activity timeline:', error);
      throw error;
    }
  }

  /**
   * Fetch engagement metrics widget data
   */
  async fetchEngagementMetrics(caseSlug) {
    try {
      const response = await fetch(
        `${this.baseUrl}/dashboard/${caseSlug}/widgets/engagement-metrics/`,
        {
          headers: this.getAuthHeaders(),
          credentials: 'include',
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
      throw error;
    }
  }

  /**
   * Fetch alerts panel widget data
   */
  async fetchAlerts(caseSlug) {
    try {
      const response = await fetch(
        `${this.baseUrl}/dashboard/${caseSlug}/widgets/alerts/`,
        {
          headers: this.getAuthHeaders(),
          credentials: 'include',
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  }

  /**
   * Fetch real-time activity stream
   */
  async fetchRealtimeActivity(caseSlug) {
    try {
      const response = await fetch(
        `${this.baseUrl}/dashboard/${caseSlug}/realtime/activity/`,
        {
          headers: this.getAuthHeaders(),
          credentials: 'include',
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching realtime activity:', error);
      throw error;
    }
  }

  /**
   * Fetch real-time metrics
   */
  async fetchRealtimeMetrics(caseSlug) {
    try {
      const response = await fetch(
        `${this.baseUrl}/dashboard/${caseSlug}/realtime/metrics/`,
        {
          headers: this.getAuthHeaders(),
          credentials: 'include',
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching realtime metrics:', error);
      throw error;
    }
  }

  /**
   * Start polling for real-time updates
   */
  startRealtimePolling(caseSlug, callback, interval = 5000) {
    // Stop existing polling for this case if any
    this.stopRealtimePolling(caseSlug);

    const pollFunction = async () => {
      try {
        const metrics = await this.fetchRealtimeMetrics(caseSlug);
        callback(metrics);
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial call
    pollFunction();

    // Set up interval
    const intervalId = setInterval(pollFunction, interval);
    this.pollingIntervals.set(caseSlug, intervalId);

    return intervalId;
  }

  /**
   * Stop polling for a specific case
   */
  stopRealtimePolling(caseSlug) {
    const intervalId = this.pollingIntervals.get(caseSlug);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(caseSlug);
    }
  }

  /**
   * Stop all polling
   */
  stopAllPolling() {
    this.pollingIntervals.forEach(intervalId => clearInterval(intervalId));
    this.pollingIntervals.clear();
  }

  /**
   * Fetch all widgets data in parallel
   */
  async fetchAllWidgets(caseSlug) {
    try {
      const [
        visitorMetrics,
        suspiciousActivity,
        geographicMap,
        activityTimeline,
        engagementMetrics,
        alerts
      ] = await Promise.all([
        this.fetchVisitorMetrics(caseSlug),
        this.fetchSuspiciousActivity(caseSlug),
        this.fetchGeographicMap(caseSlug),
        this.fetchActivityTimeline(caseSlug),
        this.fetchEngagementMetrics(caseSlug),
        this.fetchAlerts(caseSlug)
      ]);

      return {
        visitorMetrics,
        suspiciousActivity,
        geographicMap,
        activityTimeline,
        engagementMetrics,
        alerts
      };
    } catch (error) {
      console.error('Error fetching all widgets:', error);
      throw error;
    }
  }
}

// Export singleton instance
const dashboardService = new DashboardService();
export default dashboardService;

// Also export the class for testing
export { DashboardService };