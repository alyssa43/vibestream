import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProviders, getTitleDetails } from '../api/client.js';
import { useAuth } from '../context/useAuth.js';
import { backdropUrl, posterUrl } from '../lib/images.js';
import styles from './TitleDetails.module.css';

export default function TitleDetails() {
  const { mediaType, id } = useParams();
  // Keyed so navigating between two title pages remounts the view instead of
  // reusing state from the previous title (see TitleDetailsView's effect).
  return <TitleDetailsView key={`${mediaType}-${id}`} mediaType={mediaType} id={id} />;
}

function TitleDetailsView({ mediaType, id }) {
  const navigate = useNavigate();
  const { user, isOnWatchlist, addToWatchlist, removeFromWatchlist } = useAuth();

  const [details, setDetails] = useState(null);
  const [providers, setProviders] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getTitleDetails(mediaType, id)
      .then((data) => {
        if (!cancelled) setDetails(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load this title.');
      });

    getProviders(mediaType, id)
      .then((data) => {
        if (!cancelled) setProviders(data);
      })
      .catch(() => {
        if (!cancelled) setProviders(null);
      });

    return () => {
      cancelled = true;
    };
  }, [mediaType, id]);

  if (error) {
    return (
      <div className={styles.stateWrap}>
        <p>Couldn&rsquo;t load this title. {error}</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className={styles.stateWrap}>
        <p>Loading&hellip;</p>
      </div>
    );
  }

  const name = details.title || details.name;
  const dateStr = details.release_date || details.first_air_date;
  const year = dateStr ? dateStr.slice(0, 4) : null;
  const runtime =
    mediaType === 'movie' ? details.runtime : details.episode_run_time?.[0];
  const genres = details.genres || [];
  const rating = details.vote_average ? details.vote_average.toFixed(1) : null;
  const backdrop = backdropUrl(details.backdrop_path);
  const poster = posterUrl(details.poster_path, 500);
  const onList = isOnWatchlist(mediaType, Number(id));
  const usProviders = providers?.results?.US;

  async function handleToggleWatchlist() {
    if (!user) {
      navigate('/login');
      return;
    }

    setBusy(true);
    try {
      if (onList) {
        await removeFromWatchlist(mediaType, id);
      } else {
        await addToWatchlist(id, mediaType, {
          title: name,
          poster_path: details.poster_path,
          release_date: dateStr,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.backdropWrap}>
        {backdrop && <img src={backdrop} alt="" className={styles.backdrop} />}
        <div className={styles.scrim} />
      </div>

      <div className={styles.content}>
        <div className={styles.posterCol}>
          {poster ? (
            <img src={poster} alt={`${name} poster`} className={styles.poster} />
          ) : (
            <div className={styles.posterPlaceholder}>{name}</div>
          )}
        </div>

        <div className={styles.infoCol}>
          <h1 className={styles.title}>{name}</h1>

          <div className={styles.meta}>
            {year && <span>{year}</span>}
            {runtime ? <span>{runtime} min</span> : null}
            {rating && <span>&#9733; {rating}</span>}
          </div>

          {genres.length > 0 && (
            <div className={styles.genres}>
              {genres.map((g) => (
                <span key={g.id} className={styles.genrePill}>
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {details.tagline && <p className={styles.tagline}>{details.tagline}</p>}

          <p className={styles.overview}>{details.overview}</p>

          <button
            type="button"
            className={onList ? styles.listButtonActive : styles.listButton}
            onClick={handleToggleWatchlist}
            disabled={busy}
          >
            {onList ? 'On My List ✓' : '+ Add to My List'}
          </button>

          <section className={styles.providers}>
            <h2 className={styles.sectionHeading}>Where to watch</h2>
            {usProviders?.flatrate?.length ? (
              <div className={styles.providerLogos}>
                {usProviders.flatrate.map((p) => (
                  <img
                    key={p.provider_name}
                    src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                    alt={p.provider_name}
                    title={p.provider_name}
                    className={styles.providerLogo}
                  />
                ))}
              </div>
            ) : (
              <p className={styles.providersEmpty}>
                Not currently available to stream in the US.
              </p>
            )}
          </section>

          <section className={styles.reviews}>
            <h2 className={styles.sectionHeading}>Reviews</h2>
            <p className={styles.reviewsPlaceholder}>Reviews are coming in a later phase.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
