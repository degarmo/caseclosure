import { useState, useEffect } from 'react';
import api from '@/utils/axios';

export function useBetaMode() {
  const [betaMode, setBetaMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBetaMode = async () => {
      try {
        const response = await api.get('/settings/public/beta-status/');
        setBetaMode(response.data.beta_mode_enabled);
      } catch (error) {
        console.error('Error checking beta mode:', error);
        setBetaMode(false);
      } finally {
        setLoading(false);
      }
    };

    checkBetaMode();
  }, []);

  return { betaMode, loading };
}