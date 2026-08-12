import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '../controllers/watchlistController.js';

const router = express.Router();

// Every watchlist route requires a logged-in user
router.use(requireAuth);

router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.delete('/:mediaType/:tmdbId', removeFromWatchlist);

export default router;
