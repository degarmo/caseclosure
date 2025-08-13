/**
 * TrackingProvider Component
 * Location: frontend/src/components/tracking/TrackingProvider.jsx
 * 
 * Provides tracking context to entire app
 */

import React, { createContext, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import tracker from '../../services/tracker/tracker';

const TrackingContext = createContext(null);

export const TrackingProvider = ({ children, config }) => {
  useEffect(() => {
    // Initialize tracker with config if provided
    if (config) {
      Object.assign(tracker.config, config);
    }

    // Cleanup on unmount
    return () => {
      tracker.destroy();
    };
  }, [config]);

  const value = {
    tracker,
    trackEvent: tracker.track.bind(tracker),
    trackPageView: tracker.trackPageView.bind(tracker),
    trackTipSubmission: tracker.trackTipSubmission.bind(tracker),
    trackContactSubmission: tracker.trackContactSubmission.bind(tracker),
    trackDonation: tracker.trackDonation.bind(tracker),
    trackMediaView: tracker.trackMediaView.bind(tracker),
    trackSearch: tracker.trackSearch.bind(tracker),
    trackShare: tracker.trackShare.bind(tracker),
  };

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
};

TrackingProvider.propTypes = {
  children: PropTypes.node.isRequired,
  config: PropTypes.object,
};

export const useTrackingContext = () => {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTrackingContext must be used within TrackingProvider');
  }
  return context;
};