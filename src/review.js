/* ============================================================
   Review page v0.3.0: typed Turkish quiz + word manager.
   ------------------------------------------------------------
   Flow per card: English word + English definition + sentence →
   learner TYPES the Turkish meaning → correct = learned (30 days),
   wrong = correct answer shown + card requeued ("study again").
   All data stays in chrome.storage.local.
   Depends on: dict-tr.js + translate.js (normTr, trMatches,
   ensureTranslation, ensureDefinition) loaded before this file.
   ============================================================ */
'use strict';

const $ = (s) => document.querySelector(s);
const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;

let words = [];   // full deck
let queue = [];   // due cards this session
let current = null;
let doneThisSession = 0;
let hintLevel = 0;
let stats = { correct: 0, wrong: 0, streak: 0 };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- learning state transitions (pure-ish, testable) ---------- */
function markLearned(card, now = Date.now()) {
  card.learned = true;
  card.learnedAt = now;
  card.reviews = (card.reviews || 0) + 1;
  card.ease = Math.min(3.0, (card.ease || 2.5) + 0.1);
  card.interval = 30;
  card.nextReview = now + 30 * DAY;
  return card;
}

function markWrong(card, now = Date.now()) {
  card.learned = false;
  card.reviews = (card.reviews || 0) + 1;
  card.ease = Math.max(1.3, (card.ease || 2.5) - 0.2);
  card.interval = 0;
  card.nextReview = now + 10 * MIN; // study again soon
  return card;
}

/** Grade a typed answer. Returns { ok, accepted } (accepted = variants). */
function gradeTyped(card, typed) {
  const variants = trVariants(card.translation || '');
  return { ok: trMatches(card.translation || '', typed), accepted: variants };
}

/** Highlight the word inside its sentence. */
function highlightWord(sentence, word) {
  const i = String(sentence).toLowerCase().indexOf(String(word).toLowerCase());
  if (i === -1) return esc(sentence);
  return esc(sentence.slice(0, i)) + '<mark>' + esc(sentence.slice(i, i + String(word).length)) + '</mark>' + esc(sentence.slice(i + String(word).length));
}

/** Progressive letter hint: first k chars + dots. */
function letterHint(gloss, level) {
  const first = String(gloss || '').split(',')[0].trim();
  const k = Math.min(first.length - 1, level * 2);
  if (k <= 0) return '•'.repeat(Math.max(first.length, 3));
  return first.slice(0, k) + '•'.repeat(Math.max(first.length - k, 1));
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  ({ words = [] } = await chrome.storage.local.get('words'));
  queue = words.filter((w) => w.nextReview <= Date.now());
  shuffle(queue);
  wireTabs(); wireQuiz(); renderList(); updateCounters();
  if (location.hash === '#words') selectTab('words');
  nextCard(); // quiz is usable instantly — meanings backfill below
  backfillMeanings(); // non-blocking: never holds the quiz hostage
  // Live-update when words are saved elsewhere (e.g. review tab was
  // already open while saving from an article) — no refresh needed.
  try {
    chrome.storage.onChanged.addListener(async (changes, area) => {
      if (area !== 'local' || !changes.words) return;
      words = changes.words.newValue || [];
      const known = new Set(queue.map((w) => w.id));
      if (current) known.add(current.id);
      for (const w of words) {
        if (w.nextReview <= Date.now() && !known.has(w.id)) { queue.push(w); known.add(w.id); }
      }
      renderList($('#search') ? $('#search').value : '');
      updateCounters();
      if (!current) nextCard(); // resume a finished session with fresh cards
    });
  } catch { /* older Chrome — refresh still works */ }
});

/* Backfill Turkish glosses + English definitions in the background.
   Sequential to respect free-API limits; each fetch has an 8s timeout
   so slow networks can neither block nor break the quiz. */
