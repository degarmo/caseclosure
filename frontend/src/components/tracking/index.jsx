/**
 * Tracking Components
 * Location: frontend/src/components/tracking/index.jsx
 * 
 * Reusable tracking components
 */

import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTracker } from '../../hooks/useTracker';

/**
 * TrackedButton Component - Button with built-in tracking
 */
export const TrackedButton = ({ 
  children, 
  trackingId, 
  trackingData = {}, 
  onClick, 
  ...props 
}) => {
  const { trackClick } = useTracker();

  const handleClick = (e) => {
    trackClick(trackingId, trackingData);
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button {...props} onClick={handleClick} data-track={trackingId}>
      {children}
    </button>
  );
};

TrackedButton.propTypes = {
  children: PropTypes.node.isRequired,
  trackingId: PropTypes.string.isRequired,
  trackingData: PropTypes.object,
  onClick: PropTypes.func,
};

/**
 * TrackedLink Component - Link with built-in tracking
 */
export const TrackedLink = ({ 
  children, 
  to, 
  trackingId, 
  trackingData = {}, 
  onClick, 
  ...props 
}) => {
  const { trackClick } = useTracker();

  const handleClick = (e) => {
    trackClick(trackingId, {
      destination: to,
      ...trackingData,
    });
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link {...props} to={to} onClick={handleClick} data-track={trackingId}>
      {children}
    </Link>
  );
};

TrackedLink.propTypes = {
  children: PropTypes.node.isRequired,
  to: PropTypes.string.isRequired,
  trackingId: PropTypes.string.isRequired,
  trackingData: PropTypes.object,
  onClick: PropTypes.func,
};

/**
 * TrackedForm Component - Form with built-in tracking
 */
export const TrackedForm = ({ 
  children, 
  formName, 
  onSubmit, 
  trackingData = {}, 
  ...props 
}) => {
  const { trackFormSubmit } = useTracker();
  const formStartTime = useRef(Date.now());
  const fieldsInteracted = useRef(new Set());

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    trackFormSubmit(formName, {
      ...trackingData,
      timeToComplete: Math.floor((Date.now() - formStartTime.current) / 1000),
      fieldsInteracted: fieldsInteracted.current.size,
      // Be careful with sensitive data - don't track passwords, etc.
      // data: data, 
    });

    if (onSubmit) {
      onSubmit(e, data);
    }
  };

  const handleFieldInteraction = (e) => {
    if (e.target.name) {
      fieldsInteracted.current.add(e.target.name);
    }
  };

  return (
    <form 
      {...props} 
      onSubmit={handleSubmit} 
      onFocus={handleFieldInteraction}
      data-track-form={formName}
    >
      {children}
    </form>
  );
};

TrackedForm.propTypes = {
  children: PropTypes.node.isRequired,
  formName: PropTypes.string.isRequired,
  onSubmit: PropTypes.func,
  trackingData: PropTypes.object,
};

// Export all components
export default {
  TrackedButton,
  TrackedLink,
  TrackedForm,
};