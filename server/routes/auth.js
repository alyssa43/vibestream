import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import {
  signup,
  login,
  logout,
  getCurrentUser,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, getCurrentUser);

export default router;
