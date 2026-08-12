import Review from '../models/Review.js';

const VALID_MEDIA_TYPES = ['movie', 'tv'];

// GET /api/reviews -- all of the current user's reviews, newest first
export async function getReviews(req, res) {
  try {
    const reviews = await Review.find({ user_id: req.session.userId })
      .sort({ updated_at: -1 })
      .lean();

    res.json({ reviews });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}

// GET /api/reviews/:mediaType/:tmdbId -- the user's review of one title
export async function getReview(req, res) {
  const { mediaType, tmdbId } = req.params;

  if (!VALID_MEDIA_TYPES.includes(mediaType)) {
    return res.status(400).json({ error: 'mediaType must be "movie" or "tv"' });
  }

  try {
    const review = await Review.findOne({
      user_id: req.session.userId,
      tmdb_id: Number(tmdbId),
      media_type: mediaType,
    }).lean();

    if (!review) {
      return res.status(404).json({ error: 'No review found for that title' });
    }

    res.json({ review });
  } catch (err) {
    console.error('Error fetching review:', err);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
}

// PUT /api/reviews/:mediaType/:tmdbId -- create or update the user's review
export async function saveReview(req, res) {
  const { mediaType, tmdbId } = req.params;
  const { text, mood_tags, ...extraFields } = req.body;

  if (!VALID_MEDIA_TYPES.includes(mediaType)) {
    return res.status(400).json({ error: 'mediaType must be "movie" or "tv"' });
  }

  if (!text && (!mood_tags || mood_tags.length === 0)) {
    return res
      .status(400)
      .json({ error: 'A review needs either text or at least one mood tag' });
  }

  try {
    // upsert = true: creates if absent, update if present. 
    // Avoids needing separate POST-to-create and PATCH-to-edit routes for a one-per-title resource.
    // ...extraFields catches anything beyond text/mood_tags and passes it through to the document. 
    // strict: false on the schema means it gets saved without any schema change -- e.g. sending rewatch_count: 4 just works.
    const review = await Review.findOneAndUpdate(
      {
        user_id: req.session.userId,
        tmdb_id: Number(tmdbId),
        media_type: mediaType,
      },
      { text, mood_tags, ...extraFields },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({ review });
  } catch (err) {
    console.error('Error saving review:', err);
    res.status(500).json({ error: 'Failed to save review' });
  }
}

// DELETE /api/reviews/:mediaType/:tmdbId
export async function deleteReview(req, res) {
  const { mediaType, tmdbId } = req.params;

  if (!VALID_MEDIA_TYPES.includes(mediaType)) {
    return res.status(400).json({ error: 'mediaType must be "movie" or "tv"' });
  }

  try {
    const result = await Review.deleteOne({
      user_id: req.session.userId,
      tmdb_id: Number(tmdbId),
      media_type: mediaType,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'No review found for that title' });
    }

    res.status(204).end();
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
}
