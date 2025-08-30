/**
 * DataStore interface (both memory and file-backed implement this):
 * - createPSA(data) -> psa
 * - getPSA(id) -> psa|null
 * - listPSA(filter) -> array
 * - updatePSA(id, patch) -> psa
 * - addParticipant(psaId, data) -> participant
 * - listParticipants(psaId) -> array
 * - recordRevenueEvent(data) -> event
 * - listRevenueEvents(filter) -> array
 * - createSettlement(data) -> settlement
 * - getSettlement(id) -> settlement|null
 * - listSettlements(filter) -> array
 * - createPayoutBatch(settlementId, options) -> batch
 * - getPayout(id) -> payout|null
 */
