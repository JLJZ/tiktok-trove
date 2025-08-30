const { AppError } = require('../utils/errors');

module.exports = function errorHandler(err, req, res, next) {
  if (err.status && err.errors) {
    const details = err.errors.map(e => e.message);
    return res.status(err.status).json({ code: 'validation_failed', message: 'Request validation failed', details });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ code: err.code, message: err.message, details: err.details });
  }
  console.error(err);
  return res.status(500).json({ code: 'internal_error', message: 'Internal error' });
};
