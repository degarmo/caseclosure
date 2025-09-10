
// @/components/SafeImage.jsx
// A wrapper component that handles image loading errors gracefully

import React, { useState, useEffect } from 'react';

const SafeImage = ({ 
  src, 
  alt, 
  fallbackSrc = '/images/placeholder.jpg',
  className = '',
  onError,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  
  // Reset when src changes
  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = (e) => {
    console.warn(`Failed to load image: ${imageSrc}`);
    
    if (!hasError) {
      setHasError(true);
      
      // Try fallback image
      if (fallbackSrc && imageSrc !== fallbackSrc) {
        setImageSrc(fallbackSrc);
      } else {
        // Use a data URL placeholder if all else fails
        setImageSrc('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e2e8f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%2364748b"%3EImage Not Available%3C/text%3E%3C/svg%3E');
      }
      
      // Call parent error handler if provided
      if (onError) {
        onError(e);
      }
    }
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
};

export default SafeImage;