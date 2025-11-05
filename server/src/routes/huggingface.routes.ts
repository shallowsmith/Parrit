import { Router } from 'express';
import type { Request, Response } from 'express';
import { categorize } from '../services/HuggingFaceService';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/category', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Missing text' });

    const result = await categorize(text);
    res.json(result);
  } catch (error: any) {
    console.error('HuggingFace inference error:', error);
    res.status(500).json({ error: 'Inference failed', message: error.message });
  }
});

export default router;
