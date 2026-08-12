import express from 'express';
import { getVibe } from '../controllers/vibesController.js';

const router = express.Router();

router.get('/:slug', getVibe);

export default router;
