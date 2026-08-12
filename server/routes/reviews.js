import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import {
  getReviews,
  getReview,
  saveReview,
  deleteReview,
} from '../controllers/reviewsController.js';

const router = express.Router();

// Every reviews route requires a logged-in user
router.use(requireAuth);

router.get('/', getReviews);
router.get('/:mediaType/:tmdbId', getReview);
router.put('/:mediaType/:tmdbId', saveReview);
router.delete('/:mediaType/:tmdbId', deleteReview);

export default router;
