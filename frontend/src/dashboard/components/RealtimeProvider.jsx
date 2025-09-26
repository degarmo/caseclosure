// src/pages/dashboard/components/RealtimeProvider.jsx
import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import api from '@/api/axios';

const RealtimeContext = createContext();

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};

export function RealtimeProvider({ children, refreshInterval = 5000 }) {
  const subscribersRef = useRef(new Map());
  const intervalsRef = useRef(new Map());

  // Subscribe to real-time updates for a specific endpoint
  const subscribe = useCallback((key, endpoint, callback, interval = refreshInterval) => {
    // Clear existing interval if any
    if (intervalsRef.current.has(key)) {
      clearInterval(intervalsRef.current.get(key));
    }

    // Initial fetch
    const fetchData = async () => {
      try {
        const response = await api.get(endpoint);
        callback(response.data);
      } catch (error) {
        console.error(`Error fetching ${key}:`, error);
        callback(null, error);
      }
    };

    fetchData();

    // Set up polling
    const intervalId = setInterval(fetchData, interval);
    intervalsRef.current.set(key, intervalId);
    subscribersRef.current.set(key, { endpoint, callback, interval });

    // Return unsubscribe function
    return () => {
      if (intervalsRef.current.has(key)) {
        clearInterval(intervalsRef.current.get(key));
        intervalsRef.current.delete(key);
        subscribersRef.current.delete(key);
      }
    };
  }, [refreshInterval]);

  // Clean up all intervals on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(intervalId => clearInterval(intervalId));
      intervalsRef.current.clear();
      subscribersRef.current.clear();
    };
  }, []);

  // Force refresh a specific subscription
  const refresh = useCallback(async (key) => {
    const subscription = subscribersRef.current.get(key);
    if (subscription) {
      try {
        const response = await api.get(subscription.endpoint);
        subscription.callback(response.data);
      } catch (error) {
        console.error(`Error refreshing ${key}:`, error);
        subscription.callback(null, error);
      }
    }
  }, []);

  // Force refresh all subscriptions
  const refreshAll = useCallback(async () => {
    const promises = Array.from(subscribersRef.current.entries()).map(async ([key, subscription]) => {
      try {
        const response = await api.get(subscription.endpoint);
        subscription.callback(response.data);
      } catch (error) {
        console.error(`Error refreshing ${key}:`, error);
        subscription.callback(null, error);
      }
    });
    await Promise.all(promises);
  }, []);

  const value = {
    subscribe,
    refresh,
    refreshAll,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}