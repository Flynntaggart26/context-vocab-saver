/* ============================================================
   Context Vocab Saver — background.js (MV3 service worker)
   - Creates the "Save selection" context-menu item
   - Daily alarm: reminds you when reviews are due
   - First-install welcome (opens the review page)
   Note: service workers are event-based — no persistent state here.
   ============================================================ */
'use strict';

// Shared translation helper (offline dict + optional API lookup).
try { importScripts('dict-tr.js', 'translate.js'); } catch { /* pages load these via <script> instead */ }

const MENU_ID = 'cvs-save-selection';
const ALARM_DAILY = 'cvs-daily-reminder';

/* ---------- install / startup ---------- */
chrome.runtime.onInstalled.addListener(async (details) => {
  await setupMenu();
  await setupAlarm();
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/review.html') });
  }
});
chrome.runtime.onStartup.addListener(async () => { await setupMenu(); await setupAlarm(); });

async function setupMenu() {
  try { await chrome.contextMenus.removeAll(); } catch { /* first run */ }
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Save “%s” with sentence (Vocab Saver)',
    contexts: ['selection']
  });
}

async function setupAlarm() {
  const { reminderHour = 19 } = await chrome.storage.sync.get('reminderHour');
  chrome.alarms.clear(ALARM_DAILY, () => {
    const next = new Date();
    next.setHours(reminderHour, 0, 0, 0);
    if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
    chrome.alarms.create(ALARM_DAILY, { when: next.getTime(), periodInMinutes: 24 * 60 });
  });
}

/* ---------- context menu → ask the tab for word+sentence ---------- */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'CVS_GET_SELECTION' });
    if (res?.word && res?.sentence) await saveWord(res.word, res.sentence, tab);
    else notify('Nothing to save', 'Select a word on the page first.');
  } catch {
    notify('Cannot read this page', 'Vocab Saver cannot access system or store pages.');
  }
});

async function saveWord(word, sentence, tab) {
  const now = Date.now();
  const { words = [] } = await chrome.storage.local.get('words');
  if (words.some((w) => w.word === word && w.sentence === sentence)) {
    notify('Already saved', `“${word}” with this sentence is in your deck.`);
    return;
  }
  const entry = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    word, sentence,
    source: tab?.url ? new URL(tab.url).hostname : 'menu',
    title: (tab?.title || '').slice(0, 120),
    createdAt: now, reviews: 0, ease: 2.5, interval: 0, nextReview: now
  };
  // Pre-fill Turkish gloss (offline dict first, API if enabled in Settings).
  try {
    const { trTranslate = true } = await chrome.storage.sync.get('trTranslate');
    if (typeof ensureTranslation === 'function') await ensureTranslation(entry, trTranslate);
  } catch { /* offline — gloss backfills on the review page */ }
  // Pre-fill English definition for the quiz prompt (cached, free API).
  try {
    if (typeof ensureDefinition === 'function') await ensureDefinition(entry);
  } catch { /* offline — card works without it */ }
  words.push(entry);
  await chrome.storage.local.set({ words });
  notify('Saved ✓', `“${word}”${entry.translation ? ' = ' + entry.translation : ''} — review it from the toolbar popup.`);
}

/* ---------- daily reminder ---------- */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_DAILY) return;
  const { words = [] } = await chrome.storage.local.get('words');
  const { reminders = true } = await chrome.storage.sync.get('reminders');
  if (!reminders) return;
  const due = words.filter((w) => w.nextReview <= Date.now()).length;
  if (due > 0) notify('Review time 📚', `${due} word${due === 1 ? '' : 's'} due — open Vocab Saver to quiz.`);
});

chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/review.html') });
});

function notify(title, message) {
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title, message
    });
  } catch { /* notifications blocked — non-fatal */ }
}
