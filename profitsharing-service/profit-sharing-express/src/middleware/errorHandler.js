function notFound(req, res, next) {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found' });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR');
  const message = err.message || 'Unexpected error';
  res.status(status).json({ code, message });
}

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

module.exports = { notFound, errorHandler, HttpError };
