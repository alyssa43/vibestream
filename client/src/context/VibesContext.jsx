import { useEffect, useState } from 'react';
import { getVibes } from '../api/client.js';
import VibesContext from './vibesContext.js';

export function VibesProvider({ children }) {
  const [vibes, setVibes] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getVibes()
      .then(({ vibes: list }) => {
        if (!cancelled) setVibes(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load vibes.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const getVibeBySlug = (slug) => vibes?.find((v) => v.slug === slug) || null;

  const value = { vibes, loading: vibes === null && !error, error, getVibeBySlug };

  return <VibesContext.Provider value={value}>{children}</VibesContext.Provider>;
}
