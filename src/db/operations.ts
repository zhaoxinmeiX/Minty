import { SQLiteDatabase } from 'expo-sqlite';
import { Category, Ledger, RecordItem } from './schema';

export const getLedgers = (db: SQLiteDatabase): Ledger[] => {
  return db.getAllSync<Ledger>('SELECT * FROM ledgers ORDER BY created_at ASC');
};

export const addLedger = (db: SQLiteDatabase, name: string, currency: string = 'NZD') => {
  const result = db.runSync('INSERT INTO ledgers (name, currency) VALUES (?, ?)', name, currency);
  return result.lastInsertRowId;
};

export const updateLedger = (db: SQLiteDatabase, id: number, name: string) => {
  return db.runSync('UPDATE ledgers SET name = ? WHERE id = ?', name, id);
};

export const deleteLedger = (db: SQLiteDatabase, id: number) => {
  return db.runSync('DELETE FROM ledgers WHERE id = ?', id);
};

export const getRecordsByLedger = (db: SQLiteDatabase, ledgerId: number): RecordItem[] => {
  return db.getAllSync<RecordItem>(
    `SELECT r.*, IFNULL(c.icon, 'LayoutGrid') as icon
     FROM records r
     LEFT JOIN categories c ON r.category_id = c.id
     WHERE r.ledger_id = ?
     ORDER BY r.created_at DESC`,
    ledgerId,
  );
};

export const getRecordsByLedgerAndMonth = (db: SQLiteDatabase, ledgerId: number, year: string, month: string): RecordItem[] => {
  const likePattern = `${year}-${month}-%`;
  return db.getAllSync<RecordItem>(
    `SELECT r.*, IFNULL(c.icon, 'LayoutGrid') as icon
     FROM records r
     LEFT JOIN categories c ON r.category_id = c.id
     WHERE r.ledger_id = ? AND date(r.created_at) LIKE ?
     ORDER BY r.created_at DESC`,
    ledgerId,
    likePattern,
  );
};

export type BillListType = 'all' | 'expense' | 'income';

export type BillListQueryParams = {
  ledgerId: number;
  startDate?: string;
  endDate?: string;
  type?: BillListType;
  minAmount?: number;
  maxAmount?: number;
  categoryId?: number;
  keyword?: string;
};

export type BillListCategoryOption = {
  category_id: number;
  category: string;
  icon: string;
};

export const getRecordsForBillList = (db: SQLiteDatabase, params: BillListQueryParams): RecordItem[] => {
  const { ledgerId, startDate, endDate, type = 'all', minAmount, maxAmount, categoryId, keyword } = params;

  let query = `
    SELECT r.*, IFNULL(c.icon, 'LayoutGrid') as icon
    FROM records r
    LEFT JOIN categories c ON r.category_id = c.id
    WHERE r.ledger_id = ?
  `;
  const sqlParams: any[] = [ledgerId];

  if (startDate && endDate) {
    query += ` AND date(r.created_at) BETWEEN ? AND ?`;
    sqlParams.push(startDate, endDate);
  } else if (startDate) {
    query += ` AND date(r.created_at) >= ?`;
    sqlParams.push(startDate);
  } else if (endDate) {
    query += ` AND date(r.created_at) <= ?`;
    sqlParams.push(endDate);
  }

  if (type === 'expense' || type === 'income') {
    query += ` AND r.type = ?`;
    sqlParams.push(type);
  }

  if (typeof minAmount === 'number' && !Number.isNaN(minAmount)) {
    query += ` AND r.amount >= ?`;
    sqlParams.push(minAmount);
  }

  if (typeof maxAmount === 'number' && !Number.isNaN(maxAmount)) {
    query += ` AND r.amount <= ?`;
    sqlParams.push(maxAmount);
  }

  if (typeof categoryId === 'number') {
    query += ` AND r.category_id = ?`;
    sqlParams.push(categoryId);
  }

  if (keyword && keyword.trim().length > 0) {
    const like = `%${keyword.trim().toLowerCase()}%`;
    query += `
      AND (
        LOWER(IFNULL(r.category, '')) LIKE ?
        OR LOWER(IFNULL(r.sub_category, '')) LIKE ?
        OR LOWER(IFNULL(r.note, '')) LIKE ?
        OR CAST(r.amount AS TEXT) LIKE ?
      )
    `;
    sqlParams.push(like, like, like, like);
  }

  query += ` ORDER BY datetime(r.created_at) DESC`;
  return db.getAllSync<RecordItem>(query, ...sqlParams);
};

export const getBillListCategoryOptions = (db: SQLiteDatabase, ledgerId: number): BillListCategoryOption[] => {
  return db.getAllSync<BillListCategoryOption>(
    `SELECT DISTINCT
      r.category_id,
      r.category,
      IFNULL(c.icon, 'LayoutGrid') as icon
     FROM records r
     LEFT JOIN categories c ON r.category_id = c.id
     WHERE r.ledger_id = ?
     ORDER BY r.category_id ASC`,
    ledgerId,
  );
};

export const getRecordById = (db: SQLiteDatabase, id: number): RecordItem | null => {
  return db.getFirstSync<RecordItem>(
    `SELECT r.*, IFNULL(c.icon, 'LayoutGrid') as icon
     FROM records r
     LEFT JOIN categories c ON r.category_id = c.id
     WHERE r.id = ?`,
    id,
  );
};

