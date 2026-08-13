import { useEffect, useState } from 'react';
import { deleteReview, getReview, saveReview } from '../api/client.js';
import { useAuth } from '../context/useAuth.js';
import EmptyState from './EmptyState.jsx';
import styles from './ReviewSection.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ReviewSection({ mediaType, tmdbId }) {
  const { user } = useAuth();

  const [review, setReview] = useState(undefined); // undefined = loading, null = none
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    getReview(mediaType, tmdbId)
      .then(({ review: found }) => {
        if (!cancelled) setReview(found);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404) {
          setReview(null);
        } else {
          setError(err.message || 'Failed to load your review.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, mediaType, tmdbId]);

  function handleStartEdit(existing) {
    setText(existing?.text || '');
    setTags(existing?.mood_tags || []);
    setTagInput('');
    setFormError(null);
    setEditing(true);
  }

  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/,$/, '');
      if (trimmed && !tags.includes(trimmed)) {
        setTags((prev) => [...prev, trimmed]);
      }
      setTagInput('');
    }
  }

  function removeTag(tag) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!text.trim() && tags.length === 0) {
      setFormError('Add some text or at least one mood tag.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const { review: saved } = await saveReview(mediaType, tmdbId, {
        text: text.trim(),
        mood_tags: tags,
      });
      setReview(saved);
      setEditing(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save review.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete your review?')) return;

    setDeleting(true);
    try {
      await deleteReview(mediaType, tmdbId);
      setReview(null);
    } catch (err) {
      setError(err.message || 'Failed to delete review.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className={styles.reviews}>
      <h2 className={styles.sectionHeading}>Reviews</h2>

      {!user && (
        <EmptyState
          heading="Log in to review"
          message="Sign in to write your own review."
          actionTo="/login"
          actionLabel="Log in"
        />
      )}

      {user && review === undefined && !error && <p className={styles.loading}>Loading&hellip;</p>}

      {user && error && <p className={styles.error}>{error}</p>}

      {user && review !== undefined && !error && !editing && review && (
        <div className={styles.reviewView}>
          {review.text && <p className={styles.reviewText}>{review.text}</p>}
          {review.mood_tags?.length > 0 && (
            <div className={styles.tags}>
              {review.mood_tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p className={styles.updatedAt}>Updated {formatDate(review.updated_at)}</p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => handleStartEdit(review)}
            >
              Edit
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {user && review !== undefined && !error && !editing && !review && (
        <div className={styles.emptyReview}>
          <p className={styles.emptyReviewText}>You haven&rsquo;t reviewed this yet.</p>
          <button type="button" className={styles.primaryButton} onClick={() => handleStartEdit(null)}>
            Write a review
          </button>
        </div>
      )}

      {user && editing && (
        <form className={styles.form} onSubmit={handleSave}>
          <textarea
            className={styles.textarea}
            placeholder="What did you think?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
          />

          <input
            type="text"
            className={styles.tagInput}
            placeholder="Add a mood tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />

          {tags.length > 0 && (
            <div className={styles.tags}>
              {tags.map((tag) => (
                <span key={tag} className={styles.tagChip}>
                  {tag}
                  <button
                    type="button"
                    className={styles.tagRemove}
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}

          {formError && <p className={styles.error}>{formError}</p>}

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryButton} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
