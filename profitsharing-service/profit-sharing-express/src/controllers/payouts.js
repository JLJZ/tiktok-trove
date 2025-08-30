const { HttpError } = require('../middleware/errorHandler');
const { store } = require('./profitShares');

async function getPayout(req, res) {
  const p = store.getPayout(req.params.payoutId);
  if (!p) throw new HttpError(404, 'NOT_FOUND', 'Payout not found');
  res.json(p);
}

module.exports = { getPayout };
