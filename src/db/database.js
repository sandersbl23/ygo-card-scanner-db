import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('cards.db');

export async function initDatabase() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ygo_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      rarity TEXT,
      set_code TEXT,
      image_url TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      UNIQUE(ygo_id, rarity, set_code)
    );
  `);
}

export async function getAllCards() {
  return db.getAllAsync('SELECT * FROM cards ORDER BY name ASC');
}

export async function getCardsByType(type) {
  return db.getAllAsync('SELECT * FROM cards WHERE type = ? ORDER BY name ASC', [type]);
}

// Adds a card, or increments quantity if the same card+rarity+set already exists
export async function addOrIncrementCard(card) {
  const { ygo_id, name, type, rarity, set_code, image_url, quantity = 1 } = card;

  const existing = await db.getFirstAsync(
    'SELECT * FROM cards WHERE ygo_id = ? AND IFNULL(rarity, "") = IFNULL(?, "") AND IFNULL(set_code, "") = IFNULL(?, "")',
    [ygo_id, rarity, set_code]
  );

  if (existing) {
    await db.runAsync(
      'UPDATE cards SET quantity = quantity + ? WHERE id = ?',
      [quantity, existing.id]
    );
    return { ...existing, quantity: existing.quantity + quantity };
  }

  const result = await db.runAsync(
    'INSERT INTO cards (ygo_id, name, type, rarity, set_code, image_url, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [ygo_id, name, type, rarity, set_code, image_url, quantity]
  );

  return { id: result.lastInsertRowId, ...card };
}

export async function updateQuantity(id, quantity) {
  if (quantity <= 0) {
    await db.runAsync('DELETE FROM cards WHERE id = ?', [id]);
    return null;
  }
  await db.runAsync('UPDATE cards SET quantity = ? WHERE id = ?', [quantity, id]);
}

export async function deleteCard(id) {
  await db.runAsync('DELETE FROM cards WHERE id = ?', [id]);
}
