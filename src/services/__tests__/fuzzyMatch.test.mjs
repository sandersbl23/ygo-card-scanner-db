// Run with: node src/services/__tests__/fuzzyMatch.test.mjs
//
// Note: this mocks the YGOPRODeck API response instead of hitting the real
// network, since the matching LOGIC (normalization, retry ladder, ranking)
// is what needs verifying here - not YGOPRODeck's uptime. Before shipping,
// also run a manual pass: scan 15-20 real physical cards under normal
// lighting, log what the vision model guesses for each, and confirm
// searchCardsFuzzy(guess) puts the right card first every time. Cards with
// long/similar names (e.g. "Elemental HERO" archetype) and cards with
// special characters ("Ash Blossom & Joyous Spring") are worth targeting
// specifically, since those are where OCR misreads most often.

import assert from 'node:assert';
import test from 'node:test';
import { normalizeName, similarity, searchCardsFuzzy } from '../ygoApi.js';

// A small local stand-in for the YGOPRODeck database, just for these tests.
const MOCK_DB = [
  { id: 1, name: 'Blue-Eyes White Dragon', type: 'Normal Monster', card_sets: [] },
  { id: 2, name: 'Dark Magician', type: 'Normal Monster', card_sets: [] },
  { id: 3, name: 'Pot of Greed', type: 'Spell Card', card_sets: [] },
  { id: 4, name: 'Mirror Force', type: 'Trap Card', card_sets: [] },
  { id: 5, name: 'Ash Blossom & Joyous Spring', type: 'Effect Monster', card_sets: [] },
  { id: 6, name: 'Elemental HERO Sparkman', type: 'Effect Monster', card_sets: [] },
  { id: 7, name: 'Elemental HERO Avian', type: 'Effect Monster', card_sets: [] },
];

// Mirrors the substring behavior of YGOPRODeck's real `fname` param.
function mockFname(query) {
  const q = query.toLowerCase();
  return MOCK_DB.filter((c) => c.name.toLowerCase().includes(q));
}

// Patch global.fetch so searchCardByName (and therefore searchCardsFuzzy)
// runs against the mock DB above instead of the real network. This is safe
// to set after the import above: fetch is only called lazily, inside async
// functions, once a test actually invokes them below.
global.fetch = async (url) => {
  const match = decodeURIComponent(url).match(/fname=(.+)$/);
  const query = match ? match[1] : '';
  const data = mockFname(query);
  return {
    ok: data.length > 0,
    status: data.length > 0 ? 200 : 400,
    json: async () => ({ data }),
  };
};

test('normalizeName strips punctuation and case', () => {
  assert.strictEqual(normalizeName('Blue-Eyes White Dragon!'), 'blueeyes white dragon');
  assert.strictEqual(normalizeName('Ash Blossom & Joyous Spring'), 'ash blossom joyous spring');
});

test('similarity scores an exact match as 1', () => {
  assert.strictEqual(similarity('Dark Magician', 'Dark Magician'), 1);
});

test('similarity scores a near-miss OCR read highly but not perfectly', () => {
  const score = similarity('Dark Maglcian', 'Dark Magician'); // 'i' misread as 'l'
  assert.ok(score > 0.85 && score < 1, `expected high-but-imperfect score, got ${score}`);
});

test('exact OCR read matches on the first attempt', async () => {
  const results = await searchCardsFuzzy('Pot of Greed');
  assert.strictEqual(results[0].name, 'Pot of Greed');
});

test('missing hyphen (common OCR drop) still matches via normalization', async () => {
  const results = await searchCardsFuzzy('Blue Eyes White Dragon'); // no hyphen
  assert.strictEqual(results[0].name, 'Blue-Eyes White Dragon');
});

test('stray punctuation from a misread symbol still matches', async () => {
  const results = await searchCardsFuzzy('Mirror Force.'); // trailing artifact
  assert.strictEqual(results[0].name, 'Mirror Force');
});

test('ampersand misread as "and" still finds the card via keyword fallback', async () => {
  const results = await searchCardsFuzzy('Ash Blossom and Joyous Spring');
  assert.strictEqual(results[0].name, 'Ash Blossom & Joyous Spring');
});

test('similar archetype names are ranked with the closer one first', async () => {
  // "Sparkmvn" is close enough to be an OCR misread but won't substring-match
  // anything, so this forces the keyword fallback (on "elemental"), which
  // pulls back BOTH Elemental HERO cards - ranking then has to pick the
  // right one first based on similarity to the full original guess.
  const results = await searchCardsFuzzy('Elemental HERO Sparkmvn');
  assert.strictEqual(results[0].name, 'Elemental HERO Sparkman');
  assert.ok(
    results.findIndex((c) => c.name === 'Elemental HERO Avian') >
      results.findIndex((c) => c.name === 'Elemental HERO Sparkman')
  );
});

test('no match anywhere returns an empty array rather than throwing', async () => {
  const results = await searchCardsFuzzy('Completely Made Up Card Name Xyz');
  assert.deepStrictEqual(results, []);
});
