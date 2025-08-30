const fs = require('fs');
const { newId } = require('../utils/ids');

function shallowClone(obj){ return JSON.parse(JSON.stringify(obj)); }

class InMemoryStore {
  constructor() {
    this.psas = new Map();
    this.participants = new Map(); // key: psaId -> array
    this.events = new Map(); // key: psaId -> array
    this.settlements = new Map();
    this.payouts = new Map();
  }

  createPSA(data) {
    const id = newId('psa');
    const psa = {
      id,
      status: 'ACTIVE',
      version: 1,
      contentId: data.contentId,
      title: data.title || null,
      cycle: data.cycle,
      currency: data.currency,
      minPayoutCents: data.minPayoutCents || 0,
      reservePercent: data.reservePercent || 0,
      participants: [],
      rules: data.rules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.psas.set(id, psa);
    // participants
    const parts = (data.participants || []).map(p => ({
      id: newId('prt'),
      ...p
    }));
    this.participants.set(id, parts);
    return shallowClone({ ...psa, participants: parts });
  }

  getPSA(id) {
    const psa = this.psas.get(id);
    if (!psa) return null;
    const participants = this.participants.get(id) || [];
    return shallowClone({ ...psa, participants });
  }

  listPSA(filter = {}) {
    const arr = [];
    for (const [id, psa] of this.psas.entries()) {
      if (filter.contentId && psa.contentId !== filter.contentId) continue;
      if (filter.status && psa.status !== filter.status) continue;
      const participants = this.participants.get(id) || [];
      arr.push(shallowClone({ ...psa, participants }));
    }
    return arr;
  }

  updatePSA(id, patch) {
    const psa = this.psas.get(id);
    if (!psa) return null;
    const updated = { ...psa, ...patch, updatedAt: new Date().toISOString() };
    this.psas.set(id, updated);
    const participants = this.participants.get(id) || [];
    return shallowClone({ ...updated, participants });
  }

  addParticipant(psaId, data) {
    if (!this.psas.get(psaId)) return null;
    const list = this.participants.get(psaId) || [];
    const duplicate = list.find(p => p.handle === data.handle && p.role === data.role);
    if (duplicate) {
      const err = new Error('Duplicate participant');
      err.code = 'DUPLICATE';
      err.status = 422;
      throw err;
    }
    const participant = { id: newId('prt'), ...data };
    list.push(participant);
    this.participants.set(psaId, list);
    return shallowClone(participant);
  }

  listParticipants(psaId) {
    return shallowClone(this.participants.get(psaId) || []);
  }

  recordRevenueEvent(data) {
    const id = newId('rev');
    const psaId = data.psaId;
    if (!this.psas.get(psaId)) return null;
    const evt = { id, ...data, recordedAt: new Date().toISOString() };
    const list = this.events.get(psaId) || [];
    list.push(evt);
    this.events.set(psaId, list);
    return shallowClone(evt);
  }

  listRevenueEvents(filter = {}) {
    const arr = [];
    if (filter.psaId) {
      const list = this.events.get(filter.psaId) || [];
      for (const e of list) arr.push(shallowClone(e));
    } else {
      for (const [, list] of this.events.entries()) {
        for (const e of list) arr.push(shallowClone(e));
      }
    }
    // naive filtering
    return arr.filter(e => {
      if (filter.contentId && e.contentId !== filter.contentId) return false;
      if (filter.stream && e.stream !== filter.stream) return false;
      return true;
    });
  }

  createSettlement(data) {
    const id = newId('stl');
    const settlement = {
      id,
      psaId: data.psaId,
      status: 'COMPLETED',
      period: data.period,
      totals: data.totals,
      allocations: data.allocations,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };
    this.settlements.set(id, settlement);
    return shallowClone(settlement);
  }

  getSettlement(id) {
    const s = this.settlements.get(id);
    return s ? shallowClone(s) : null;
  }

  listSettlements(filter = {}) {
    const arr = [];
    for (const [, s] of this.settlements.entries()) {
      if (filter.psaId && s.psaId !== filter.psaId) continue;
      if (filter.status && s.status !== filter.status) continue;
      arr.push(shallowClone(s));
    }
    return arr;
  }

  createPayoutBatch(settlementId, options = {}) {
    const settlement = this.settlements.get(settlementId);
    if (!settlement) return null;
    const batchId = newId('pob');
    const payouts = [];
    for (const alloc of settlement.allocations) {
      if (options.minNetAmountCents && alloc.netCents < options.minNetAmountCents) continue;
      const payout = {
        id: newId('pay'),
        settlementId,
        participantId: alloc.participantId,
        amountCents: alloc.netCents,
        currency: alloc.currency,
        status: 'PENDING',
        walletId: alloc.walletId,
        externalTxId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.payouts.set(payout.id, payout);
      payouts.push(payout);
    }
    return { id: batchId, settlementId, status: 'PENDING', payouts };
  }

  getPayout(id) {
    const p = this.payouts.get(id);
    return p ? shallowClone(p) : null;
  }
}

module.exports = { InMemoryStore };
