export interface BibleBook {
  id: number; // bolls.life 1-indexed book number
  name: string;
  chapters: number;
}

export const BIBLE_BOOKS: BibleBook[] = [
  { id: 1, name: "Genesis", chapters: 50 },
  { id: 2, name: "Exodus", chapters: 40 },
  { id: 3, name: "Leviticus", chapters: 27 },
  { id: 4, name: "Numbers", chapters: 36 },
  { id: 5, name: "Deuteronomy", chapters: 34 },
  { id: 6, name: "Joshua", chapters: 24 },
  { id: 7, name: "Judges", chapters: 21 },
  { id: 8, name: "Ruth", chapters: 4 },
  { id: 9, name: "1 Samuel", chapters: 31 },
  { id: 10, name: "2 Samuel", chapters: 24 },
  { id: 11, name: "1 Kings", chapters: 22 },
  { id: 12, name: "2 Kings", chapters: 25 },
  { id: 13, name: "1 Chronicles", chapters: 29 },
  { id: 14, name: "2 Chronicles", chapters: 36 },
  { id: 15, name: "Ezra", chapters: 10 },
  { id: 16, name: "Nehemiah", chapters: 13 },
  { id: 17, name: "Esther", chapters: 10 },
  { id: 18, name: "Job", chapters: 42 },
  { id: 19, name: "Psalms", chapters: 150 },
  { id: 20, name: "Proverbs", chapters: 31 },
  { id: 21, name: "Ecclesiastes", chapters: 12 },
  { id: 22, name: "Song of Solomon", chapters: 8 },
  { id: 23, name: "Isaiah", chapters: 66 },
  { id: 24, name: "Jeremiah", chapters: 52 },
  { id: 25, name: "Lamentations", chapters: 5 },
  { id: 26, name: "Ezekiel", chapters: 48 },
  { id: 27, name: "Daniel", chapters: 12 },
  { id: 28, name: "Hosea", chapters: 14 },
  { id: 29, name: "Joel", chapters: 3 },
  { id: 30, name: "Amos", chapters: 9 },
  { id: 31, name: "Obadiah", chapters: 1 },
  { id: 32, name: "Jonah", chapters: 4 },
  { id: 33, name: "Micah", chapters: 7 },
  { id: 34, name: "Nahum", chapters: 3 },
  { id: 35, name: "Habakkuk", chapters: 3 },
  { id: 36, name: "Zephaniah", chapters: 3 },
  { id: 37, name: "Haggai", chapters: 2 },
  { id: 38, name: "Zechariah", chapters: 14 },
  { id: 39, name: "Malachi", chapters: 4 },
  { id: 40, name: "Matthew", chapters: 28 },
  { id: 41, name: "Mark", chapters: 16 },
  { id: 42, name: "Luke", chapters: 24 },
  { id: 43, name: "John", chapters: 21 },
  { id: 44, name: "Acts", chapters: 28 },
  { id: 45, name: "Romans", chapters: 16 },
  { id: 46, name: "1 Corinthians", chapters: 16 },
  { id: 47, name: "2 Corinthians", chapters: 13 },
  { id: 48, name: "Galatians", chapters: 6 },
  { id: 49, name: "Ephesians", chapters: 6 },
  { id: 50, name: "Philippians", chapters: 4 },
  { id: 51, name: "Colossians", chapters: 4 },
  { id: 52, name: "1 Thessalonians", chapters: 5 },
  { id: 53, name: "2 Thessalonians", chapters: 3 },
  { id: 54, name: "1 Timothy", chapters: 6 },
  { id: 55, name: "2 Timothy", chapters: 4 },
  { id: 56, name: "Titus", chapters: 3 },
  { id: 57, name: "Philemon", chapters: 1 },
  { id: 58, name: "Hebrews", chapters: 13 },
  { id: 59, name: "James", chapters: 5 },
  { id: 60, name: "1 Peter", chapters: 5 },
  { id: 61, name: "2 Peter", chapters: 3 },
  { id: 62, name: "1 John", chapters: 5 },
  { id: 63, name: "2 John", chapters: 1 },
  { id: 64, name: "3 John", chapters: 1 },
  { id: 65, name: "Jude", chapters: 1 },
  { id: 66, name: "Revelation", chapters: 22 },
];

