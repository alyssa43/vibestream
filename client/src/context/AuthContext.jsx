import { useCallback, useEffect, useState } from 'react';
import {
  addToWatchlist as apiAddToWatchlist,
  deleteAccount as apiDeleteAccount,
  getMe,
  getWatchlist,
  login as apiLogin,
  logout as apiLogout,
  removeFromWatchlist as apiRemoveFromWatchlist,
  signup as apiSignup,
} from '../api/client';
import AuthContext from './authContext.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWatchlist = useCallback(async () => {
    try {
      const { titles } = await getWatchlist();
      setWatchlist(titles);
    } catch {
      setWatchlist([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { user: me } = await getMe();
        if (cancelled) return;
        setUser(me);
        await loadWatchlist();
      } catch {
        if (!cancelled) {
          setUser(null);
          setWatchlist([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadWatchlist]);

  const login = useCallback(
    async (email, password) => {
      const { user: loggedInUser } = await apiLogin(email, password);
      setUser(loggedInUser);
      await loadWatchlist();
      return loggedInUser;
    },
    [loadWatchlist]
  );

  const signup = useCallback(
    async (email, password) => {
      const { user: newUser } = await apiSignup(email, password);
      setUser(newUser);
      await loadWatchlist();
      return newUser;
    },
    [loadWatchlist]
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setWatchlist([]);
  }, []);

  const deleteAccount = useCallback(async (password) => {
    await apiDeleteAccount(password);
    setUser(null);
    setWatchlist([]);
  }, []);

  const isOnWatchlist = useCallback(
    (mediaType, tmdbId) =>
      watchlist.some((t) => t.media_type === mediaType && t.tmdb_id === Number(tmdbId)),
    [watchlist]
  );

  const addToWatchlist = useCallback(async (tmdbId, mediaType, card) => {
    await apiAddToWatchlist(tmdbId, mediaType);
    setWatchlist((prev) => {
      if (prev.some((t) => t.media_type === mediaType && t.tmdb_id === Number(tmdbId))) {
        return prev;
      }
      const entry = { ...card, tmdb_id: Number(tmdbId), media_type: mediaType };
      return [entry, ...prev];
    });
  }, []);

  const removeFromWatchlist = useCallback(async (mediaType, tmdbId) => {
    let removed;
    setWatchlist((prev) => {
      removed = prev.find((t) => t.media_type === mediaType && t.tmdb_id === Number(tmdbId));
      return prev.filter((t) => !(t.media_type === mediaType && t.tmdb_id === Number(tmdbId)));
    });

    try {
      await apiRemoveFromWatchlist(mediaType, tmdbId);
    } catch (err) {
      if (removed) setWatchlist((prev) => [removed, ...prev]);
      throw err;
    }
  }, []);

  const value = {
    user,
    loading,
    watchlist,
    isOnWatchlist,
    login,
    signup,
    logout,
    deleteAccount,
    addToWatchlist,
    removeFromWatchlist,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
