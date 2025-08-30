const { StatusCodes } = require('http-status-codes');

class AppError extends Error {
  constructor(status = StatusCodes.INTERNAL_SERVER_ERROR, code = 'internal_error', message = 'Internal error', details = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
class NotFoundError extends AppError {
  constructor(message = 'Not found', details = []) { super(StatusCodes.NOT_FOUND, 'not_found', message, details); }
}
class BadRequestError extends AppError {
  constructor(message = 'Bad request', details = []) { super(StatusCodes.BAD_REQUEST, 'bad_request', message, details); }
}
class NotImplementedError extends AppError {
  constructor(message = 'Not implemented', details = []) { super(StatusCodes.NOT_IMPLEMENTED, 'not_implemented', message, details); }
}

module.exports = { AppError, NotFoundError, BadRequestError, NotImplementedError };