export const TRANSLATIONS = [
  { id: "NKJV", name: "New King James Version" },
  { id: "NIV", name: "New International Version" },
  { id: "ESV", name: "English Standard Version" },
  { id: "NLT", name: "New Living Translation" },
  { id: "NASB", name: "New American Standard Bible" },
  { id: "WEB", name: "World English Bible" },
];

export const DEFAULT_TRANSLATION = "NKJV";

// "John 3:16" or "1 Kings 2:3" → { book, chapter, verse }
export function parseReference(ref: string): { book: BibleBook; chapter: number; verse: number } | null {
  const match = ref.match(/^(.+)\s+(\d+):(\d+)$/);
  if (!match) return null;
  const book = BIBLE_BOOKS.find((b) => b.name.toLowerCase() === match[1].toLowerCase());
  if (!book) return null;
  return { book, chapter: parseInt(match[2]), verse: parseInt(match[3]) };
}

// ── Spoken reference parsing ──────────────────────────────────────────────────
// Turns transcribed speech like "john chapter three verse sixteen" or
// "first corinthians thirteen four" into { book, chapter, verse }.

const ONES: Record<string, number> = {
  zero: 0, oh: 0, one: 1, two: 2, to: 2, too: 2, three: 3, four: 4, for: 4,
  five: 5, six: 6, seven: 7, eight: 8, ate: 8, nine: 9,
};
const TEENS: Record<string, number> = {
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

const NUMBER_WORDS = new Set([
  ...Object.keys(ONES), ...Object.keys(TEENS), ...Object.keys(TENS), "hundred", "and",
]);

const ORDINAL_TO_DIGIT: Record<string, string> = {
  first: "1", "1st": "1",
  second: "2", "2nd": "2",
  third: "3", "3rd": "3",
};

const FILLER_WORDS = new Set(["chapter", "verse", "verses", "in", "the", "book", "of", "colon", "number", "no"]);

/**
 * Phonetic / STT misrecognition aliases → canonical lowercase book name.
 * Longer phrases must come before shorter ones so the replacement pass hits
 * the most-specific match first.
 */
const BOOK_ALIASES: Array<{ from: string; to: string }> = [
  // ── Multi-word phrases first (specificity order) ─────────────────────────
  // Zephaniah — STT often mishears this as conversational phrases
  { from: "is there funnier", to: "zephaniah" },
  { from: "anything funnier", to: "zephaniah" },
  { from: "his funnier", to: "zephaniah" },
  { from: "it's funnier", to: "zephaniah" },
  { from: "there's funnier", to: "zephaniah" },
  // Song of Solomon
  { from: "song of songs", to: "song of solomon" },
  { from: "songs of solomon", to: "song of solomon" },
  { from: "song of song", to: "song of solomon" },

  // ── Single-word aliases ──────────────────────────────────────────────────
  // Genesis
  { from: "jenesis", to: "genesis" },
  { from: "genis", to: "genesis" },
  // Exodus
  { from: "exidus", to: "exodus" },
  { from: "exidous", to: "exodus" },
  { from: "exadus", to: "exodus" },
  // Leviticus
  { from: "levitacus", to: "leviticus" },
  { from: "leviticus", to: "leviticus" },
  { from: "levitacous", to: "leviticus" },
  // Deuteronomy
  { from: "deutronomy", to: "deuteronomy" },
  { from: "dueteronomy", to: "deuteronomy" },
  { from: "duteronomy", to: "deuteronomy" },
  { from: "deuteronomy", to: "deuteronomy" },
  // Ruth
  { from: "route", to: "ruth" },
  { from: "root", to: "ruth" },
  { from: "rooth", to: "ruth" },
  { from: "rute", to: "ruth" },
  // Nehemiah
  { from: "nehimiah", to: "nehemiah" },
  { from: "nehemia", to: "nehemiah" },
  { from: "nehimia", to: "nehemiah" },
  { from: "nehamia", to: "nehemiah" },
  { from: "nahemia", to: "nehemiah" },
  // Psalms
  { from: "psalm", to: "psalms" },
  { from: "some", to: "psalms" },
  { from: "sam", to: "psalms" },
  { from: "sams", to: "psalms" },
  { from: "salms", to: "psalms" },
  { from: "palms", to: "psalms" },
  // Ecclesiastes
  { from: "ecclesiastics", to: "ecclesiastes" },
  { from: "ecclesiasies", to: "ecclesiastes" },
  { from: "ecclesiastis", to: "ecclesiastes" },
  // Isaiah
  { from: "isaia", to: "isaiah" },
  // Jeremiah
  { from: "jerimiah", to: "jeremiah" },
  { from: "jerimia", to: "jeremiah" },
  { from: "jeramiah", to: "jeremiah" },
  // Ezekiel
  { from: "ezekeal", to: "ezekiel" },
  { from: "ezekeil", to: "ezekiel" },
  // Hosea
  { from: "hoshea", to: "hosea" },
  // Joel
  { from: "jewel", to: "joel" },
  { from: "joule", to: "joel" },
  { from: "jowl", to: "joel" },
  // Obadiah
  { from: "obadia", to: "obadiah" },
  { from: "obadaya", to: "obadiah" },
  { from: "obadiyah", to: "obadiah" },
  { from: "obadiya", to: "obadiah" },
  // Micah
  { from: "my car", to: "micah" },
  { from: "mycar", to: "micah" },
  { from: "michael", to: "micah" },
  { from: "mica", to: "micah" },
  { from: "micka", to: "micah" },
  { from: "mika", to: "micah" },
  // Nahum
  { from: "new home", to: "nahum" },
  { from: "newhome", to: "nahum" },
  { from: "nahem", to: "nahum" },
  { from: "nahim", to: "nahum" },
  { from: "nayum", to: "nahum" },
  { from: "naum", to: "nahum" },
  // Habakkuk
  { from: "habacuc", to: "habakkuk" },
  { from: "habakuk", to: "habakkuk" },
  { from: "habakook", to: "habakkuk" },
  { from: "habakkook", to: "habakkuk" },
  // Zephaniah
  { from: "zefanya", to: "zephaniah" },
  { from: "zefaniah", to: "zephaniah" },
  { from: "zephania", to: "zephaniah" },
  { from: "zefanyah", to: "zephaniah" },
  // Haggai
  { from: "hey guy", to: "haggai" },
  { from: "haggy", to: "haggai" },
  { from: "haggie", to: "haggai" },
  { from: "haggay", to: "haggai" },
  { from: "haggy", to: "haggai" },
  // Zechariah
  { from: "zakaria", to: "zechariah" },
  { from: "zacaria", to: "zechariah" },
  { from: "zacharia", to: "zechariah" },
  { from: "zecharia", to: "zechariah" },
  { from: "zachariah", to: "zechariah" },
  // Malachi
  { from: "malaki", to: "malachi" },
  { from: "malakai", to: "malachi" },
  { from: "malaky", to: "malachi" },
  // Matthew
  { from: "mathew", to: "matthew" },
  { from: "mathew", to: "matthew" },
  // Acts
  { from: "arts", to: "acts" },
  { from: "ax", to: "acts" },
  // Ephesians
  { from: "efficience", to: "ephesians" },
  { from: "efficians", to: "ephesians" },
  { from: "efishans", to: "ephesians" },
  { from: "efeshans", to: "ephesians" },
  { from: "efesians", to: "ephesians" },
  // Philippians
  { from: "filipians", to: "philippians" },
  { from: "filipeans", to: "philippians" },
  // Colossians
  { from: "colossions", to: "colossians" },
  { from: "colosians", to: "colossians" },
  // Thessalonians
  { from: "thessalonions", to: "thessalonians" },
  { from: "thesalonians", to: "thessalonians" },
  // Revelation
  { from: "revelations", to: "revelation" },
  { from: "revelashuns", to: "revelation" },
];

/**
 * Replace alias phrases in the cleaned transcript with canonical book names.
 * We iterate longest-first (handled by definition order above) and replace
 * whole-word occurrences only.
 */
function normalizeAliases(text: string): string {
  let result = text;
  for (const { from, to } of BOOK_ALIASES) {
    // Use word-boundary-aware replacement; escape special regex chars in `from`
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "g"), to);
  }
  return result;
}