async function backfillMeanings() {
  try {
    const { trTranslate = true } = await chrome.storage.sync.get('trTranslate');
    let changed = false;
    for (const w of words) {
      if (!w.translation && typeof ensureTranslation === 'function') {
        await ensureTranslation(w, trTranslate);
        if (w.translation) changed = true;
      }
      if (!w.definition && typeof ensureDefinition === 'function') {
        await ensureDefinition(w);
        if (w.definition) changed = true;
      }
    }
    if (changed) {
      await persist();
      renderList($('#search') ? $('#search').value : '');
      refreshCurrentCard();
    }
  } catch { /* quiz already works with word + sentence alone */ }
}

/* If meanings arrived while a card is on screen, refresh its extras. */
function refreshCurrentCard() {
  if (!current || !$('#feedback').hidden) return;
  if (current.translation) $('#btn-hint').hidden = false;
  if (current.definition && $('#quiz-def').hidden) {
    $('#quiz-def').hidden = false;
    $('#quiz-def').innerHTML = `${current.pos ? `<span class="pill">${esc(current.pos)}</span> ` : ''}“${esc(current.definition)}”${current.phonetic ? ` <span class="muted">/${esc(current.phonetic)}/</span>` : ''}`;
  }
}

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
  $('#btn-check').onclick = check;
  $('#quiz-input').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (!$('#feedback').hidden) nextCard(); // Enter on feedback = next
    else check();
  });
  $('#btn-hint').onclick = () => {
    hintLevel++;
    stats.streak = 0; // hints break the streak — recall honestly!
    updateCounters();
    $('#quiz-tr').hidden = false;
    $('#quiz-tr').textContent = `🇹🇷 ${letterHint(current.translation, hintLevel)}`;
  };
}

function updateCounters() {
  const learned = words.filter((w) => w.learned).length;
  $('#learned-n').textContent = learned;
  $('#total-n').textContent = words.length;
  $('#streak').textContent = stats.streak;
}

function nextCard() {
  current = queue.shift() || null;
  hintLevel = 0;
  const total = doneThisSession + queue.length + (current ? 1 : 0);
  $('#progress-fill').style.width = total ? `${(doneThisSession / total) * 100}%` : '0%';
  if (!current) {
    $('#quiz-card').hidden = true;
    const empty = words.length === 0;
    $('#done-card').hidden = empty ? true : false;
    $('#progress-label').textContent = empty
      ? 'Your deck is empty — double-click words while you read to save them.'
      : `Oturum bitti: ${stats.correct} doğru, ${stats.wrong} tekrar. 🎉`;
    updateCounters();
    return;
  }
  $('#done-card').hidden = true;
  $('#quiz-card').hidden = false;
  $('#feedback').hidden = true;
  $('#feedback').innerHTML = '';
  $('#quiz-input').value = '';
  $('#quiz-input').disabled = false;
  $('#btn-check').disabled = false;
  $('#quiz-tr').hidden = true;
  $('#quiz-word').textContent = current.word;
  // English definition as the recall prompt (with phonetic + POS).
  const hasDef = Boolean(current.definition);
  $('#quiz-def').hidden = !hasDef;
  if (hasDef) {
    $('#quiz-def').innerHTML = `${current.pos ? `<span class="pill">${esc(current.pos)}</span> ` : ''}“${esc(current.definition)}”${current.phonetic ? ` <span class="muted">/${esc(current.phonetic)}/</span>` : ''}`;
  }
  $('#quiz-sentence').innerHTML = highlightWord(current.sentence, current.word);
  $('#quiz-meta').textContent = `from ${current.source} · ${doneThisSession + 1}/${total}`;
  updateCounters();
  setTimeout(() => $('#quiz-input').focus(), 50);
}

