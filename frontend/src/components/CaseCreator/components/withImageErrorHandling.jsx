// @/components/withImageErrorHandling.jsx
// Higher-order component that automatically handles image errors

import React, { useEffect, useRef } from 'react';

/**
 * HOC that wraps a component and automatically handles all image errors
 * @param {React.Component} WrappedComponent - The component to wrap
 * @returns {React.Component} Component with image error handling
 */
const withImageErrorHandling = (WrappedComponent) => {
  return React.forwardRef((props, ref) => {
    const containerRef = useRef(null);
    
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // Handle image errors
      const handleImageError = (event) => {
        if (event.target && event.target.tagName === 'IMG') {
          event.stopPropagation();
          event.preventDefault();
          
          const img = event.target;
          
          // Prevent infinite loops
          if (img.dataset.errorHandled === 'true') return;
          img.dataset.errorHandled = 'true';
          
          // Remove error handler to prevent loops
          img.onerror = null;
          
          // Determine placeholder based on classes or attributes
          let placeholderType = 'default';
          if (img.className.includes('avatar') || img.className.includes('profile')) {
            placeholderType = 'avatar';
          } else if (img.className.includes('hero') || img.className.includes('banner')) {
            placeholderType = 'hero';
          } else if (img.className.includes('gallery') || img.className.includes('thumbnail')) {
            placeholderType = 'gallery';
          }
          
          // Set appropriate placeholder
          const width = img.width || 400;
          const height = img.height || 300;
          
          const placeholders = {
            avatar: `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"%3E%3Crect width="${width}" height="${height}" fill="%23e2e8f0"/%3E%3Ccircle cx="${width/2}" cy="${height*0.35}" r="${Math.min(width, height)*0.15}" fill="%2394a3b8"/%3E%3Cellipse cx="${width/2}" cy="${height*0.65}" rx="${Math.min(width, height)*0.25}" ry="${Math.min(width, height)*0.2}" fill="%2394a3b8"/%3E%3C/svg%3E`,
            hero: `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2364748b" /%3E%3Cstop offset="100%25" style="stop-color:%231e293b" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="${width}" height="${height}" fill="url(%23g)"/>%3C/svg%3E`,
            gallery: `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"%3E%3Crect width="${width}" height="${height}" fill="%23f3f4f6"/%3E%3Crect x="${width*0.3}" y="${height*0.3}" width="${width*0.4}" height="${height*0.4}" fill="%23d1d5db"/%3E%3C/svg%3E`,
            default: `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"%3E%3Crect width="${width}" height="${height}" fill="%23f3f4f6"/%3E%3C/svg%3E`
          };
          
          img.src = placeholders[placeholderType];
          
          // Log in development only
          if (process.env.NODE_ENV === 'development') {
            console.debug(`Image failed to load, using ${placeholderType} placeholder`);
          }
        }
      };

      // Add listener with capture to intercept errors early
      container.addEventListener('error', handleImageError, true);
      
      // Also handle images that are already broken when component mounts
      const images = container.querySelectorAll('img');
      images.forEach(img => {
        if (!img.complete || img.naturalWidth === 0) {
          // Image failed to load before we attached listener
          const event = new Event('error');
          event.target = img;
          handleImageError(event);
        }
      });
      
      return () => {
        if (container) {
          container.removeEventListener('error', handleImageError, true);
        }
      };
    }, []);

    return (
      <div ref={containerRef} className="image-error-wrapper">
        <WrappedComponent ref={ref} {...props} />
      </div>
    );
  });
};

export default withImageErrorHandling;