import { Router } from 'express';
import giftsRouter from './gifts.routes.js';

const router = Router();

router.use('/gifts', giftsRouter);

router.get('/wallet/transactions', (_req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    hint: 'Your current OpenAPI covers /gifts/*; implement /wallet/* similarly.'
  });
});

export default router;
