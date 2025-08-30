const { validate } = require('../utils/validate');
const { Participant } = require('../schemas');
const { HttpError } = require('../middleware/errorHandler');
const { store } = require('./profitShares');

async function listParticipants(req, res) {
  const psa = store.getPSA(req.params.psaId);
  if (!psa) throw new HttpError(404, 'NOT_FOUND', 'PSA not found');
  const list = store.listParticipants(req.params.psaId);
  res.json(list);
}

async function addParticipant(req, res) {
  const data = validate(Participant, req.body);
  const psa = store.getPSA(req.params.psaId);
  if (!psa) throw new HttpError(404, 'NOT_FOUND', 'PSA not found');
  const p = store.addParticipant(req.params.psaId, data);
  res.status(201).json(p);
}

module.exports = { listParticipants, addParticipant };
