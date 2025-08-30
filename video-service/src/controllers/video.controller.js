const { BadRequestError } = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');

class VideoController {
  constructor(service) {
    this.service = service;

    this.uploadVideo = this.uploadVideo.bind(this);
    this.getVideo = this.getVideo.bind(this);
    this.deleteVideo = this.deleteVideo.bind(this);
    this.getStats = this.getStats.bind(this);
  }

  async uploadVideo(req, res, next) {
    try {
      const uploader = req.header('x-user-id') || 'demo-user';
      const { title } = req.body || {};
      const file = req.file;

      const video = await this.service.uploadVideo({ title, uploader, file });
      res.status(201).json(video);
    } catch (e) {
      next(e);
    }
  }

  async getVideo(req, res, next) {
    try {
      const video = await this.service.getVideo(req.params.id);
      if (!video) return res.status(404).json({ error: 'Video not found' });
      res.json(video);
    } catch (e) { next(e); }
  }

  async deleteVideo(req, res, next) {
    try {
      const deleted = await this.service.deleteVideo(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Video not found' });
      res.status(204).send();
    } catch (e) { next(e); }
  }

  async getStats(req, res, next) {
    try {
      const stats = await this.service.getStats(req.params.id);
      if (!stats) return res.status(404).json({ error: 'Video not found' });
      res.json(stats);
    } catch (e) { next(e); }
  }
}

module.exports = VideoController;
