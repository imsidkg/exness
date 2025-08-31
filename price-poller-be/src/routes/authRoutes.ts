
import { Router } from 'express';
import { signup, signin, getAccountSummary } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/account-summary', authenticateToken, getAccountSummary);

export default router;
