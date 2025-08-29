import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { tradeProcessor } from "../controllers/tradeController";

const router = Router();
router.post('/trade' , authenticateToken , tradeProcessor )