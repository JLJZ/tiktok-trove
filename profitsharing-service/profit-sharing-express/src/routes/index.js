const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { idempotencyMiddleware } = require('../middleware/idempotency');

const Profit = require('../controllers/profitShares');
const Parts = require('../controllers/participants');
const Revenue = require('../controllers/revenueEvents');
const Settlements = require('../controllers/settlements');
const Payouts = require('../controllers/payouts');
const Health = require('../controllers/health');

router.get('/healthz', asyncHandler(Health.health));

// PSAs
router.get('/profit-shares', asyncHandler(Profit.listPSA));
router.post('/profit-shares', idempotencyMiddleware, asyncHandler(Profit.createPSA));
router.get('/profit-shares/:psaId', asyncHandler(Profit.getPSA));
router.patch('/profit-shares/:psaId', idempotencyMiddleware, asyncHandler(Profit.updatePSA));

// Participants
router.get('/revenue-events', asyncHandler(Revenue.listRevenueEvents));
router.post('/revenue-events', idempotencyMiddleware, asyncHandler(Revenue.recordRevenueEvent));

// Revenue
router.get('/revenue-events', Revenue.listRevenueEvents);
router.post('/revenue-events', idempotencyMiddleware, Revenue.recordRevenueEvent);

// Settlements
router.get('/settlements', asyncHandler(Settlements.listSettlements));
router.post('/settlements', asyncHandler(Settlements.createSettlement));
router.get('/settlements/:settlementId', asyncHandler(Settlements.getSettlement));
router.post('/settlements/:settlementId/payouts', asyncHandler(Settlements.createPayouts));

// Payouts
router.get('/payouts/:payoutId', asyncHandler(Payouts.getPayout));

module.exports = router;
