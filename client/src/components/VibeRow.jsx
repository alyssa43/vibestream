import { useEffect, useRef, useState } from 'react';
import { getVibeRow } from '../api/client.js';
import Card from './Card.jsx';
import styles from './VibeRow.module.css';

const SKELETON_COUNT = 8;

export default function VibeRow({ vibe }) {
  const { slug, name, description, accent } = vibe;
  const [titles, setTitles] = useState(null);
  const [error, setError] = useState(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const stripRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    getVibeRow(slug)
      .then(({ titles: rowTitles }) => {
        if (!cancelled) setTitles(rowTitles);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Something went wrong loading this row.');
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    function updateScrollState() {
      const remaining = el.scrollWidth - el.clientWidth - el.scrollLeft;
      setCanScrollRight(remaining > 8);
    }

    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [titles]);

  function scrollNext() {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.85, behavior: 'smooth' });
  }

  return (
    <section className={styles.row} style={{ '--row-accent': accent }}>
      <div className={styles.header}>
        <span className={styles.accentBar} />
        <h2 className={styles.name}>{name}</h2>
        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.stripWrap}>
        <div className={styles.strip} ref={stripRef} tabIndex={-1}>
          {error && <p className={styles.error}>Couldn&rsquo;t load this row. {error}</p>}

          {!error && titles === null &&
            Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className={styles.skeletonCard} aria-hidden="true" />
            ))}

          {!error && titles !== null && titles.length === 0 && (
            <p className={styles.empty}>No titles found for this vibe yet.</p>
          )}

          {!error &&
            titles &&
            titles.map((title) => (
              <Card key={`${title.media_type}:${title.tmdb_id}`} title={title} accent={accent} />
            ))}
        </div>

        {canScrollRight && (
          <button
            type="button"
            className={styles.scrollButton}
            onClick={scrollNext}
            aria-label={`Scroll ${name} row right`}
          >
            <ArrowIcon />
          </button>
        )}
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
