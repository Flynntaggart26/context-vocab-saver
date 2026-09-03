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

## Permissions — why each is needed

| Permission | Why |
|---|---|
| `storage` | Save your words and settings on-device |
| `contextMenus` | "Save selection" right-click item |
| `alarms` + `notifications` | Optional daily review reminder (toggleable in Settings) |
| Page content access (`http/https`) | Detect your double-clicked word and capture its sentence — only when you interact |

## Contact

Questions: open an issue at
https://github.com/Flynntaggart26/context-vocab-saver/issues
