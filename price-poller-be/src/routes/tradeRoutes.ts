import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { closeTrade, tradeProcessor, getClosedTradesForUser, getOpenTradesForUser } from "../controllers/tradeController";

const router = Router();
router.post('/' , authenticateToken , tradeProcessor )
router.post('/close' , authenticateToken , closeTrade)
router.get('/closed' , authenticateToken , getClosedTradesForUser)
router.get('/open' , authenticateToken , getOpenTradesForUser)

export default router;
