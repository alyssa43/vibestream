import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import PosterGrid from '../components/PosterGrid.jsx';
import WatchlistCard from '../components/WatchlistCard.jsx';
import { useAuth } from '../context/useAuth.js';
import styles from './Watchlist.module.css';

export default function Watchlist() {
  const { user, loading, watchlist, removeFromWatchlist } = useAuth();
  const [error, setError] = useState(null);

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  async function handleRemove(title) {
    try {
      await removeFromWatchlist(title.media_type, title.tmdb_id);
    } catch (err) {
      setError(err.message || 'Failed to remove title. Please try again.');
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>My List</h1>
      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.loading}>Loading&hellip;</p>
      ) : watchlist.length === 0 ? (
        <EmptyState
          heading="Your list is empty"
          message="Save titles from the homepage to find them here."
          actionTo="/"
          actionLabel="Browse vibes"
        />
      ) : (
        <PosterGrid>
          {watchlist.map((title) => (
            <WatchlistCard
              key={`${title.media_type}:${title.tmdb_id}`}
              title={title}
              onRemove={() => handleRemove(title)}
            />
          ))}
        </PosterGrid>
      )}
    </div>
  );
}
