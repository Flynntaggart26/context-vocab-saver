/* ============================================================
   Review page: SM-2-lite quiz + word list management.
   - Quiz shows the SENTENCE with the word blanked out.
   - Grading (0/3/4/5) schedules the next review.
   - All data stays in chrome.storage.local (offline).
   ============================================================ */
'use strict';

const $ = (s) => document.querySelector(s);
const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;

let words = [];   // full deck
let queue = [];   // due cards this session
let current = null;
let doneThisSession = 0;

/* ---------- SM-2-lite scheduling ---------- */
function schedule(card, grade) {
  card.reviews = (card.reviews || 0) + 1;
  if (grade === 0) {
    card.interval = 0;
    card.nextReview = Date.now() + 10 * MIN;
    card.ease = Math.max(1.3, (card.ease || 2.5) - 0.2);
    queue.push(card); // relearn within this session
  } else {
    if (card.reviews === 1) card.interval = 1;
    else if (card.reviews === 2) card.interval = 3;
    else card.interval = Math.round(card.interval * card.ease);
    if (grade === 3) card.ease = Math.max(1.3, card.ease - 0.15);
    if (grade === 5) card.ease = card.ease + 0.1;
    if (grade === 5) card.interval = Math.round(card.interval * 1.3);
    card.nextReview = Date.now() + card.interval * DAY;
  }
}

function blankWord(sentence, word) {
  const i = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (i === -1) return sentence; // word form differs — show full context
  return sentence.slice(0, i) + '_____' + sentence.slice(i + word.length);
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  ({ words = [] } = await chrome.storage.local.get('words'));
  $('#words-n').textContent = words.length;
  // Backfill Turkish glosses for words saved before v0.2.0 or via
  // the content script (offline dict first, API if enabled).
  try {
    const { trTranslate = true } = await chrome.storage.sync.get('trTranslate');
    let changed = false;
    for (const w of words) {
      if (!w.translation && typeof ensureTranslation === 'function') {
        await ensureTranslation(w, trTranslate);
        if (w.translation) changed = true;
      }
    }
    if (changed) await persist();
  } catch { /* offline — quiz works without glosses */ }
  queue = words.filter((w) => w.nextReview <= Date.now());
  shuffle(queue);
  wireTabs(); wireQuiz(); renderList();
  if (location.hash === '#words') selectTab('words');
  nextCard();
});

const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } };

async function persist() { await chrome.storage.local.set({ words }); }

/* ---------- tabs ---------- */
function wireTabs() {
  $('#tab-quiz').onclick = () => selectTab('quiz');
  $('#tab-words').onclick = () => selectTab('words');
}
function selectTab(which) {
  $('#tab-quiz').setAttribute('aria-selected', String(which === 'quiz'));
  $('#tab-words').setAttribute('aria-selected', String(which === 'words'));
  $('#view-quiz').hidden = which !== 'quiz';
  $('#view-words').hidden = which !== 'words';
}

/* ---------- quiz ---------- */
function wireQuiz() {
  $('#btn-hint').onclick = () => {
    $('#quiz-tr').hidden = false;
    $('#btn-hint').disabled = true;
  };
  $('#btn-reveal').onclick = () => {
    $('#btn-reveal').hidden = true;
    $('#answer-zone').hidden = false;
    $('#quiz-answer').textContent = current.word;
    $('#quiz-sentence').innerHTML = esc(current.sentence); // reveal full sentence
  };
  document.querySelectorAll('.grade').forEach((b) => {
    b.onclick = async () => {
      schedule(current, Number(b.dataset.g));
      doneThisSession++;
      await persist();
      nextCard();
    };
  });
}

function nextCard() {
  current = queue.shift() || null;
  const total = doneThisSession + queue.length + (current ? 1 : 0);
  $('#progress-fill').style.width = total ? `${(doneThisSession / total) * 100}%` : '0%';
  if (!current) {
    $('#quiz-card').hidden = true;
    $('#done-card').hidden = words.length === 0 ? true : false;
    $('#progress-label').textContent = words.length === 0
      ? 'Your deck is empty — double-click words while you read to save them.'
      : `Session complete: ${doneThisSession} review${doneThisSession === 1 ? '' : 's'}. 🎉`;
    if (words.length === 0) $('#done-card').hidden = true;
    return;
  }
  $('#done-card').hidden = true;
  $('#quiz-card').hidden = false;
  $('#btn-reveal').hidden = false;
  $('#answer-zone').hidden = true;
  // Turkish hint starts hidden on every card.
  $('#quiz-tr').hidden = true;
  $('#btn-hint').hidden = !current.translation;
  $('#btn-hint').disabled = false;
  $('#progress-label').textContent = `Card ${doneThisSession + 1} of ${total} · from ${current.source}`;
  $('#quiz-meta').textContent = `from ${current.source}`;
  $('#quiz-sentence').textContent = blankWord(current.sentence, current.word);
  if (current.translation) $('#quiz-tr').textContent = `🇹🇷 ${current.translation}`;
}

/* ---------- word list ---------- */
function renderList(filter = '') {
  const q = filter.toLowerCase();
  const items = words
    .filter((w) => !q || w.word.includes(q) || w.sentence.toLowerCase().includes(q))
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt);
  $('#words-n').textContent = words.length;
  $('#word-list').innerHTML = items.length ? items.map((w) => {
    const due = w.nextReview <= Date.now();
    return `<div class="word-row ${due ? 'due' : ''}">
      <div><strong>${esc(w.word)}</strong>${w.translation ? ` <span class="tr-inline">🇹🇷 ${esc(w.translation)}</span>` : ''} ${due ? '<span class="pill">due</span>' : ''}<br>
      <span class="muted small">${esc(w.sentence)}</span><br>
      <span class="muted small">${esc(w.source)} · reviewed ${w.reviews || 0}×</span></div>
      <button class="btn small danger" data-del="${w.id}" title="Delete">✕</button>
    </div>`;
  }).join('') : '<p class="muted">No words match.</p>';
  document.querySelectorAll('[data-del]').forEach((b) => {
    b.onclick = async () => {
      words = words.filter((w) => w.id !== b.dataset.del);
      queue = queue.filter((w) => w.id !== b.dataset.del);
      await persist();
      renderList($('#search').value);
    };
  });
  $('#search').oninput = (e) => renderList(e.target.value);
}
