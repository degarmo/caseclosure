import React, { createContext, useContext, useEffect, useRef } from 'react';

const RealtimeContext = createContext();

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}

export function RealtimeProvider({ children, refreshInterval = 30000 }) {
  const intervalRef = useRef(null);
  const subscribersRef = useRef(new Set());

  const subscribe = (callback) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  };

  const broadcast = (data) => {
    subscribersRef.current.forEach(callback => callback(data));
  };

  useEffect(() => {
    // Set up auto-refresh interval
    intervalRef.current = setInterval(() => {
      broadcast({ type: 'refresh', timestamp: Date.now() });
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval]);

  const value = {
    subscribe,
    broadcast,
    refreshInterval
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}