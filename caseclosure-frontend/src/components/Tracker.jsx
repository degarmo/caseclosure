// caseclosure-frontend/src/components/Tracker.jsx

import { useEffect, useRef } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs'; // make sure to install this

export function Tracker({ victimSubdomain }) {
  const fpPromise = useRef(null);

  // 1. Initialize FingerprintJS once
  useEffect(() => {
    fpPromise.current = FingerprintJS.load();
  }, []);

  // 2. Helper to send an event
  function sendEvent(eventType, metadata = {}) {
    fpPromise.current
      .then(fp => fp.get())
      .then(result => {
        const fingerprint = result.visitorId;
        fetch('http://127.0.0.1:8000/api/tracker/track/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fingerprint,
            url: window.location.href,
            event_type: eventType,
            metadata,
          }),
        }).catch(err => console.error('Tracking error:', err));
      });
  }

  // 3. Example: send a pageview on mount
  useEffect(() => {
    sendEvent('pageview', { pathname: window.location.pathname });
  }, [victimSubdomain]);

  // 4. If you want to track clicks globally:
  useEffect(() => {
    function onClick(e) {
      sendEvent('click', {
        tag: e.target.tagName,
        id: e.target.id,
        classes: e.target.className,
      });
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [victimSubdomain]);

  return null; // this component doesn’t render anything visually
}
