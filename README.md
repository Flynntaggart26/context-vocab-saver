# 📖 Context Vocab Saver

> A Manifest V3 browser extension for **learning English words in context**:
> double-click any word online to save it **with its real sentence**, then quiz
> yourself later with spaced repetition.

[![Version](https://img.shields.io/badge/version-0.3.0-8b5cf6?style=flat-square)](https://github.com/Flynntaggart26/context-vocab-saver/releases)
[![Manifest](https://img.shields.io/badge/manifest-V3-2563eb?style=flat-square)](#)
[![Privacy](https://img.shields.io/badge/data-local--first-059669?style=flat-square)](PRIVACY.md)
[![License](https://img.shields.io/badge/license-MIT-ec4899?style=flat-square)](#-license)

Isolated flashcards don't stick. Words learned **inside real sentences** do —
this extension captures the exact sentence you met a word in and quizzes you
with the word blanked out.

## ✨ Features

| How you save | What you get |
|---|---|
| 🖱️ **Double-click** any word → floating *＋ Save* bubble | Word + full enclosing sentence + source site, stored locally |
| 🖱️ **Right-click → Save selection** (context menu) | Same capture path, works on selections of up to N words |
| 🧠 **Typed Turkish quiz** | Card shows the English word + English definition + highlighted sentence → **type** the Türkçe anlam. Correct = ✅ learned (30 days); wrong = answer shown + card requeued. Letter hints, 🔥 streak, mastery counter |
| 🇹🇷 **Turkish meanings** | ~300-word offline dictionary with stemming first, free API lookup for the rest (cached, toggleable). Forgiving matching: case/punctuation tolerant, any comma-variant accepted |
| 📖 **English definitions** | Free dictionary API (cached): definition + phonetic + part-of-speech on every card |
| 🔔 **Daily reminder** | Notifies you when reviews are due (configurable time, toggleable) |
| 📋 **Word manager** | Search, due-badges, per-word delete, JSON export/import backup |
| ⚙️ **Options** | Double-click on/off, reminder time, max words per save |

## 🚀 Install (developer mode)

1. Download or clone this repo
2. Open `chrome://extensions`, enable **Developer mode**
3. **Load unpacked** → select the `context-vocab-saver` folder
4. Double-click any English word on any page → save → open the toolbar popup → **Start review**

## 📁 Project structure

```
context-vocab-saver/
├── manifest.json        # MV3 manifest (action, content scripts, options, alarms)
├── icons/               # icon16/32/48/128.png (generated, gradient book glyph)
├── src/
│   ├── content.js       # dbl-click capture, sentence extraction, save bubble
│   ├── background.js    # context menu, daily alarm, notifications, welcome
│   ├── popup.html/js    # toolbar popup: stats, review entry, export/import
│   ├── review.html/js   # typed-TR quiz (learned/wrong, streak, hints) + word manager
│   ├── options.html/js  # synced settings
│   ├── dict-tr.js       # bundled offline EN→TR core glossary (~200 words)
│   ├── translate.js     # shared helper: local dict → MyMemory API → cache
│   └── ui.css           # shared theme (matches Grammar Mastery identity)
├── PRIVACY.md           # privacy policy (required for Web Store listing)
└── README.md
```

## 🔒 Privacy

All vocabulary data stays in `chrome.storage.local` on your device. No account,
no analytics, no tracking. The only network use: if Turkish meanings are
enabled, single words missing from the offline dictionary are looked up via
the free MyMemory API (toggleable). See [PRIVACY.md](PRIVACY.md) (also usable
as the hosted policy URL for the Chrome Web Store listing).

## 🗺️ Roadmap to 1.0

- [x] Turkish glosses (offline dict + cached API lookup)
- [ ] Text-to-speech pronunciation on cards (`chrome.tts`)
- [ ] Per-word notes field
- [ ] Streaks + weekly stats chart
- [ ] Firefox port (`browser` namespace compat)
- [ ] Chrome Web Store publish ($5 one-time developer fee)

## 🤝 Contributing

Issues and PRs welcome. Keep it dependency-free and offline-first.

## 📄 License

MIT — see [LICENSE](LICENSE).
