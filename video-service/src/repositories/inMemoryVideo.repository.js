const { v4: uuid } = require('uuid');
const { BadRequestError, NotImplementedError } = require('../utils/errors');

class InMemoryVideoRepository {
  constructor() {
    this.videos = new Map(); // id -> video object
  }

  async create({ title, uploader, file }) {
    if (!file) throw new BadRequestError('file is required');
    const id = uuid();

    const video = {
      id,
      title,
      uploader,
      cdnUrl: `/cdn/${file.filename}`,
      stats: { views: 0, likes: 0, giftsReceived: 0 },
      createdAt: new Date().toISOString(),
    };

    this.videos.set(id, video);
    return video;
  }

  async findById(id) {
    return this.videos.get(id) || null;
  }

  async delete(id) {
    return this.videos.delete(id);
  }

  async getStats(id) {
    const video = this.videos.get(id);
    return video ? video.stats : null;
  }

  async incrementView(id) {
    const video = this.videos.get(id);
    if (!video) return null;
    video.stats.views += 1;
    return video.stats;
  }

  async addGift(id, count = 1) {
    const video = this.videos.get(id);
    if (!video) return null;
    video.stats.giftsReceived += count;
    return video.stats;
  }
}

module.exports.InMemoryVideoRepository = InMemoryVideoRepository;