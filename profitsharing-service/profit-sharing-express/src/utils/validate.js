const { ZodError } = require('zod');
const { HttpError } = require('../middleware/errorHandler');

function validate(schema, payload) {
  try {
    return schema.parse(payload);
  } catch (e) {
    if (e instanceof ZodError) {
      const message = e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new HttpError(422, 'VALIDATION_ERROR', message);
    }
    throw e;
  }
}

module.exports = { validate };
