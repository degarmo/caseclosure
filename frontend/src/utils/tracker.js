// tracking.js - Core tracking module
import FingerprintJS from '@fingerprintjs/fingerprintjs';

class CaseTracker {
    constructor() {
        this.fpPromise = FingerprintJS.load();
        this.sessionId = this.getOrCreateSessionId();
        this.caseId = this.extractCaseId();
        this.queue = [];
        this.initializeTracking();
    }

    async initializeTracking() {
        // Get fingerprint
        const fp = await this.fpPromise;
        const result = await fp.get();
        this.fingerprint = result.visitorId;
        
        // Track page load
        this.trackEvent('page_view', {
            page: window.location.pathname,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
            localTime: new Date().toString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        
        // Set up listeners
        this.setupEventListeners();
        this.detectUnusualActivity();
    }

    extractCaseId() {
        // Extract from URL path
        const pathMatch = window.location.pathname.match(/\/case\/([^\/]+)/);
        if (pathMatch) return pathMatch[1];
        
        // Extract from subdomain
        const subdomain = window.location.hostname.split('.')[0];
        if (subdomain !== 'www' && subdomain !== 'caseclosure') {
            return subdomain;
        }
        
        return 'global';
    }

    async trackEvent(eventType, data) {
        const enrichedData = {
            ...data,
            eventType,
            caseId: this.caseId,
            sessionId: this.sessionId,
            fingerprint: this.fingerprint,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };

        // Check if it's unusual time
        enrichedData.isUnusualHour = this.checkUnusualHour();
        
        // Send to backend
        this.sendToBackend(enrichedData);
    }

    checkUnusualHour() {
        const hour = new Date().getHours();
        // Flag as unusual if between 2 AM and 5 AM local time
        return hour >= 2 && hour < 5;
    }

    setupEventListeners() {
        // Page visibility
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('visibility_change', {
                hidden: document.hidden,
                timeOnPage: this.getTimeOnPage()
            });
        });

        // Scroll tracking
        let scrollTimer;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                this.trackEvent('scroll', {
                    depth: this.getScrollDepth(),
                    speed: this.calculateScrollSpeed()
                });
            }, 150);
        });

        // Click tracking
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-track]');
            if (target) {
                this.trackEvent('click', {
                    element: target.dataset.track,
                    text: target.textContent.substring(0, 50)
                });
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.dataset.trackForm) {
                this.trackEvent('form_submit', {
                    formId: e.target.id,
                    formType: e.target.dataset.trackForm
                });
            }
        });

        // Copy events (potential data scraping)
        document.addEventListener('copy', () => {
            this.trackEvent('content_copy', {
                selection: window.getSelection().toString().substring(0, 100)
            });
        });

        // Rapid navigation detection
        let navigationCount = 0;
        let navigationTimer;
        window.addEventListener('beforeunload', () => {
            navigationCount++;
            clearTimeout(navigationTimer);
            navigationTimer = setTimeout(() => {
                navigationCount = 0;
            }, 5000);
            
            if (navigationCount > 5) {
                this.trackEvent('rapid_navigation', {
                    count: navigationCount
                });
            }
        });
    }

    async sendToBackend(data) {
        try {
            await fetch('/api/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            // Queue for retry
            this.queue.push(data);
        }
    }
}

// Initialize tracker
const tracker = new CaseTracker();
export default tracker;