class VideoService {
  constructor(repo) {
    this.repo = repo;
  }

  async uploadVideo({ title, uploader, file }) {
    return this.repo.create({ title, uploader, file });
  }

  async getVideo(id) {
    return this.repo.findById(id);
  }

  async deleteVideo(id) {
    return this.repo.delete(id);
  }

  async getStats(id) {
    return this.repo.getStats(id);
  }

  async incrementView(id) {
    return this.repo.incrementView(id);
  }

  async addGift(id, count = 1) {
    return this.repo.addGift(id, count);
  }
}

module.exports = VideoService;
