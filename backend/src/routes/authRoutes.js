import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { softVerifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', softVerifyToken, getMe);

export default router;
