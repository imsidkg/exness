
import { Router } from 'express';
import { signup, signin, getBalance } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/balance', authenticateToken, getBalance);

export default router;