/**
 * "my car" is two words — handle multi-word spoken aliases that arrive as
 * separate tokens by doing the alias substitution on the whole string, not
 * token-by-token.
 */

/** Consumes a run of number-words (or digits) starting at index i, returns the parsed value and tokens consumed. */
function consumeNumber(tokens: string[], i: number): { value: number; length: number } | null {
  const tok = tokens[i];
  if (tok === undefined) return null;

  if (/^\d+$/.test(tok)) return { value: parseInt(tok, 10), length: 1 };
  if (!NUMBER_WORDS.has(tok)) return null;

  let total = 0;
  let current = 0;
  let length = 0;
  let j = i;

  while (j < tokens.length && NUMBER_WORDS.has(tokens[j])) {
    const word = tokens[j];
    if (word === "and") { j++; length++; continue; }
    if (word === "hundred") {
      current = (current || 1) * 100;
      total += current;
      current = 0;
    } else if (word in TENS) {
      current += TENS[word];
    } else if (word in TEENS) {
      current += TEENS[word];
    } else if (word in ONES) {
      current += ONES[word];
    }
    j++;
    length++;
  }

  total += current;
  if (length === 0) return null;
  return { value: total, length };
}

export function parseSpokenReference(raw: string): { book: BibleBook; chapter: number; verse: number } | null {
  const cleaned = normalizeAliases(
    raw
      .toLowerCase()
      .replace(/[.,!?;:]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
  if (!cleaned) return null;

  let tokens = cleaned.split(" ");

  // Normalize a leading ordinal ("first corinthians" → "1 corinthians")
  if (tokens[0] in ORDINAL_TO_DIGIT) {
    tokens = [ORDINAL_TO_DIGIT[tokens[0]], ...tokens.slice(1)];
  }

  // Match the longest possible book name at the start of the transcript
  let book: BibleBook | null = null;
  let consumedForBook = 0;
  for (const candidate of BIBLE_BOOKS) {
    const nameTokens = candidate.name.toLowerCase().split(" ");
    if (nameTokens.length > tokens.length) continue;
    const matches = nameTokens.every((t, idx) => tokens[idx] === t);
    if (matches && nameTokens.length > consumedForBook) {
      book = candidate;
      consumedForBook = nameTokens.length;
    }
  }
  if (!book) return null;

  // Walk the remaining tokens, skipping fillers, collecting up to two numbers
  const numbers: number[] = [];
  let i = consumedForBook;
  while (i < tokens.length && numbers.length < 2) {
    const tok = tokens[i];
    if (FILLER_WORDS.has(tok)) { i++; continue; }
    const parsed = consumeNumber(tokens, i);
    if (parsed) {
      numbers.push(parsed.value);
      i += parsed.length;
    } else {
      i++;
    }
  }

  // When STT collapses two spoken single digits into one (e.g. "seven seven"
  // → "77", "two three" → "23"), we end up with exactly one number.  If that
  // number is a two-digit value whose tens and ones digits are both 1-9, split
  // it into [tens, ones] so "Matthew 77" → Matthew 7:7.
  // Skip for Psalms: its 150 chapters mean "23" legitimately means chapter 23.
  if (numbers.length === 1 && book.name !== "Psalms") {
    const n = numbers[0];
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    if (n >= 11 && n <= 99 && tens >= 1 && tens <= 9 && ones >= 1 && ones <= 9) {
      numbers.splice(0, 1, tens, ones);
    }
  }

  if (numbers.length < 1) return null;
  const chapter = numbers[0];
  const verse = numbers.length >= 2 ? numbers[1] : 1;
  if (chapter < 1 || chapter > book.chapters || verse < 1) return null;

  return { book, chapter, verse };
}
