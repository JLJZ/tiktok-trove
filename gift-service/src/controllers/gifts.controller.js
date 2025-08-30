import { GiftsService } from '../services/gifts.service.js';
const svc = new GiftsService();

export async function listCatalog(_req, res, next) {
  try {
    const items = await svc.listCatalog();
    res.json(items);
  } catch (err) { next(err); }
}

export async function sendGift(req, res, next) {
  try {
    const senderId = req.header('x-user-id') || 'anonymous';
    const receipt = await svc.sendGift({ ...req.body, senderId });
    res.status(201).json(receipt);
  } catch (err) { next(err); }
}

export async function listGiftsForVideo(req, res, next) {
  try {
    const items = await svc.listGiftsForVideo(req.params.videoId);
    res.json(items);
  } catch (err) { next(err); }
}
