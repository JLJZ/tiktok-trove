const { validate } = require('../utils/validate');
const { RevenueEventCreate } = require('../schemas');
const { HttpError } = require('../middleware/errorHandler');
const { store } = require('./profitShares');

async function listRevenueEvents(req, res) {
  const filter = {
    psaId: req.query.psaId,
    contentId: req.query.contentId,
    stream: req.query.stream
  };
  const list = store.listRevenueEvents(filter);
  res.json(list);
}

async function recordRevenueEvent(req, res) {
  const data = validate(RevenueEventCreate, req.body);
  if (!data.psaId) {
    // if contentId given, try to resolve PSA by contentId
    if (data.contentId) {
      const psas = store.listPSA({ contentId: data.contentId });
      if (psas.length === 0) throw new HttpError(404, 'NOT_FOUND', 'No PSA for contentId');
      data.psaId = psas[0].id;
    } else {
      throw new HttpError(422, 'VALIDATION_ERROR', 'psaId or contentId is required');
    }
  }
  const exists = store.getPSA(data.psaId);
  if (!exists) throw new HttpError(404, 'NOT_FOUND', 'PSA not found');
  const evt = store.recordRevenueEvent(data);
  res.status(201).json(evt);
}

module.exports = { listRevenueEvents, recordRevenueEvent };
