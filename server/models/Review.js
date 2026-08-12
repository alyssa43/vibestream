import mongoose from '../db/mongo.js';

const reviewSchema = new mongoose.Schema(
  {
    // Points at users.id in Postgres. Nothing enforces this across databases --
    // it's a plain number that our app agrees to treat as a foreign key.
    user_id: {
      type: Number,
      required: true,
      index: true,
    },
    tmdb_id: {
      type: Number,
      required: true,
      index: true,
    },
    media_type: {
      type: String,
      required: true,
      enum: ['movie', 'tv'],
    },
    text: {
      type: String,
      trim: true,
    },
    mood_tags: {
      type: [String],
      default: [],
    },
  },
  {
    // strict: false lets documents carry fields we never declared above.
    // That's the point of putting reviews in Mongo -- a user who wants to
    // save a rewatch count or a custom field isn't blocked by the schema.
    strict: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// A user gets one review per title -- same rule as the watchlist's UNIQUE
// constraint, enforced by a Mongo index instead of a Postgres constraint.
reviewSchema.index({ user_id: 1, tmdb_id: 1, media_type: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
