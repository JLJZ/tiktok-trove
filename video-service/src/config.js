require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,           // Video service port
  dataBackend: process.env.DATA_BACKEND || 'memory', // memory | postgres

  // Video-specific configs
  uploadDir: process.env.UPLOAD_DIR || 'uploads',    // folder for uploaded videos
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB default
  allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'video/mp4,video/quicktime').split(','),
};
