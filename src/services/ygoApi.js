const BASE_URL = 'https://db.ygoprodeck.com/api/v7';

// Looks up a card by (fuzzy) name and returns every known printing
// (each printing can have its own set, rarity, and price info).
export async function searchCardByName(name) {
  const url = `${BASE_URL}/cardinfo.php?fname=${encodeURIComponent(name)}`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 400) return []; // no matches
    throw new Error(`YGOPRODeck request failed: ${response.status}`);
  }

  const json = await response.json();
  return json.data ?? [];
}

// --- Fuzzy matching for OCR-noisy vision output ---
//
// A vision model reading a physical card photo will occasionally misread a
// character, add stray punctuation, or drop a word ("Blue Eyes White Dragon"
// vs "Blue-Eyes White Dragon"). This layer normalizes the guess and retries
// with progressively looser queries before giving up, then ranks whatever
// comes back by similarity to the original guess so the best match is first.

export function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s]/g, '') // strip punctuation (hyphens, apostrophes, accents artifacts)
    .replace(/\s+/g, ' ')
    .trim();
}

// Classic edit-distance - small enough card names that this is cheap to run.
function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

// 0 (no similarity) to 1 (identical), normalized by the longer string's length.
export function similarity(a, b) {
  const normA = normalizeName(a);
  const normB = normalizeName(b);
  if (normA === normB) return 1;
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(normA, normB) / maxLen;
}

// Tries the guess as-is, then normalized, then just its most distinctive
// (longest) word, so a misread like "8lue-Eyes White Dragon!!" still lands on
// "Blue-Eyes White Dragon". Whatever comes back is ranked by similarity to
// the original guess, best match first.
export async function searchCardsFuzzy(guessedName) {
  const attempts = [
    guessedName,
    normalizeName(guessedName),
    ...normalizeName(guessedName)
      .split(' ')
      .filter((w) => w.length > 3)
      .sort((a, b) => b.length - a.length)
      .slice(0, 1),
  ];

  for (const attempt of attempts) {
    if (!attempt) continue;
    const results = await searchCardByName(attempt);
    if (results.length > 0) {
      return results
        .map((card) => ({ card, score: similarity(guessedName, card.name) }))
        .sort((a, b) => b.score - a.score)
        .map((r) => r.card);
    }
  }

  return [];
}

// Flattens a card's card_sets array into single "printing" objects
// the UI can list as selectable options (set + rarity).
export function getPrintings(card) {
  if (!card.card_sets || card.card_sets.length === 0) {
    return [
      {
        set_code: null,
        set_name: null,
        rarity: null,
      },
    ];
  }

  return card.card_sets.map((s) => ({
    set_code: s.set_code,
    set_name: s.set_name,
    rarity: s.set_rarity,
  }));
}

export function getPrimaryImageUrl(card) {
  return card.card_images?.[0]?.image_url ?? null;
}