export const getDailySummaryByMonth = (db: SQLiteDatabase, ledgerId: number, year: string, month: string): { date: string; total_expense: number; total_income: number }[] => {
  const likePattern = `${year}-${month}-%`;
  return db.getAllSync<{ date: string; total_expense: number; total_income: number }>(
    `SELECT date(created_at) as date,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income
     FROM records
     WHERE ledger_id = ? AND date(created_at) LIKE ?
     GROUP BY date(created_at)`,
    ledgerId,
    likePattern,
  );
};

export const getCategoryStats = (
  db: SQLiteDatabase,
  ledgerId: number,
  type: 'expense' | 'income',
  startDate?: string,
  endDate?: string,
): { category: string; category_id: number; icon: string; totalAmount: number; count: number; percentage: number }[] => {
  let query = `
    SELECT
      category,
      category_id,
      SUM(amount) as totalAmount,
      COUNT(*) as count
    FROM records
    WHERE ledger_id = ? AND type = ?
  `;
  const params: any[] = [ledgerId, type];

  if (startDate && endDate) {
    query += ` AND date(created_at) BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  } else if (startDate) {
    query += ` AND date(created_at) >= ?`;
    params.push(startDate);
  }

  query += ` GROUP BY category_id ORDER BY totalAmount DESC`;

  const rows = db.getAllSync<{ category: string; category_id: number; totalAmount: number; count: number }>(query, ...params);

  const totalSum = rows.reduce((acc, row) => acc + row.totalAmount, 0);

  return rows.map((row) => {
    // We need the icon from categories table
    const cat = db.getFirstSync<{ icon: string }>('SELECT icon FROM categories WHERE id = ?', row.category_id);
    return {
      ...row,
      icon: cat?.icon || 'Question',
      percentage: totalSum > 0 ? (row.totalAmount / totalSum) * 100 : 0,
    };
  });
};

export const ensureLedgerSync = (db: SQLiteDatabase, name: string): number => {
  const existing = db.getFirstSync<Ledger>('SELECT * FROM ledgers WHERE name = ?', name);
  if (existing) {
    return existing.id;
  }
  return addLedger(db, name);
};

export const addRecord = (db: SQLiteDatabase, data: Omit<RecordItem, 'id' | 'created_at'> & { created_at?: string }) => {
  if (data.created_at) {
    const result = db.runSync(
      `INSERT INTO records (amount, type, category_id, sub_category_id, category, sub_category, note, member, ledger_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.amount,
      data.type,
      data.category_id,
      data.sub_category_id,
      data.category,
      data.sub_category,
      data.note,
      data.member,
      data.ledger_id,
      data.created_at,
    );
    return result.lastInsertRowId;
  } else {
    const result = db.runSync(
      `INSERT INTO records (amount, type, category_id, sub_category_id, category, sub_category, note, member, ledger_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.amount,
      data.type,
      data.category_id,
      data.sub_category_id,
      data.category,
      data.sub_category,
      data.note,
      data.member,
      data.ledger_id,
    );
    return result.lastInsertRowId;
  }
};

export const updateRecord = (db: SQLiteDatabase, id: number, data: Omit<RecordItem, 'id' | 'created_at'> & { created_at: string }) => {
  return db.runSync(
    `UPDATE records SET amount = ?, type = ?, category_id = ?, sub_category_id = ?, category = ?, sub_category = ?, note = ?, member = ?, ledger_id = ?, created_at = ?
     WHERE id = ?`,
    data.amount,
    data.type,
    data.category_id,
    data.sub_category_id,
    data.category,
    data.sub_category,
    data.note,
    data.member,
    data.ledger_id,
    data.created_at,
    id,
  );
};

export const deleteRecord = (db: SQLiteDatabase, id: number) => {
  return db.runSync('DELETE FROM records WHERE id = ?', id);
};

// CATEGORY OPERATIONS
export const getCategories = (db: SQLiteDatabase, type: 'expense' | 'income'): Category[] => {
  return db.getAllSync<Category>('SELECT * FROM categories WHERE type = ? AND parent_id IS NULL ORDER BY id ASC', type);
};

export const getSubCategories = (db: SQLiteDatabase, parentId: number): Category[] => {
  return db.getAllSync<Category>('SELECT * FROM categories WHERE parent_id = ? ORDER BY id ASC', parentId);
};

export const addCategory = (db: SQLiteDatabase, name: string, icon: string, type: 'expense' | 'income', parentId: number | null = null) => {
  const result = db.runSync('INSERT INTO categories (name, icon, type, parent_id) VALUES (?, ?, ?, ?)', name, icon, type, parentId);
  return result.lastInsertRowId;
};

export const updateCategory = (db: SQLiteDatabase, id: number, name: string, icon: string) => {
  return db.runSync('UPDATE categories SET name = ?, icon = ? WHERE id = ?', name, icon, id);
};

export const deleteCategory = (db: SQLiteDatabase, id: number) => {
  return db.runSync('DELETE FROM categories WHERE id = ?', id);
};

export const getCategoryByName = (db: SQLiteDatabase, name: string, type: 'expense' | 'income', parentId: number | null = null): Category | null => {
  if (parentId !== null) {
    return db.getFirstSync<Category>('SELECT * FROM categories WHERE name = ? AND type = ? AND parent_id = ?', name, type, parentId);
  }
  return db.getFirstSync<Category>('SELECT * FROM categories WHERE name = ? AND type = ? AND parent_id IS NULL', name, type);
};
