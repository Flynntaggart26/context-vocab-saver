/* ============================================================
   Context Vocab Saver — translate.js (shared helper)
   Load via importScripts() in the service worker, or via a normal
   <script> tag in extension pages. No dependencies.
   ------------------------------------------------------------
   Strategy: bundled dict (instant, offline) → free MyMemory API
   (if enabled in Settings) → null. Results are cached on the entry.
   ============================================================ */
'use strict';

const TR_API_URL = 'https://api.mymemory.translated.net/get';

/** Offline lookup with light English stemming (learning→learn,
    studied→study, stories→story). Returns the gloss or null. */
function trLocal(word) {
  if (typeof TR_DICT === 'undefined') return null;
  const w = String(word).toLowerCase();
  if (TR_DICT[w]) return TR_DICT[w];
  const dedup = (s) => s.replace(/([^aeiou])\1$/, '$1'); // runn → run
  const cands = [];
  if (/ing$/.test(w) && w.length > 5) {
    const s = w.slice(0, -3);
    cands.push(s, s + 'e', dedup(s)); // learning→learn, making→make, running→run
  }
  if (/ied$/.test(w)) cands.push(w.slice(0, -3) + 'y'); // studied→study
  else if (/ed$/.test(w) && w.length > 4) {
    const s = w.slice(0, -2);
    cands.push(s, s + 'e', dedup(s)); // loved→love, stopped→stop
  }
  if (/ies$/.test(w)) cands.push(w.slice(0, -3) + 'y'); // stories→story
  else if (/(ses|xes|zes|ches|shes)$/.test(w)) cands.push(w.slice(0, -2)); // classes→class
  else if (/es$/.test(w) && w.length > 4) {
    const s = w.slice(0, -2);
    cands.push(s, w.slice(0, -1)); // makes→make, goes→go
  } else if (/s$/.test(w) && w.length > 3 && !/ss$/.test(w)) {
    cands.push(w.slice(0, -1)); // books→book
  }
  for (const c of cands) if (TR_DICT[c]) return TR_DICT[c];
  return null;
}

/** Online lookup of a single word. Throws on quota/network/empty. */
async function trFetch(word) {
  const url = `${TR_API_URL}?q=${encodeURIComponent(word)}&langpair=en|tr`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('translate http ' + res.status);
  const data = await res.json();
  const t = (data && data.responseData && data.responseData.translatedText || '').trim();
  if (!t || /^MYMEMORY WARNING/i.test(t)) throw new Error('translate quota');
  if (t.toLowerCase() === String(word).toLowerCase()) throw new Error('untranslated');
  return t;
}

/**
 * Ensure entry.translation is filled. Mutates + returns the entry.
 * Never throws — offline/API failure just leaves it untranslated.
 */
async function ensureTranslation(entry, useApi) {
  try {
    if (entry.translation) return entry;
    const local = trLocal(entry.word);
    if (local) {
      entry.translation = local;
      entry.trSource = 'local';
      return entry;
    }
    if (useApi) {
      entry.translation = await trFetch(entry.word);
      entry.trSource = 'api';
      return entry;
    }
  } catch {
    entry.trSource = entry.trSource || 'none';
  }
  return entry;
}
