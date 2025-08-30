const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

module.exports = function videoRoutes(controller) {
  const r = Router();
  // Upload video
  r.post('/videos', upload.single('file'), controller.uploadVideo);

  // Video metadata
  r.get('/videos/:id', controller.getVideo);

  // Delete video
  r.delete('/videos/:id', controller.deleteVideo);

  // Stats
  r.get('/videos/:id/stats', controller.getStats);

  return r;
};
