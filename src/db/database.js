import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('cards.db');

// Card "type" from YGOPRODeck is a specific string like "Effect Monster",
// "Spell Card", "Trap Card", "Fusion Monster", etc. - never just "Monster".
// The old filter compared the tab name directly against that column, which
// is why Monster/Spell/Trap tabs never matched anything. `category` is a
// normalized bucket derived once at insert time so filtering is reliable.
export function categoryFromType(type) {
  if (!type) return 'Other';
  if (type.includes('Monster')) return 'Monster';
  if (type.includes('Spell')) return 'Spell';
  if (type.includes('Trap')) return 'Trap';
  return 'Other';
}

const SORT_COLUMNS = {
  name: 'name ASC',
  type: 'type ASC, name ASC',
  rarity: 'IFNULL(rarity, "") ASC, name ASC',
};

function sortClause(sortBy) {
  return SORT_COLUMNS[sortBy] || SORT_COLUMNS.name;
}

export async function initDatabase() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ygo_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Other',
      rarity TEXT,
      set_code TEXT,
      image_url TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      location TEXT NOT NULL DEFAULT 'Binder',
      UNIQUE(ygo_id, rarity, set_code)
    );

    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deck_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER NOT NULL,
      card_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      UNIQUE(deck_id, card_id),
      FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
    );
  `);

  // Lightweight migration for anyone upgrading from an earlier build of this
  // app that didn't have category/location yet.
  const columns = await db.getAllAsync('PRAGMA table_info(cards)');
  const columnNames = columns.map((c) => c.name);

  if (!columnNames.includes('category')) {
    await db.execAsync("ALTER TABLE cards ADD COLUMN category TEXT NOT NULL DEFAULT 'Other'");
    const rows = await db.getAllAsync('SELECT id, type FROM cards');
    for (const row of rows) {
      await db.runAsync('UPDATE cards SET category = ? WHERE id = ?', [
        categoryFromType(row.type),
        row.id,
      ]);
    }
  }

  if (!columnNames.includes('location')) {
    await db.execAsync("ALTER TABLE cards ADD COLUMN location TEXT NOT NULL DEFAULT 'Binder'");
  }
}

export async function getAllCards({ sortBy = 'name' } = {}) {
  return db.getAllAsync(`SELECT * FROM cards ORDER BY ${sortClause(sortBy)}`);
}

export async function getCardsByCategory(category, { sortBy = 'name' } = {}) {
  return db.getAllAsync(
    `SELECT * FROM cards WHERE category = ? ORDER BY ${sortClause(sortBy)}`,
    [category]
  );
}

export async function searchCards(query, { sortBy = 'name' } = {}) {
  return db.getAllAsync(
    `SELECT * FROM cards WHERE name LIKE ? ORDER BY ${sortClause(sortBy)}`,
    [`%${query}%`]
  );
}

export async function getCardById(id) {
  return db.getFirstAsync('SELECT * FROM cards WHERE id = ?', [id]);
}

// Adds a card, or increments quantity if the same card+rarity+set already exists
export async function addOrIncrementCard(card) {
  const { ygo_id, name, type, rarity, set_code, image_url, quantity = 1, location = 'Binder' } = card;
  const category = categoryFromType(type);

  const existing = await db.getFirstAsync(
    'SELECT * FROM cards WHERE ygo_id = ? AND IFNULL(rarity, "") = IFNULL(?, "") AND IFNULL(set_code, "") = IFNULL(?, "")',
    [ygo_id, rarity, set_code]
  );

  if (existing) {
    await db.runAsync('UPDATE cards SET quantity = quantity + ? WHERE id = ?', [
      quantity,
      existing.id,
    ]);
    return { ...existing, quantity: existing.quantity + quantity };
  }

  const result = await db.runAsync(
    'INSERT INTO cards (ygo_id, name, type, category, rarity, set_code, image_url, quantity, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [ygo_id, name, type, category, rarity, set_code, image_url, quantity, location]
  );

  return { id: result.lastInsertRowId, category, ...card };
}

// Sets quantity to an exact value (used by the edit screen's stepper).
// Deleting via quantity 0 is intentional here - matches the old behavior.
export async function setQuantity(id, quantity) {
  if (quantity <= 0) {
    await db.runAsync('DELETE FROM cards WHERE id = ?', [id]);
    return null;
  }
  await db.runAsync('UPDATE cards SET quantity = ? WHERE id = ?', [quantity, id]);
}

export async function setLocation(id, location) {
  await db.runAsync('UPDATE cards SET location = ? WHERE id = ?', [location, id]);
}

export async function deleteCard(id) {
  await db.runAsync('DELETE FROM cards WHERE id = ?', [id]);
}

// --- Decks ---
// Deck cards are a separate reference table - adding/removing a card to a
// deck never touches the main `cards.quantity` column, so your overall
// collection count stays accurate regardless of how many decks a card is in.

export async function getDecks() {
  return db.getAllAsync(`
    SELECT decks.*, COUNT(deck_cards.id) as card_count
    FROM decks
    LEFT JOIN deck_cards ON deck_cards.deck_id = decks.id
    GROUP BY decks.id
    ORDER BY decks.name ASC
  `);
}

export async function createDeck(name) {
  const result = await db.runAsync('INSERT INTO decks (name) VALUES (?)', [name]);
  return { id: result.lastInsertRowId, name };
}

export async function renameDeck(id, name) {
  await db.runAsync('UPDATE decks SET name = ? WHERE id = ?', [name, id]);
}

export async function deleteDeck(id) {
  await db.runAsync('DELETE FROM deck_cards WHERE deck_id = ?', [id]);
  await db.runAsync('DELETE FROM decks WHERE id = ?', [id]);
}

export async function getDeckCards(deckId) {
  return db.getAllAsync(
    `SELECT cards.*, deck_cards.id as deck_card_id, deck_cards.quantity as deck_quantity
     FROM deck_cards
     JOIN cards ON cards.id = deck_cards.card_id
     WHERE deck_cards.deck_id = ?
     ORDER BY cards.name ASC`,
    [deckId]
  );
}

// Adds one copy of a card to a deck, or increments the deck's count for it.
export async function addCardToDeck(deckId, cardId) {
  const existing = await db.getFirstAsync(
    'SELECT * FROM deck_cards WHERE deck_id = ? AND card_id = ?',
    [deckId, cardId]
  );

  if (existing) {
    await db.runAsync('UPDATE deck_cards SET quantity = quantity + 1 WHERE id = ?', [existing.id]);
    return;
  }

  await db.runAsync('INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (?, ?, 1)', [
    deckId,
    cardId,
  ]);
}

export async function setDeckCardQuantity(deckCardId, quantity) {
  if (quantity <= 0) {
    await db.runAsync('DELETE FROM deck_cards WHERE id = ?', [deckCardId]);
    return;
  }
  await db.runAsync('UPDATE deck_cards SET quantity = ? WHERE id = ?', [quantity, deckCardId]);
}

export async function removeCardFromDeck(deckCardId) {
  await db.runAsync('DELETE FROM deck_cards WHERE id = ?', [deckCardId]);
}
