import express from 'express';
import {
  searchMulti,
  getDetails,
  getProviders,
} from '../controllers/tmdbController.js';

const router = express.Router();

// NOTE: /search/multi must stay above /:mediaType/:id -- otherwise Express
// matches "search" as :mediaType and the search route becomes unreachable.
router.get('/search/multi', searchMulti);
router.get('/:mediaType/:id', getDetails);
router.get('/:mediaType/:id/providers', getProviders);

export default router;
