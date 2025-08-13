/**
 * React Tracker Hooks
 * Location: frontend/src/hooks/useTracker.js
 * 
 * Custom React hooks for integrating the tracker with React components
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import tracker from '../services/tracker/tracker';

/**
 * Main tracking hook - tracks page views and provides tracking methods
 */
export const useTracker = () => {
  const location = useLocation();
  const params = useParams();
  const previousPath = useRef(location.pathname);

  // Track page view on route change
  useEffect(() => {
    if (location.pathname !== previousPath.current) {
      tracker.trackPageView({
        path: location.pathname,
        search: location.search,
        hash: location.hash,
        params: params,
      });
      previousPath.current = location.pathname;
    }
  }, [location, params]);

  // Set case ID if available in params
  useEffect(() => {
    if (params.caseId) {
      tracker.setCase(params.caseId);
    }
  }, [params.caseId]);

  // Tracking methods
  const trackEvent = useCallback((eventName, data) => {
    tracker.track(eventName, data);
  }, []);

  const trackClick = useCallback((element, data) => {
    tracker.trackEvent({
      eventType: 'click',
      element,
      ...data,
    });
  }, []);

  const trackFormSubmit = useCallback((formName, data) => {
    tracker.trackEvent({
      eventType: 'form_submit',
      formName,
      ...data,
    });
  }, []);

  const trackError = useCallback((error, context) => {
    tracker.trackEvent({
      eventType: 'error',
      error: error.message,
      stack: error.stack,
      context,
    });
  }, []);

  const trackPageView = useCallback((data) => {
    tracker.trackPageView(data);
  }, []);

  return {
    trackEvent,
    trackClick,
    trackFormSubmit,
    trackError,
    trackPageView,
    tracker, // Expose full tracker for advanced usage
  };
};

/**
 * Hook for tracking component visibility
 */
export const useVisibilityTracking = (componentName, threshold = 0.5) => {
  const elementRef = useRef(null);
  const hasBeenVisible = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenVisible.current) {
            hasBeenVisible.current = true;
            tracker.trackEvent({
              eventType: 'component_visible',
              component: componentName,
              timestamp: Date.now(),
            });
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [componentName, threshold]);

  return elementRef;
};

/**
 * Hook for tracking time spent on component
 */
export const useTimeTracking = (componentName) => {
  const startTime = useRef(Date.now());
  const isVisible = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisible.current = false;
      } else {
        isVisible.current = true;
        startTime.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Track time spent when component unmounts
      if (isVisible.current) {
        const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
        tracker.trackEvent({
          eventType: 'component_time',
          component: componentName,
          timeSpent,
        });
      }
    };
  }, [componentName]);
};

/**
 * Hook for tracking user engagement
 */
export const useEngagementTracking = () => {
  const interactions = useRef({
    clicks: 0,
    scrolls: 0,
    keystrokes: 0,
    mouseMovements: 0,
  });
  
  const lastActivity = useRef(Date.now());
  const isEngaged = useRef(true);

  useEffect(() => {
    const trackEngagement = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity.current;
      
      // User is idle if no activity for 30 seconds
      if (timeSinceLastActivity > 30000 && isEngaged.current) {
        isEngaged.current = false;
        tracker.trackEvent({
          eventType: 'user_idle',
          duration: timeSinceLastActivity,
          interactions: interactions.current,
        });
      } else if (timeSinceLastActivity < 30000 && !isEngaged.current) {
        isEngaged.current = true;
        tracker.trackEvent({
          eventType: 'user_active',
        });
      }
      
      lastActivity.current = now;
    };

    const handleClick = () => {
      interactions.current.clicks++;
      trackEngagement();
    };

    const handleScroll = () => {
      interactions.current.scrolls++;
      trackEngagement();
    };

    const handleKeyPress = () => {
      interactions.current.keystrokes++;
      trackEngagement();
    };

    const handleMouseMove = () => {
      interactions.current.mouseMovements++;
      trackEngagement();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll);
    document.addEventListener('keypress', handleKeyPress);
    document.addEventListener('mousemove', handleMouseMove);

    // Check engagement every 10 seconds
    const interval = setInterval(trackEngagement, 10000);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keypress', handleKeyPress);
      document.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  return isEngaged.current;
};