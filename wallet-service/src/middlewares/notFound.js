const { NotFoundError } = require('../utils/errors');

module.exports = function notFound(req, res, next) {
  next(new NotFoundError('Route not found'));
};
