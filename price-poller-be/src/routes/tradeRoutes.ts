import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { closeTrade, tradeProcessor } from "../controllers/tradeController";

const router = Router();
router.post('/' , authenticateToken , tradeProcessor )
router.post('/close' , authenticateToken , closeTrade)


export default router;