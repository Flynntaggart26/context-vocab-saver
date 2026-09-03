/* Options page: syncs a few lightweight settings. Vocabulary data
   itself lives in chrome.storage.local (per-device, unlimited-ish). */
'use strict';

const $ = (s) => document.querySelector(s);
const DEFAULTS = { doubleClick: true, reminders: true, reminderHour: 19, maxWords: 4, trTranslate: true };

document.addEventListener('DOMContentLoaded', async () => {
  const s = { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };
  $('#opt-double').checked = s.doubleClick;
  $('#opt-remind').checked = s.reminders;
  $('#opt-hour').value = `${String(s.reminderHour).padStart(2, '0')}:00`;
  $('#opt-max').value = s.maxWords;
  $('#opt-tr').checked = s.trTranslate;

  const save = async () => {
    await chrome.storage.sync.set({
      doubleClick: $('#opt-double').checked,
      reminders: $('#opt-remind').checked,
      reminderHour: Number($('#opt-hour').value.split(':')[0]),
      trTranslate: $('#opt-tr').checked,
      maxWords: Math.min(8, Math.max(1, Number($('#opt-max').value) || 4))
    });
    $('#saved-msg').textContent = 'Saved ✓';
    setTimeout(() => { $('#saved-msg').textContent = ''; }, 1200);
  };
  document.querySelectorAll('input').forEach((i) => i.addEventListener('change', save));
});
