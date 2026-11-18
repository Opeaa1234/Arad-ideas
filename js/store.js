// Per-user saved state.
//   On this device (localStorage): trail progress, best scores cache, own photos.
//   In Supabase (database/leaderboard.sql): one authoritative place_results row
//   per account/place, used for both leaderboard scoring and cross-device sync.

import { STORAGE_PREFIX } from './config.js';
import { backend } from './backend.js';

export function createUserStore(userId) {
  const base = STORAGE_PREFIX + 'user:' + userId + ':';
  const get = k => { try { return localStorage.getItem(base + k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(base + k, v); return true; } catch { return false; } };
  const del = k => { try { localStorage.removeItem(base + k); } catch { /* ignore */ } };

  return {
    loadProgress() {
      try {
        const j = JSON.parse(get('progress'));
        if (j && Array.isArray(j.discovered) && Array.isArray(j.completed)) return j;
      } catch { /* fall through */ }
      return { discovered: [], completed: [] };
    },
    saveProgress(p) { set('progress', JSON.stringify(p)); },

    getBest(placeId) { const v = get('best:' + placeId); const n = parseInt(v, 10); return isNaN(n) ? undefined : n; },
    setBest(placeId, score) { set('best:' + placeId, String(score)); },
    clearBests(ids) { ids.forEach(id => del('best:' + id)); },

    // The route this account last picked on this device (null = ask).
    getRoute() { return get('route'); },
    setRoute(routeId) { set('route', routeId); },

    // Whether the map walkthrough was already shown to this account on this device.
    tourSeen() { return get('tour') === '1'; },
    setTourSeen() { set('tour', '1'); },

    // True once this device has saved any progress for this account.
    hasLocalProgress() { return get('progress') !== null; },

    // A deliberate local reset takes precedence over older remote completions
    // on this device. The online leaderboard remains untouched.
    isProgressReset() { return get('progress-reset') === '1'; },
    markProgressReset() { set('progress-reset', '1'); },

    // { placeId: bestScore } from the account, or null if it can't be reached.
    async loadRemoteScores() {
      try {
        const rows = await (await backend()).getMyScores();
        const best = {};
        (rows || []).forEach(r => {
          const id = r.place_id != null ? String(r.place_id) : null, sc = Number(r.best_score);
          if (id && !isNaN(sc)) best[id] = Math.max(best[id] ?? -1, sc);
        });
        return best;
      } catch (e) { console.warn('[scores] load failed', e); return null; }
    },

    // Persist every finished quiz locally before network delivery. The server
    // must acknowledge the unique submission ID before it is removed.
    getPendingResults() {
      try {
        const rows = JSON.parse(get('score-outbox') || '[]');
        return Array.isArray(rows) ? rows.filter(r => r && typeof r.id === 'string'
          && typeof r.placeId === 'string' && Number.isInteger(r.score)
          && Number.isInteger(r.maxScore)) : [];
      } catch { return []; }
    },
    enqueueResult(placeId, score, maxScore) {
      const rows = this.getPendingResults();
      const id = globalThis.crypto?.randomUUID?.()
        || (globalThis.crypto?.getRandomValues
          ? [...globalThis.crypto.getRandomValues(new Uint8Array(16))].map(n => n.toString(16).padStart(2, '0')).join('')
          : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
      const next = [...rows, { id, placeId: String(placeId), score, maxScore, createdAt: new Date().toISOString() }];
      return set('score-outbox', JSON.stringify(next)) ? id : null;
    },
    async flushPendingResults() {
      const rows = this.getPendingResults();
      if (!rows.length) return { sent: 0, pending: 0, results: {} };
      let sent = 0;
      const results = {};
      for (const item of rows) {
        try {
          const result = await (await backend()).recordPlaceResult(
            item.placeId, item.score, item.maxScore, item.id,
          );
          results[item.id] = result;
          const current = this.getPendingResults();
          if (!set('score-outbox', JSON.stringify(current.filter(r => r.id !== item.id)))) break;
          sent++;
        } catch (e) {
          console.warn('[scores] queued result remains pending', e);
          break;
        }
      }
      return { sent, pending: this.getPendingResults().length, results };
    },
    async recordResult(placeId, score, maxScore) {
      const id = this.enqueueResult(placeId, score, maxScore);
      if (!id) return null;
      const outcome = await this.flushPendingResults();
      return outcome.results[id] || null;
    },

    getPhoto(placeId) { const v = get('photo:' + placeId); return v && v.startsWith('data:image/') ? v : null; },
    setPhoto(placeId, dataUrl) { return set('photo:' + placeId, dataUrl); },
    removePhoto(placeId) { del('photo:' + placeId); },
  };
}