async function check() {
  if (!current) return;
  const typed = $('#quiz-input').value;
  if (!normTr(typed)) { $('#quiz-input').focus(); return; }
  const { ok, accepted } = gradeTyped(current, typed);
  $('#quiz-input').disabled = true;
  $('#btn-check').disabled = true;
  if (ok) {
    const noHint = hintLevel === 0;
    markLearned(current);
    doneThisSession++;
    stats.correct++;
    if (noHint) stats.streak++;
    await persist();
    showFeedback(true, null);
  } else {
    markWrong(current);
    queue.push(current); // study again later this session
    doneThisSession++;
    stats.wrong++;
    stats.streak = 0;
    await persist();
    showFeedback(false, { typed, accepted });
  }
  updateCounters();
  renderList($('#search') ? $('#search').value : '');
}

function showFeedback(ok, info) {
  const box = $('#feedback');
  box.hidden = false;
  if (ok) {
    box.innerHTML = `<div class="fb ok">
      <strong>Doğru! 🎉</strong> <em>${esc(current.word)}</em> = <strong>${esc(current.translation || '')}</strong><br>
      <span class="muted small">Öğrenildi olarak işaretlendi — 30 gün sonra tekrar.</span><br>
      <button class="btn primary small" id="btn-next">Sonraki → (Enter)</button>
    </div>`;
  } else {
    box.innerHTML = `<div class="fb bad">
      <strong>Tekrar çalışalım 📚</strong><br>
      Yazdığın: <s>${esc(info.typed)}</s><br>
      Doğrusu: <em>${esc(current.word)}</em> = <strong>${esc(accepted[0] || current.translation || '')}</strong>
      ${accepted.length > 1 ? `<br><span class="muted small">Diğer kabul edilenler: ${esc(accepted.slice(1).join(' · '))}</span>` : ''}<br>
      <span class="muted small">Bu kart desteye geri eklendi — birazdan yine gelecek.</span><br>
      <button class="btn primary small" id="btn-next">Sonraki → (Enter)</button>
    </div>`;
  }
  $('#btn-next').onclick = nextCard;
}

/* ---------- word list ---------- */
function renderList(filter = '') {
  const q = normTr(filter);
  const items = words
    .filter((w) => !q || normTr(w.word).includes(q) || normTr(w.sentence).includes(q) || normTr(w.translation || '').includes(q))
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt);
  $('#words-n').textContent = words.length;
  $('#word-list').innerHTML = items.length ? items.map((w) => {
    const due = w.nextReview <= Date.now();
    return `<div class="word-row ${due && !w.learned ? 'due' : ''} ${w.learned ? 'learned' : ''}">
      <div><strong>${esc(w.word)}</strong>${w.translation ? ` <span class="tr-inline">🇹🇷 ${esc(w.translation)}</span>` : ''} ${w.learned ? '<span class="pill green">öğrenildi ✓</span>' : (due ? '<span class="pill">due</span>' : '')}<br>
      <span class="muted small">${w.definition ? `“${esc(w.definition)}”<br>` : ''}${esc(w.sentence)}</span><br>
      <span class="muted small">${esc(w.source)} · reviewed ${w.reviews || 0}×</span></div>
      <div class="row-btns">${w.learned ? `<button class="btn small" data-unlearn="${w.id}" title="Tekrar çalış">↺</button>` : ''}<button class="btn small danger" data-del="${w.id}" title="Delete">✕</button></div>
    </div>`;
  }).join('') : '<p class="muted">No words match.</p>';
  document.querySelectorAll('[data-del]').forEach((b) => {
    b.onclick = async () => {
      words = words.filter((w) => w.id !== b.dataset.del);
      queue = queue.filter((w) => w.id !== b.dataset.del);
      await persist();
      renderList($('#search').value);
      updateCounters();
    };
  });
  document.querySelectorAll('[data-unlearn]').forEach((b) => {
    b.onclick = async () => {
      const w = words.find((x) => x.id === b.dataset.unlearn);
      if (w) { w.learned = false; w.nextReview = Date.now(); await persist(); }
      renderList($('#search').value);
      updateCounters();
    };
  });
  $('#search').oninput = (e) => renderList(e.target.value);
}
