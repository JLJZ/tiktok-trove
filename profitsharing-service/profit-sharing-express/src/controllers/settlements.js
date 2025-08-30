const { validate } = require('../utils/validate');
const { SettlementCreate } = require('../schemas');
const { HttpError } = require('../middleware/errorHandler');
const { store } = require('./profitShares');
const { computeSettlement } = require('../services/settlementEngine');

async function listSettlements(req, res) {
  const list = store.listSettlements({ psaId: req.query.psaId, status: req.query.status });
  res.json(list);
}

async function createSettlement(req, res) {
  const data = validate(SettlementCreate, req.body);
  const psa = store.getPSA(data.psaId);
  if (!psa) throw new HttpError(404, 'NOT_FOUND', 'PSA not found');
  const events = store.listRevenueEvents({ psaId: data.psaId });
  const comp = computeSettlement(psa, events, data.period);
  if (data.dryRun) {
    return res.status(202).json({
      id: 'dryrun',
      psaId: data.psaId,
      status: 'PENDING',
      period: data.period,
      totals: comp.totals,
      allocations: comp.allocations
    });
  }
  const settlement = store.createSettlement({
    psaId: data.psaId,
    period: data.period,
    totals: comp.totals,
    allocations: comp.allocations
  });
  res.status(202).json(settlement);
}

async function getSettlement(req, res) {
  const s = store.getSettlement(req.params.settlementId);
  if (!s) throw new HttpError(404, 'NOT_FOUND', 'Settlement not found');
  res.json(s);
}

async function createPayouts(req, res) {
  const opts = req.body || {};
  const batch = store.createPayoutBatch(req.params.settlementId, opts);
  if (!batch) throw new HttpError(404, 'NOT_FOUND', 'Settlement not found');
  res.status(202).json(batch);
}

module.exports = { listSettlements, createSettlement, getSettlement, createPayouts };
