/* ============================================================
   Context Vocab Saver — dict-tr.js
   Bundled offline EN → TR core glossary (~200 high-frequency words).
   Loaded by the service worker (importScripts) and the review page
   (<script>). Hits here are instant and fully private; misses fall
   back to the API in translate.js and get cached in storage.
   ------------------------------------------------------------
   Keep glosses short, lowercase, most-common sense first.
   ============================================================ */
'use strict';

const TR_DICT = {
  // ---- everyday nouns ----
  time: 'zaman', people: 'insanlar', way: 'yol', day: 'gün', man: 'adam',
  thing: 'şey', woman: 'kadın', life: 'hayat', child: 'çocuk', world: 'dünya',
  school: 'okul', house: 'ev', home: 'ev', family: 'aile', food: 'yemek',
  water: 'su', money: 'para', friend: 'arkadaş', job: 'iş', work: 'iş, çalışmak',
  morning: 'sabah', night: 'gece', evening: 'akşam', week: 'hafta', month: 'ay',
  year: 'yıl', today: 'bugün', book: 'kitap', word: 'kelime', question: 'soru',
  answer: 'cevap', problem: 'sorun', idea: 'fikir', reason: 'sebep', story: 'hikâye',
  city: 'şehir', country: 'ülke', car: 'araba', phone: 'telefon', computer: 'bilgisayar',
  door: 'kapı', room: 'oda', street: 'sokak', weather: 'hava durumu', rain: 'yağmur',
  sun: 'güneş', dog: 'köpek', cat: 'kedi', bird: 'kuş', tree: 'ağaç',
  // ---- verbs ----
  be: 'olmak', have: 'sahip olmak', do: 'yapmak', say: 'söylemek', get: 'almak, edinmek',
  make: 'yapmak', go: 'gitmek', come: 'gelmek', take: 'almak', see: 'görmek',
  know: 'bilmek', think: 'düşünmek', learn: 'öğrenmek', teach: 'öğretmek', study: 'ders çalışmak',
  read: 'okumak', write: 'yazmak', speak: 'konuşmak', listen: 'dinlemek', ask: 'sormak',
  help: 'yardım etmek', try: 'denemek', start: 'başlamak', finish: 'bitirmek', stop: 'durmak',
  run: 'koşmak', walk: 'yürümek', eat: 'yemek yemek', drink: 'içmek', sleep: 'uyumak',
  buy: 'satın almak', sell: 'satmak', pay: 'ödemek', build: 'inşa etmek', break: 'kırmak',
  bring: 'getirmek', send: 'göndermek', show: 'göstermek', explain: 'açıklamak', understand: 'anlamak',
  remember: 'hatırlamak', forget: 'unutmak', believe: 'inanmak', hope: 'ummak', love: 'sevmek',
  like: 'beğenmek, hoşlanmak', need: 'ihtiyaç duymak', want: 'istemek', use: 'kullanmak', find: 'bulmak',
  lose: 'kaybetmek', win: 'kazanmak', change: 'değiştirmek', improve: 'geliştirmek', increase: 'artırmak',
  reduce: 'azaltmak', develop: 'geliştirmek', achieve: 'başarmak', succeed: 'başarılı olmak', fail: 'başarısız olmak',
  // ---- adjectives ----
  good: 'iyi', bad: 'kötü', big: 'büyük', small: 'küçük', new: 'yeni',
  old: 'eski, yaşlı', young: 'genç', long: 'uzun', short: 'kısa', high: 'yüksek',
  low: 'düşük', great: 'harika', beautiful: 'güzel', happy: 'mutlu', sad: 'üzgün',
  easy: 'kolay', difficult: 'zor', hard: 'zor, sert', important: 'önemli', different: 'farklı',
  same: 'aynı', true: 'doğru', false: 'yanlış', free: 'bedava, özgür', busy: 'meşgul',
  tired: 'yorgun', hungry: 'aç', strong: 'güçlü', weak: 'zayıf', rich: 'zengin',
  poor: 'fakir', clean: 'temiz', dirty: 'kirli', safe: 'güvenli', dangerous: 'tehlikeli',
  fast: 'hızlı', slow: 'yavaş', early: 'erken', late: 'geç', ready: 'hazır',
  brilliant: 'parlak, çok zeki', careful: 'dikkatli', clear: 'açık, net', common: 'yaygın',
  // ---- adverbs / connectors / misc ----
  very: 'çok', also: 'ayrıca', just: 'sadece, az önce', already: 'zaten', yet: 'henüz, ama',
  still: 'hâlâ', always: 'her zaman', never: 'asla', sometimes: 'bazen', often: 'sık sık',
  usually: 'genellikle', again: 'tekrar', together: 'birlikte', almost: 'neredeyse', enough: 'yeterli',
  however: 'ancak', although: 'rağmen, -se de', because: 'çünkü', therefore: 'bu yüzden', example: 'örnek',
  // ---- study / abstract ----
  knowledge: 'bilgi', language: 'dil', lesson: 'ders', exam: 'sınav', success: 'başarı',
  effort: 'çaba', experience: 'deneyim', progress: 'ilerleme', result: 'sonuç', decision: 'karar',
  choice: 'seçim', chance: 'şans', future: 'gelecek', past: 'geçmiş', present: 'hediye, şimdiki',
  health: 'sağlık', nature: 'doğa', science: 'bilim', history: 'tarih', culture: 'kültür',
  meaning: 'anlam', sentence: 'cümle', mistake: 'hata', rule: 'kural', memory: 'hafıza',
  attention: 'dikkat', patience: 'sabır', courage: 'cesaret', freedom: 'özgürlük', peace: 'barış',
};
