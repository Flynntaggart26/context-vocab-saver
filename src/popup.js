/* Popup: deck stats, review entry, word list, export/import. */
'use strict';

const $ = (s) => document.querySelector(s);

document.addEventListener('DOMContentLoaded', async () => {
  await refresh();
  $('#btn-review').onclick = () => chrome.tabs.create({ url: chrome.runtime.getURL('src/review.html') });
  $('#btn-words').onclick = () => chrome.tabs.create({ url: chrome.runtime.getURL('src/review.html#words') });
  $('#btn-options').onclick = () => chrome.runtime.openOptionsPage();
  $('#btn-export').onclick = exportJson;
  $('#btn-import').onclick = () => $('#file-import').click();
  $('#file-import').onchange = importJson;
});

async function refresh() {
  const { words = [] } = await chrome.storage.local.get('words');
  const due = words.filter((w) => w.nextReview <= Date.now()).length;
  $('#stats').textContent = `${words.length} saved · ${due} due`;
  $('#due-count').textContent = due;
  $('#btn-review').disabled = due === 0 && words.length > 0 ? false : words.length === 0;
  if (words.length === 0) $('#btn-review').textContent = 'No words yet — go save some!';
}

async function exportJson() {
  const { words = [] } = await chrome.storage.local.get('words');
  const blob = new Blob([JSON.stringify(words, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vocab-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function importJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data)) throw new Error('bad file');
    const clean = data.filter((w) => w && typeof w.word === 'string' && typeof w.sentence === 'string');
    const { words = [] } = await chrome.storage.local.get('words');
    const known = new Set(words.map((w) => w.id));
    const merged = [...words, ...clean.filter((w) => !known.has(w.id))];
    await chrome.storage.local.set({ words: merged });
    await refresh();
  } catch {
    $('#stats').textContent = 'Import failed — not a valid backup file.';
  }
  e.target.value = '';
}
