/**
 * Case Tracking System - Frontend Tracker
 * Location: frontend/src/services/tracker/tracker.js
 * 
 * This is the main tracking service that monitors user behavior
 * and sends data to the Django backend
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { v4 as uuidv4 } from 'uuid';

class CaseTracker {
  constructor(config = {}) {
    // Configuration
    this.config = {
      apiEndpoint: config.apiEndpoint || import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
      trackingEndpoint: config.trackingEndpoint || '/track',
      batchEndpoint: config.batchEndpoint || '/track/batch',
      sessionCookieName: config.sessionCookieName || 'tracking_session_id',
      enableLogging: config.enableLogging || import.meta.env.MODE === 'development',
      batchSize: config.batchSize || 10,
      batchInterval: config.batchInterval || 5000, // 5 seconds
      enableFingerprinting: config.enableFingerprinting !== false,
      enableScrollTracking: config.enableScrollTracking !== false,
      enableClickTracking: config.enableClickTracking !== false,
      enableFormTracking: config.enableFormTracking !== false,
      enableErrorTracking: config.enableErrorTracking !== false,
      ...config
    };

    // State
    this.sessionId = this.getOrCreateSessionId();
    this.fingerprint = null;
    this.caseId = null;
    this.eventQueue = [];
    this.pageStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.scrollDepth = 0;
    this.clickCount = 0;
    this.isInitialized = false;

    // Metadata
    this.sessionMetadata = {
      startTime: Date.now(),
      pageViews: 0,
      events: 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      doNotTrack: navigator.doNotTrack === '1',
    };

    // Initialize
    this.init();
  }

  /**
   * Initialize the tracker
   */
  async init() {
    try {
      // Load fingerprint
      if (this.config.enableFingerprinting) {
        await this.loadFingerprint();
      }

      // Set up event listeners
      this.setupEventListeners();

      // Start batch processing
      this.startBatchProcessing();

      // Track initial page view
      this.trackPageView();

      this.isInitialized = true;
      this.log('Tracker initialized successfully');
    } catch (error) {
      this.logError('Failed to initialize tracker', error);
    }
  }

  /**
   * Load device fingerprint using FingerprintJS
   */
  async loadFingerprint() {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      this.fingerprint = result.visitorId;
      
      // Add components to metadata
      this.sessionMetadata.fingerprintComponents = {
        screenResolution: result.components.screenResolution?.value,
        timezone: result.components.timezone?.value,
        sessionStorage: result.components.sessionStorage?.value,
        localStorage: result.components.localStorage?.value,
        indexedDb: result.components.indexedDb?.value,
        canvas: result.components.canvas?.value?.substring(0, 32), // Truncate for privacy
      };

      this.log('Fingerprint loaded:', this.fingerprint);
    } catch (error) {
      this.logError('Failed to load fingerprint', error);
      // Generate fallback fingerprint
      this.fingerprint = this.generateFallbackFingerprint();
    }
  }

  /**
   * Generate fallback fingerprint if FingerprintJS fails
   */
  generateFallbackFingerprint() {
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      new Date().getTimezoneOffset(),
      screen.width + 'x' + screen.height,
      screen.colorDepth,
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < components.length; i++) {
      const char = components.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Get or create session ID
   */
  getOrCreateSessionId() {
    // Check cookie first
    const cookieSession = this.getCookie(this.config.sessionCookieName);
    if (cookieSession) {
      return cookieSession;
    }

    // Check sessionStorage
    const storageSession = sessionStorage.getItem('tracking_session_id');
    if (storageSession) {
      return storageSession;
    }

    // Generate new session ID
    const newSessionId = uuidv4();
    
    // Store in cookie and sessionStorage
    this.setCookie(this.config.sessionCookieName, newSessionId, 30); // 30 day expiry
    sessionStorage.setItem('tracking_session_id', newSessionId);

    return newSessionId;
  }

  /**
   * Set the current case being tracked
   */
  setCase(caseId) {
    this.caseId = caseId;
    this.log('Case ID set:', caseId);
  }

  /**
   * Track a page view event
   */
  trackPageView(data = {}) {
    const event = {
      eventType: 'page_view',
      url: window.location.href,
      path: window.location.pathname,
      pageTitle: document.title,
      referrer: document.referrer,
      ...data,
    };

    this.trackEvent(event);
    this.sessionMetadata.pageViews++;
    this.pageStartTime = Date.now();
  }

  /**
   * Track a custom event
   */
  trackEvent(eventData) {
    const event = {
      ...eventData,
      sessionId: this.sessionId,
      fingerprint: this.fingerprint,
      caseId: this.caseId || this.extractCaseIdFromUrl(),
      timestamp: new Date().toISOString(),
      localTime: new Date().toString(),
      timezone: this.sessionMetadata.timezone,
      
      // Page context
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      
      // Timing
      timeOnPage: Math.floor((Date.now() - this.pageStartTime) / 1000),
      timeSinceLastActivity: Math.floor((Date.now() - this.lastActivityTime) / 1000),
      
      // Engagement metrics
      scrollDepth: this.scrollDepth,
      clicksCount: this.clickCount,
      
      // Check for unusual hour (2 AM - 5 AM)
      isUnusualHour: this.checkUnusualHour(),
    };

    // Add to queue
    this.eventQueue.push(event);
    this.sessionMetadata.events++;
    this.lastActivityTime = Date.now();

    // Send immediately if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.sendBatch();
    }

    this.log('Event tracked:', eventData.eventType);
  }

  /**
   * Setup event listeners for automatic tracking
   */
  setupEventListeners() {
    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent({
          eventType: 'visibility_change',
          hidden: true,
          timeOnPage: Math.floor((Date.now() - this.pageStartTime) / 1000),
        });
        // Send any pending events before page hides
        this.sendBatch();
      } else {
        this.trackEvent({
          eventType: 'visibility_change',
          hidden: false,
        });
      }
    });

    // Before unload - send remaining events
    window.addEventListener('beforeunload', () => {
      this.trackEvent({
        eventType: 'page_exit',
        timeOnPage: Math.floor((Date.now() - this.pageStartTime) / 1000),
        scrollDepth: this.scrollDepth,
      });
      // Use sendBeacon for reliability
      this.sendBatch(true);
    });

    // Scroll tracking
    if (this.config.enableScrollTracking) {
      this.setupScrollTracking();
    }

    // Click tracking
    if (this.config.enableClickTracking) {
      this.setupClickTracking();
    }

    // Form tracking
    if (this.config.enableFormTracking) {
      this.setupFormTracking();
    }

    // Error tracking
    if (this.config.enableErrorTracking) {
      this.setupErrorTracking();
    }

    // Copy event tracking (potential data scraping)
    document.addEventListener('copy', (e) => {
      const selection = window.getSelection().toString();
      this.trackEvent({
        eventType: 'copy',
        selectionLength: selection.length,
        selectionPreview: selection.substring(0, 100),
      });
    });

    // Print tracking
    window.addEventListener('beforeprint', () => {
      this.trackEvent({
        eventType: 'print',
        page: window.location.pathname,
      });
    });

    // Network status
    window.addEventListener('online', () => {
      this.trackEvent({ eventType: 'network_online' });
    });

    window.addEventListener('offline', () => {
      this.trackEvent({ eventType: 'network_offline' });
    });
  }

  /**
   * Setup scroll tracking
   */
  setupScrollTracking() {
    let scrollTimer;
    let lastScrollY = 0;
    let maxScrollDepth = 0;

    const calculateScrollDepth = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollY = window.scrollY;
      
      const scrollPercentage = ((scrollY + windowHeight) / documentHeight) * 100;
      return Math.min(Math.round(scrollPercentage), 100);
    };

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      
      const currentScrollDepth = calculateScrollDepth();
      if (currentScrollDepth > maxScrollDepth) {
        maxScrollDepth = currentScrollDepth;
        this.scrollDepth = maxScrollDepth;
      }

      // Detect rapid scrolling (potential bot behavior)
      const scrollSpeed = Math.abs(window.scrollY - lastScrollY);
      if (scrollSpeed > 5000) { // Very fast scroll
        this.trackEvent({
          eventType: 'rapid_scroll',
          speed: scrollSpeed,
        });
      }
      lastScrollY = window.scrollY;

      // Track scroll stop
      scrollTimer = setTimeout(() => {
        this.trackEvent({
          eventType: 'scroll',
          depth: this.scrollDepth,
          direction: window.scrollY > lastScrollY ? 'down' : 'up',
        });
      }, 150);
    });
  }

  /**
   * Setup click tracking
   */
  setupClickTracking() {
    let rapidClickCount = 0;
    let rapidClickTimer;

    document.addEventListener('click', (e) => {
      const target = e.target;
      
      // Increment click count
      this.clickCount++;
      
      // Check for rapid clicking (potential bot)
      rapidClickCount++;
      clearTimeout(rapidClickTimer);
      rapidClickTimer = setTimeout(() => {
        if (rapidClickCount > 10) {
          this.trackEvent({
            eventType: 'rapid_clicks',
            count: rapidClickCount,
          });
        }
        rapidClickCount = 0;
      }, 1000);

      // Get element info
      const elementInfo = {
        tagName: target.tagName,
        id: target.id,
        className: target.className,
        text: target.textContent?.substring(0, 50),
        href: target.href,
      };

      // Track specific elements
      if (target.dataset.track) {
        this.trackEvent({
          eventType: 'click',
          element: target.dataset.track,
          ...elementInfo,
        });
      }

      // Track outbound links
      if (target.tagName === 'A' && target.href) {
        const url = new URL(target.href);
        if (url.hostname !== window.location.hostname) {
          this.trackEvent({
            eventType: 'outbound_link',
            url: target.href,
            ...elementInfo,
          });
        }
      }

      // Track button clicks
      if (target.tagName === 'BUTTON' || target.type === 'submit') {
        this.trackEvent({
          eventType: 'button_click',
          ...elementInfo,
        });
      }
    }, true);
  }

  /**
   * Setup form tracking
   */
  setupFormTracking() {
    // Track form focus
    document.addEventListener('focusin', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        this.trackEvent({
          eventType: 'form_field_focus',
          fieldName: e.target.name,
          fieldType: e.target.type,
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target;
      
      this.trackEvent({
        eventType: 'form_submit',
        formId: form.id,
        formName: form.name,
        formAction: form.action,
        formMethod: form.method,
        fields: Array.from(form.elements)
          .filter(el => el.name)
          .map(el => ({
            name: el.name,
            type: el.type,
            filled: el.value ? true : false,
          })),
      });
    });

    // Track form abandonment
    let formInteracted = false;
    let formTimer;

    document.addEventListener('input', () => {
      formInteracted = true;
      clearTimeout(formTimer);
      
      formTimer = setTimeout(() => {
        if (formInteracted && document.activeElement.tagName !== 'INPUT') {
          this.trackEvent({
            eventType: 'form_abandon',
            lastField: document.activeElement.name,
          });
          formInteracted = false;
        }
      }, 30000); // 30 seconds of inactivity
    });
  }

  /**
   * Setup error tracking
   */
  setupErrorTracking() {
    // JavaScript errors
    window.addEventListener('error', (e) => {
      this.trackEvent({
        eventType: 'javascript_error',
        message: e.message,
        filename: e.filename,
        line: e.lineno,
        column: e.colno,
        stack: e.error?.stack?.substring(0, 500),
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      this.trackEvent({
        eventType: 'promise_rejection',
        reason: String(e.reason).substring(0, 500),
      });
    });

    // Resource load errors
    window.addEventListener('error', (e) => {
      if (e.target !== window) {
        this.trackEvent({
          eventType: 'resource_error',
          tagName: e.target.tagName,
          src: e.target.src || e.target.href,
        });
      }
    }, true);
  }

  /**
   * Extract case ID from URL
   */
  extractCaseIdFromUrl() {
    // Check URL path for /case/{id}
    const pathMatch = window.location.pathname.match(/\/case\/([^\/]+)/);
    if (pathMatch) {
      return pathMatch[1];
    }

    // Check subdomain
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      return parts[0];
    }

    return 'global';
  }

  /**
   * Check if current time is unusual hour (2 AM - 5 AM)
   */
  checkUnusualHour() {
    const hour = new Date().getHours();
    return hour >= 2 && hour < 5;
  }

  /**
   * Start batch processing timer
   */
  startBatchProcessing() {
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.sendBatch();
      }
    }, this.config.batchInterval);
  }

  /**
   * Send batch of events to server
   */
  async sendBatch(useBeacon = false) {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    const payload = {
      events,
      sessionMetadata: this.sessionMetadata,
    };

    try {
      if (useBeacon && navigator.sendBeacon) {
        // Use sendBeacon for reliability on page unload
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(`${this.config.apiEndpoint}${this.config.batchEndpoint}`, blob);
      } else {
        // Normal fetch request
        const response = await fetch(`${this.config.apiEndpoint}${this.config.batchEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': this.sessionId,
            'X-Fingerprint': this.fingerprint || '',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.log('Batch sent successfully:', data);
      }
    } catch (error) {
      this.logError('Failed to send batch', error);
      // Re-queue events for retry
      this.eventQueue = [...events, ...this.eventQueue];
    }
  }

  /**
   * Track specific suspicious behavior
   */
  trackSuspiciousBehavior(type, details = {}) {
    this.trackEvent({
      eventType: 'suspicious_behavior',
      suspiciousType: type,
      ...details,
      priority: 'high',
    });

    // Send immediately
    this.sendBatch();
  }

  /**
   * Public API Methods
   */

  // Track custom event
  track(eventName, data = {}) {
    this.trackEvent({
      eventType: 'custom',
      eventName,
      ...data,
    });
  }

  // Track tip submission
  trackTipSubmission(tipData) {
    this.trackEvent({
      eventType: 'tip_submit',
      ...tipData,
    });
  }

  // Track contact form
  trackContactSubmission(contactData) {
    this.trackEvent({
      eventType: 'contact_submit',
      ...contactData,
    });
  }

  // Track donation
  trackDonation(amount, method) {
    this.trackEvent({
      eventType: 'donation_complete',
      amount,
      method,
    });
  }

  // Track media interaction
  trackMediaView(mediaType, mediaId) {
    this.trackEvent({
      eventType: 'media_view',
      mediaType,
      mediaId,
    });
  }

  // Track search
  trackSearch(query, results) {
    this.trackEvent({
      eventType: 'search',
      query,
      resultsCount: results,
    });
  }

  // Track share
  trackShare(platform, content) {
    this.trackEvent({
      eventType: 'share',
      platform,
      content,
    });
  }

  /**
   * Utility methods
   */

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }

  setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  }

  log(...args) {
    if (this.config.enableLogging) {
      console.log('[CaseTracker]', ...args);
    }
  }

  logError(...args) {
    if (this.config.enableLogging) {
      console.error('[CaseTracker]', ...args);
    }
  }

  /**
   * Cleanup method
   */
  destroy() {
    // Send remaining events
    this.sendBatch(true);
    
    // Clear timers
    // Remove event listeners if needed
    
    this.log('Tracker destroyed');
  }
}

// Export singleton instance
const tracker = new CaseTracker();

export default tracker;
export { CaseTracker };