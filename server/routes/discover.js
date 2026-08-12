import express from 'express';
import { getDiscover } from '../controllers/discoverController.js';

const router = express.Router();

router.get('/:slug', getDiscover);

export default router;
