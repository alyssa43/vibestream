import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchMulti } from '../api/client.js';
import Card from '../components/Card.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PosterGrid from '../components/PosterGrid.jsx';
import SkeletonCard from '../components/SkeletonCard.jsx';
import styles from './Search.module.css';

const SKELETON_COUNT = 12;

function normalizeResults(results) {
  return results
    .filter((r) => r.media_type !== 'person')
    .map((r) => ({
      tmdb_id: r.id,
      media_type: r.media_type,
      title: r.title || r.name,
      poster_path: r.poster_path,
      release_date: r.release_date || r.first_air_date,
    }));
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [inputValue, setInputValue] = useState(query);
  const [prevQuery, setPrevQuery] = useState(query);

  // Keep the input in sync if the URL query changes from outside typing
  // (back/forward navigation, direct load with ?q=...). Adjusting state
  // during render instead of in an Effect avoids an extra render pass.
  if (query !== prevQuery) {
    setPrevQuery(query);
    setInputValue(query);
  }

  // Debounce keystrokes into the URL, which is the single source of truth
  // for what's being searched.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const trimmed = inputValue.trim();
      if (trimmed !== query) {
        setSearchParams(trimmed ? { q: trimmed } : {}, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [inputValue, query, setSearchParams]);

  return (
    <div className={styles.page}>
      <div className={styles.searchBar}>
        <input
          type="search"
          className={styles.input}
          placeholder="Search movies and shows"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          aria-label="Search movies and shows"
        />
      </div>

      {query ? (
        <SearchResults key={query} query={query} />
      ) : (
        <EmptyState heading="Search VibeStream" message="Find a movie or show by title." />
      )}
    </div>
  );
}

function SearchResults({ query }) {
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    searchMulti(query, 1)
      .then((data) => {
        if (cancelled) return;
        setResults(normalizeResults(data.results));
        setPage(1);
        setTotalPages(data.total_pages);
        setStatus('loaded');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Search failed.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  function loadMore() {
    setStatus('loading-more');
    searchMulti(query, page + 1)
      .then((data) => {
        setResults((prev) => [...prev, ...normalizeResults(data.results)]);
        setPage((p) => p + 1);
        setTotalPages(data.total_pages);
        setStatus('loaded');
      })
      .catch((err) => {
        setError(err.message || 'Failed to load more results.');
        setStatus('error');
      });
  }

  if (status === 'error') {
    return <p className={styles.error}>Couldn&rsquo;t search right now. {error}</p>;
  }

  if (status === 'loading') {
    return (
      <PosterGrid>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </PosterGrid>
    );
  }

  if (results.length === 0) {
    return (
      <EmptyState
        heading="No results"
        message={`Nothing matched "${query}". Try a different title.`}
      />
    );
  }

  return (
    <>
      <PosterGrid>
        {results.map((title) => (
          <Card key={`${title.media_type}:${title.tmdb_id}`} title={title} />
        ))}
      </PosterGrid>

      {page < totalPages && (
        <div className={styles.loadMoreWrap}>
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={loadMore}
            disabled={status === 'loading-more'}
          >
            {status === 'loading-more' ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </>
  );
}
