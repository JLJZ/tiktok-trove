import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import url from 'url';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export class InMemoryRepo {
  constructor() {
    const p = path.join(__dirname, '../../seeds/gifts.json');
    this.catalog = JSON.parse(fs.readFileSync(p, 'utf-8'));
    this.ledger = new Map();
  }

  async getCatalog() {
    return this.catalog;
  }

  async addGiftToVideo({ videoId, giftId, qty, senderId, coinsCharged, ts }) {
    const entry = { id: randomUUID(), videoId, giftId, qty, senderId, coinsCharged, ts };
    const list = this.ledger.get(videoId) ?? [];
    list.push(entry);
    this.ledger.set(videoId, list);
    return entry;
  }

  async getGiftsForVideo(videoId) {
    return this.ledger.get(videoId) ?? [];
  }
}
