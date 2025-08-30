import { getRepo } from '../repositories/index.js';

export class GiftsService {
  constructor(repo = getRepo()) {
    this.repo = repo;
  }

  async listCatalog() {
    return this.repo.getCatalog();
  }

  async sendGift({ videoId, giftId, qty, senderId }) {
    const catalog = await this.repo.getCatalog();
    const gift = catalog.find(g => g.id === giftId);
    if (!gift) {
      const e = new Error(`Gift ${giftId} not found`);
      e.status = 404;
      throw e;
    }

    const coinsCharged = gift.priceCoins * qty;

    const saved = await this.repo.addGiftToVideo({
      videoId, giftId, qty, senderId, coinsCharged, ts: Date.now()
    });

    return {
      message: 'Gift sent',
      videoId,
      giftId,
      qty,
      coinsCharged,
      entryId: saved.id
    };
  }

  async listGiftsForVideo(videoId) {
    const entries = await this.repo.getGiftsForVideo(videoId);
    return entries.map(e => ({ giftId: e.giftId, qty: e.qty, senderId: e.senderId }));
  }
}
