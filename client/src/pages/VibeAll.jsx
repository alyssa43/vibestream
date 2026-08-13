import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getDiscover } from '../api/client.js';
import Card from '../components/Card.jsx';
import PosterGrid from '../components/PosterGrid.jsx';
import SkeletonCard from '../components/SkeletonCard.jsx';
import { useVibes } from '../context/useVibes.js';
import styles from './VibeAll.module.css';

const SKELETON_COUNT = 12;

export default function VibeAll() {
  const { slug } = useParams();
  // Keyed so navigating between two vibes remounts the view instead of
  // reusing state from the previous vibe (see TitleDetails for the same
  // pattern).
  return <VibeAllView key={slug} slug={slug} />;
}

function VibeAllView({ slug }) {
  const { getVibeBySlug } = useVibes();
  const vibe = getVibeBySlug(slug);

  const [titles, setTitles] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getDiscover(slug, 1)
      .then((data) => {
        if (cancelled) return;
        setTitles(data.titles);
        setPage(data.page);
        setTotalPages(data.total_pages);
        setStatus('loaded');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404) {
          setNotFound(true);
        } else {
          setError(err.message || 'Failed to load titles.');
        }
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  function loadMore() {
    setStatus('loading-more');
    getDiscover(slug, page + 1)
      .then((data) => {
        setTitles((prev) => [...(prev || []), ...data.titles]);
        setPage(data.page);
        setTotalPages(data.total_pages);
        setStatus('loaded');
      })
      .catch((err) => {
        setError(err.message || 'Failed to load more titles.');
        setStatus('error');
      });
  }

  if (notFound) {
    return (
      <div className={styles.stateWrap}>
        <p>We couldn&rsquo;t find that vibe.</p>
        <Link to="/explore" className={styles.link}>
          Browse all vibes
        </Link>
      </div>
    );
  }

  const accent = vibe?.accent;

  return (
    <div className={styles.page}>
      <div className={styles.header} style={{ '--header-accent': accent || 'var(--violet)' }}>
        <span className={styles.accentBar} />
        <div>
          <h1 className={styles.name}>{vibe?.name || slug.replace(/-/g, ' ')}</h1>
          {vibe?.description && <p className={styles.description}>{vibe.description}</p>}
        </div>
      </div>

      {status === 'error' && <p className={styles.error}>Couldn&rsquo;t load this vibe. {error}</p>}

      {status === 'loading' && (
        <PosterGrid>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </PosterGrid>
      )}

      {titles && (
        <>
          <PosterGrid>
            {titles.map((title) => (
              <Card key={`${title.media_type}:${title.tmdb_id}`} title={title} accent={accent} />
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
      )}
    </div>
  );
}
