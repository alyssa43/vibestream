import express from 'express';
import { listVibes, getVibe } from '../controllers/vibesController.js';

const router = express.Router();

router.get('/', listVibes);
router.get('/:slug', getVibe);

export default router;
