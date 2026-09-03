# Privacy Policy — Context Vocab Saver

**Last updated:** September 2026

Context Vocab Saver ("the extension") is built on a single principle:
**your learning data never leaves your device.**

## Data we collect

**None.** The extension:

- ❌ has no user accounts and no sign-in
- ❌ sends no data to any server (there is no server)
- ❌ includes no analytics, tracking, advertising, or third-party SDKs
- ❌ never reads browsing history — it only sees the word/sentence you explicitly save

## Data stored on your device

When you save a word, the extension stores locally (`chrome.storage`):

- the word, its sentence, the source site name, and review scheduling data

You can export it (JSON backup), import it, or delete words at any time from
the built-in word manager. Uninstalling the extension removes all of it.

## Turkish translations (optional, on by default)

If enabled in Settings, the extension looks up a Turkish gloss for each saved
word: first in its built-in offline dictionary, then — only for words the
dictionary doesn't cover — via the free MyMemory translation API
(`api.mymemory.translated.net`). Only the single saved word is sent, nothing
else; the returned gloss is cached on your device. Turn it off anytime in
Settings → "Turkish meanings".

## English definitions (on by default)

To make quiz cards instructive, the extension fetches a short English
definition (+ phonetic) per word from the free dictionaryapi.dev service and
caches it on your device. Again, only the single word is sent.

## Permissions — why each is needed

| Permission | Why |
|---|---|
| `storage` | Save your words and settings on-device |
| `contextMenus` | "Save selection" right-click item |
| `alarms` + `notifications` | Optional daily review reminder (toggleable in Settings) |
| Page content access (`http/https`) | Detect your double-clicked word and capture its sentence — only when you interact |
| Translation API (`api.mymemory.translated.net`) | Fetch Turkish glosses for words missing from the offline dictionary — only if enabled |
| Dictionary API (`api.dictionaryapi.dev`) | Fetch a short English definition per word for quiz cards (cached on-device) |

## Contact

Questions: open an issue at
https://github.com/Flynntaggart26/context-vocab-saver/issues
