/* ============================================================
   Context Vocab Saver — content.js (Manifest V3)
   Runs on every http(s) page. No frameworks, no remote calls:
   everything is captured locally and stored via chrome.storage.
   ------------------------------------------------------------
   Flow: user double-clicks a word -> we grab the selection,
   expand to the full sentence around it, and show a floating
   "＋ Save" bubble. Clicking it stores {word, sentence, ...}.
   ============================================================ */
'use strict';

(() => {
  const BUBBLE_ID = 'cvs-save-bubble';
  const HIGHLIGHT_CLASS = 'cvs-flash';

  /* ---------- settings (synced with options page) ---------- */
  let settings = { doubleClick: true, maxWords: 4 };
  try {
    chrome.storage.sync.get({ doubleClick: true, maxWords: 4 }, (s) => { settings = s; });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync') for (const [k, v] of Object.entries(changes)) settings[k] = v.newValue;
    });
  } catch { /* storage unavailable (shouldn't happen) */ }

  /* ---------- sentence extraction ---------- */
  // Expand the selection to the enclosing sentence using . ! ? … " boundaries.
  function extractSentence(selection) {
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    if (!node || node.nodeType !== Node.TEXT_NODE) return null;

    const text = node.textContent;
    const offset = range.startOffset;
    const BOUND = /[.!?…]["'”’)\]]?\s|[\n\r]/g;

    let start = 0, m;
    BOUND.lastIndex = 0;
    while ((m = BOUND.exec(text)) !== null) {
      if (m.index < offset) start = m.index + m[0].length;
      else break;
    }
    BOUND.lastIndex = 0;
    let end = text.length;
    while ((m = BOUND.exec(text)) !== null) {
      if (m.index >= offset) { end = m.index + m[0].trimEnd().length; break; }
    }
    const sentence = text.slice(start, end).replace(/\s+/g, ' ').trim();
    return sentence.length > 3 ? sentence : null;
  }

  function cleanWord(raw) {
    // Keep letters, hyphens, apostrophes; drop surrounding punctuation.
    const w = (raw || '').trim().replace(/^[^A-Za-zÀ-ÿ'-]+|[^A-Za-zÀ-ÿ'-]+$/g, '');
    if (!w || /\s/.test(w) && w.split(/\s+/).length > settings.maxWords) return null;
    if (/^\d+$/.test(w)) return null;
    return w.toLowerCase();
  }

  /* ---------- floating save bubble ---------- */
  function removeBubble() {
    document.getElementById(BUBBLE_ID)?.remove();
  }

  function showBubble(x, y, word, sentence) {
    removeBubble();
    const b = document.createElement('button');
    b.id = BUBBLE_ID;
    b.type = 'button';
    b.textContent = `＋ Save “${word}”`;
    b.title = 'Save to Context Vocab Saver with this sentence';
    Object.assign(b.style, {
      position: 'fixed', left: `${Math.min(x, innerWidth - 190)}px`, top: `${y + 14}px`,
      zIndex: 2147483647, padding: '8px 14px', borderRadius: '999px', border: 'none',
      background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)', color: '#fff',
      font: '600 13px system-ui,sans-serif', cursor: 'pointer',
      boxShadow: '0 8px 24px rgba(99,102,241,.45)'
    });
    b.addEventListener('mousedown', (e) => e.stopPropagation());
    b.addEventListener('click', async (e) => {
      e.stopPropagation();
      await saveWord(word, sentence);
      b.textContent = '✓ Saved!';
      flashSaved();
      setTimeout(removeBubble, 900);
    });
    document.documentElement.appendChild(b);
    // Dismiss on scroll / click elsewhere / Escape.
    const away = (e) => { if (e.target !== b) { removeBubble(); cleanup(); } };
    const cleanup = () => {
      document.removeEventListener('mousedown', away, true);
      document.removeEventListener('keydown', onKey);
      removeEventListener('scroll', onScroll, true);
    };
    const onKey = (e) => { if (e.key === 'Escape') { removeBubble(); cleanup(); } };
    const onScroll = () => { removeBubble(); cleanup(); };
    setTimeout(() => {
      document.addEventListener('mousedown', away, true);
      document.addEventListener('keydown', onKey);
      addEventListener('scroll', onScroll, true);
    }, 0);
  }

  function flashSaved() {
    try {
      const sel = getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.className = HIGHLIGHT_CLASS;
      span.style.cssText = 'background:#dcfce7;border-radius:3px;transition:background 1s;';
      range.surroundContents(span);
      setTimeout(() => span.style.background = 'transparent', 60);
      setTimeout(() => span.replaceWith(...span.childNodes), 1100);
    } catch { /* selection across nodes — skip the flash, word is still saved */ }
  }

  /* ---------- storage ---------- */
  async function saveWord(word, sentence) {
    const now = Date.now();
    const entry = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      word, sentence,
      source: location.hostname, title: document.title.slice(0, 120),
      createdAt: now, reviews: 0, ease: 2.5, interval: 0,
      nextReview: now // reviewable immediately
    };
    const { words = [] } = await chrome.storage.local.get('words');
    // De-dupe: same word+sentence → just bump, don't duplicate.
    if (!words.some((w) => w.word === word && w.sentence === sentence)) {
      words.push(entry);
      await chrome.storage.local.set({ words });
    }
    return entry;
  }

  /* ---------- events ---------- */
  document.addEventListener('dblclick', (e) => {
    if (!settings.doubleClick) return;
    if (e.target?.closest?.(`#${BUBBLE_ID}`)) return;
    setTimeout(() => {
      const sel = getSelection();
      const raw = sel?.toString() ?? '';
      const word = cleanWord(raw);
      if (!word) return;
      const sentence = extractSentence(sel) || raw.trim();
      showBubble(e.clientX, e.clientY, word, sentence);
    }, 0);
  });

  // Context-menu path (background.js) asks us for the current selection.
  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg?.type === 'CVS_GET_SELECTION') {
      const sel = getSelection();
      const raw = sel?.toString() ?? '';
      reply({ word: cleanWord(raw), sentence: extractSentence(sel) || raw.trim() || null });
      return true;
    }
  });
})();
