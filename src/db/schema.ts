export type Ledger = {
  id: number;
  name: string;
  currency: string;
  created_at: string;
};

export type Category = {
  id: number;
  name: string;
  icon: string;
  type: 'expense' | 'income';
  parent_id: number | null;
};

export type RecordItem = {
  id: number;
  amount: number;
  type: 'expense' | 'income';
  category_id: number;
  sub_category_id: number | null;
  category: string;
  sub_category: string | null;
  note: string | null;
  ledger_id: number;
  created_at: string;
  icon: string;
};

export const DATABASE_NAME = 'minty.db';

export const INIT_QUERIES = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Tables
CREATE TABLE IF NOT EXISTS ledgers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'NZD',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  type TEXT NOT NULL,
  parent_id INTEGER DEFAULT NULL,
  FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  sub_category_id INTEGER,
  category TEXT NOT NULL,
  sub_category TEXT,
  note TEXT,
  ledger_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ledger_id) REFERENCES ledgers (id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
  FOREIGN KEY (sub_category_id) REFERENCES categories (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_records_ledger_created_at ON records (ledger_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_records_ledger_type_created_at ON records (ledger_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_records_ledger_category_created_at ON records (ledger_id, category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_type_parent_id ON categories (type, parent_id);
`;
