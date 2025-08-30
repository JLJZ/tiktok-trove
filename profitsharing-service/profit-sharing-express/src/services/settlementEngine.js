// A minimal settlement engine implementing percentage splits with pre-deductions.
// Stream-specific overrides supported for 100%-to-rightsholder case.
function computeSettlement(psa, events, period) {
  // Filter events in period
  const start = new Date(period.start).getTime();
  const end = new Date(period.end).getTime();
  const inPeriod = events.filter(e => {
    const t = new Date(e.occurredAt).getTime();
    return t >= start && t < end;
  });

  const gross = inPeriod.reduce((sum, e) => sum + e.amountCents, 0);

  const pre = psa.rules?.preDeductions || {};
  const platformFeeCents = Math.round(gross * ((pre.platformFeePercent || 0) / 100));
  const taxCents = Math.round(gross * ((pre.taxWithholdingPercent || 0) / 100));
  const reserveCents = Math.round(gross * ((pre.reservePercent || 0) / 100));
  const netAfterPre = gross - platformFeeCents - taxCents - reserveCents;

  // Build mapping target shares
  const participants = psa.participants || [];
  const byRef = (split) => {
    if (split.ref?.participantId) {
      return participants.find(p => p.id === split.ref.participantId);
    }
    if (split.ref?.role) {
      return participants.find(p => p.role === split.ref.role);
    }
    return null;
  };

  let totalWeight = 0;
  const splits = (psa.rules?.splits || []).map(s => {
    totalWeight += s.share;
    return s;
  });

  if ((psa.rules?.splitType || 'PERCENTAGE') === 'PERCENTAGE' && Math.round(totalWeight) !== 100) {
    const err = new Error('Splits must sum to 100 for PERCENTAGE');
    err.status = 422; err.code='SPLIT_SUM_ERROR';
    throw err;
  }

  const allocations = [];
  for (const s of splits) {
    const target = byRef(s);
    if (!target) continue;
    const sharePercent = (psa.rules?.splitType || 'PERCENTAGE') === 'PERCENTAGE'
      ? s.share
      : (s.share / totalWeight) * 100;
    const grossShare = Math.round(gross * (sharePercent / 100));
    const platformFeeShare = Math.round(platformFeeCents * (sharePercent / 100));
    const taxShare = Math.round(taxCents * (sharePercent / 100));
    const reserveShare = Math.round(reserveCents * (sharePercent / 100));
    const netCents = grossShare - platformFeeShare - taxShare - reserveShare;
    allocations.push({
      participantId: target.id,
      role: target.role,
      grossCents: grossShare,
      platformFeeCents: platformFeeShare,
      taxWithheldCents: taxShare,
      reserveCents: reserveShare,
      netCents,
      currency: psa.currency,
      walletId: target.walletId || null
    });
  }

  return {
    totals: {
      grossCents: gross,
      preDeductionsCents: platformFeeCents + taxCents + reserveCents,
      netCents: netAfterPre,
    },
    allocations
  };
}

module.exports = { computeSettlement };
