const fs = require('fs');
const path = require('path');
const { newId } = require('../utils/ids');

function readJSON(file){
  try { return JSON.parse(fs.readFileSync(file,'utf8')); }
  catch(e){ return { psas:{}, participants:{}, events:{}, settlements:{}, payouts:{} }; }
}
function writeJSON(file, data){
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function shallowClone(obj){ return JSON.parse(JSON.stringify(obj)); }

class FileStore {
  constructor(filePath) {
    this.filePath = path.resolve(filePath || './data.json');
    if (!fs.existsSync(this.filePath)) writeJSON(this.filePath, {});
    // initialize structure if empty
    const data = readJSON(this.filePath);
    data.psas ||= {}; data.participants ||= {}; data.events ||= {}; data.settlements ||= {}; data.payouts ||= {};
    writeJSON(this.filePath, data);
  }
  _load(){ return readJSON(this.filePath); }
  _save(data){ writeJSON(this.filePath, data); }

  createPSA(data) {
    const store = this._load();
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
      rules: data.rules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.psas[id] = psa;
    const parts = (data.participants || []).map(p => ({ id: newId('prt'), ...p }));
    store.participants[id] = parts;
    this._save(store);
    return shallowClone({ ...psa, participants: parts });
  }

  getPSA(id) {
    const store = this._load();
    const psa = store.psas[id];
    if (!psa) return null;
    const participants = store.participants[id] || [];
    return shallowClone({ ...psa, participants });
  }

  listPSA(filter = {}) {
    const store = this._load();
    const arr = [];
    for (const id of Object.keys(store.psas)) {
      const psa = store.psas[id];
      if (filter.contentId && psa.contentId !== filter.contentId) continue;
      if (filter.status && psa.status !== filter.status) continue;
      const participants = store.participants[id] || [];
      arr.push(shallowClone({ ...psa, participants }));
    }
    return arr;
  }

  updatePSA(id, patch) {
    const store = this._load();
    const psa = store.psas[id];
    if (!psa) return null;
    const updated = { ...psa, ...patch, updatedAt: new Date().toISOString() };
    store.psas[id] = updated;
    this._save(store);
    const participants = store.participants[id] || [];
    return shallowClone({ ...updated, participants });
  }

  addParticipant(psaId, data) {
    const store = this._load();
    if (!store.psas[psaId]) return null;
    const list = store.participants[psaId] || [];
    const duplicate = list.find(p => p.handle === data.handle && p.role === data.role);
    if (duplicate) {
      const err = new Error('Duplicate participant');
      err.code = 'DUPLICATE';
      err.status = 422;
      throw err;
    }
    const participant = { id: newId('prt'), ...data };
    list.push(participant);
    store.participants[psaId] = list;
    this._save(store);
    return shallowClone(participant);
  }

  listParticipants(psaId) {
    const store = this._load();
    return shallowClone(store.participants[psaId] || []);
  }

  recordRevenueEvent(data) {
    const store = this._load();
    const id = newId('rev');
    const psaId = data.psaId;
    if (!store.psas[psaId]) return null;
    const evt = { id, ...data, recordedAt: new Date().toISOString() };
    store.events[psaId] ||= [];
    store.events[psaId].push(evt);
    this._save(store);
    return shallowClone(evt);
  }

  listRevenueEvents(filter = {}) {
    const store = this._load();
    const arr = [];
    if (filter.psaId) {
      const list = store.events[filter.psaId] || [];
      for (const e of list) arr.push(shallowClone(e));
    } else {
      for (const id of Object.keys(store.events)) {
        for (const e of store.events[id]) arr.push(shallowClone(e));
      }
    }
    return arr.filter(e => {
      if (filter.contentId && e.contentId !== filter.contentId) return false;
      if (filter.stream && e.stream !== filter.stream) return false;
      return true;
    });
  }

  createSettlement(data) {
    const store = this._load();
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
    store.settlements[id] = settlement;
    this._save(store);
    return shallowClone(settlement);
  }

  getSettlement(id) {
    const store = this._load();
    const s = store.settlements[id];
    return s ? shallowClone(s) : null;
  }

  listSettlements(filter = {}) {
    const store = this._load();
    const arr = Object.values(store.settlements);
    return arr.filter(s => {
      if (filter.psaId && s.psaId !== filter.psaId) return false;
      if (filter.status && s.status !== filter.status) return false;
      return true;
    }).map(shallowClone);
  }

  createPayoutBatch(settlementId, options = {}) {
    const store = this._load();
    const settlement = store.settlements[settlementId];
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
      store.payouts[payout.id] = payout;
      payouts.push(payout);
    }
    this._save(store);
    return { id: batchId, settlementId, status: 'PENDING', payouts };
  }

  getPayout(id) {
    const store = this._load();
    const p = store.payouts[id];
    return p ? shallowClone(p) : null;
  }
}

module.exports = { FileStore };
