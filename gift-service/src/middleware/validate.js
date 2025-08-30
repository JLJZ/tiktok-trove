export const validateBody = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    const e = new Error('Invalid request body');
    e.status = 400;
    e.details = parsed.error.format();
    return next(e);
  }
  req.body = parsed.data;
  next();
};
