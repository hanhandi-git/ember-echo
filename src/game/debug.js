// Tiny transition logger for map/stage lifecycle bugs (camp backdrop missing,
// black gaps on stage select). Events are infrequent, so logging is always on:
// filtered via console.debug "[ember:*]" and kept in a ring on window.__EMBER_LOG__.
const RING = [];
const MAX = 400;

export function dlog(tag, msg, data) {
  const entry = { t: Math.round((globalThis.performance?.now?.() ?? Date.now())), tag, msg, data };
  RING.push(entry);
  if (RING.length > MAX) RING.shift();
  if (data !== undefined) console.debug(`[ember:${tag}] ${msg}`, data);
  else console.debug(`[ember:${tag}] ${msg}`);
}

export function debugRing() {
  return RING.slice();
}

if (typeof window !== "undefined") window.__EMBER_LOG__ = RING;
