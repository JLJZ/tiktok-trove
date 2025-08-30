import { Router } from 'express';
import * as GiftsController from '../controllers/gifts.controller.js';
import { validateBody } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();

const sendGiftSchema = z.object({
  videoId: z.string().min(1),
  giftId: z.string().min(1),
  qty: z.number().int().positive()
});

router.get('/catalog', GiftsController.listCatalog);
router.post('/send', validateBody(sendGiftSchema), GiftsController.sendGift);
router.get('/video/:videoId', GiftsController.listGiftsForVideo);

export default router;
