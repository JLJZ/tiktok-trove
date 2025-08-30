const { validate } = require('../utils/validate');
const { PSACreate, PSAUpdate } = require('../schemas');
const { HttpError } = require('../middleware/errorHandler');
const { idempotencyMiddleware } = require('../middleware/idempotency');
const { createStore } = require('../store');
const store = createStore();

async function listPSA(req, res) {
  const list = store.listPSA({ contentId: req.query.contentId, status: req.query.status });
  res.json(list.map(p => ({
    id: p.id,
    contentId: p.contentId,
    title: p.title,
    status: p.status,
    cycle: p.cycle,
    currency: p.currency,
    updatedAt: p.updatedAt
  })));
}

async function createPSA(req, res) {
  // Basic Idempotency handled by middleware (optional)
  const data = validate(PSACreate, req.body);
  if (data.rules.splitType === 'PERCENTAGE') {
    const sum = data.rules.splits.reduce((a,s)=>a+s.share,0);
    if (Math.round(sum) !== 100) {
      throw new HttpError(422, 'SPLIT_SUM_ERROR', 'Splits must sum to 100 for PERCENTAGE');
    }
  }
  const psa = store.createPSA(data);
  res.status(201).json(psa);
}

async function getPSA(req, res) {
  const psa = store.getPSA(req.params.psaId);
  if (!psa) throw new HttpError(404, 'NOT_FOUND', 'PSA not found');
  res.json(psa);
}

async function updatePSA(req, res) {
  const patch = validate(PSAUpdate, req.body);
  const psa = store.updatePSA(req.params.psaId, patch);
  if (!psa) throw new HttpError(404, 'NOT_FOUND', 'PSA not found');
  res.json(psa);
}

module.exports = { listPSA, createPSA, getPSA, updatePSA, store };
