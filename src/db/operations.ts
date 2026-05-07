import { SQLiteDatabase } from 'expo-sqlite';
import { Category, Ledger, RecordItem } from './schema';

const RECORD_ICON_SELECT = `COALESCE(sc.icon, c.icon, 'LayoutGrid') as icon`;
const RECORD_CATEGORY_JOINS = `
  LEFT JOIN categories c ON r.category_id = c.id
  LEFT JOIN categories sc ON r.sub_category_id = sc.id
`;

const padMonth = (value: string) => value.padStart(2, '0');

const formatDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthBounds = (year: string, month: string) => {
  const normalizedMonth = padMonth(month);
  const start = new Date(Number(year), Number(normalizedMonth) - 1, 1);
  const end = new Date(Number(year), Number(normalizedMonth), 1);
  return {
    start: `${formatDateOnly(start)} 00:00:00`,
    end: `${formatDateOnly(end)} 00:00:00`,
  };
};

const getDateBounds = (startDate?: string, endDate?: string) => {
  const start = startDate ? `${startDate} 00:00:00` : undefined;
  const end = endDate
    ? (() => {
      const nextDay = new Date(`${endDate}T00:00:00`);
      nextDay.setDate(nextDay.getDate() + 1);
      return `${formatDateOnly(nextDay)} 00:00:00`;
    })()
    : undefined;

  return { start, end };
};

export const getLedgers = (db: SQLiteDatabase): Ledger[] => {
  return db.getAllSync<Ledger>('SELECT * FROM ledgers ORDER BY created_at ASC');
};

export const getLedgersAsync = (db: SQLiteDatabase): Promise<Ledger[]> => {
  return db.getAllAsync<Ledger>('SELECT * FROM ledgers ORDER BY created_at ASC');
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
    `SELECT r.*, ${RECORD_ICON_SELECT}
     FROM records r
     ${RECORD_CATEGORY_JOINS}
     WHERE r.ledger_id = ?
     ORDER BY r.created_at DESC`,
    ledgerId,
  );
};

export const getRecordsByLedgerAsync = (db: SQLiteDatabase, ledgerId: number): Promise<RecordItem[]> => {
  return db.getAllAsync<RecordItem>(
    `SELECT r.*, ${RECORD_ICON_SELECT}
     FROM records r
     ${RECORD_CATEGORY_JOINS}
     WHERE r.ledger_id = ?
     ORDER BY r.created_at DESC`,
    ledgerId,
  );
};

export const getRecordsByLedgerAndMonth = (db: SQLiteDatabase, ledgerId: number, year: string, month: string): RecordItem[] => {
  const { start, end } = getMonthBounds(year, month);
  return db.getAllSync<RecordItem>(
    `SELECT r.*, ${RECORD_ICON_SELECT}
     FROM records r
     ${RECORD_CATEGORY_JOINS}
     WHERE r.ledger_id = ? AND r.created_at >= ? AND r.created_at < ?
     ORDER BY r.created_at DESC`,
    ledgerId,
    start,
    end,
  );
};

export const getRecordsByLedgerAndMonthAsync = (db: SQLiteDatabase, ledgerId: number, year: string, month: string): Promise<RecordItem[]> => {
  const { start, end } = getMonthBounds(year, month);
  return db.getAllAsync<RecordItem>(
    `SELECT r.*, ${RECORD_ICON_SELECT}
     FROM records r
     ${RECORD_CATEGORY_JOINS}
     WHERE r.ledger_id = ? AND r.created_at >= ? AND r.created_at < ?
     ORDER BY r.created_at DESC`,
    ledgerId,
    start,
    end,
  );
};

export const getRecordsByLedgerInRangeAsync = async (db: SQLiteDatabase, ledgerId: number, startDate?: string, endDate?: string): Promise<RecordItem[]> => {
  const { start, end } = getDateBounds(startDate, endDate);
  let query = `
    SELECT r.*, ${RECORD_ICON_SELECT}
    FROM records r
    ${RECORD_CATEGORY_JOINS}
    WHERE r.ledger_id = ?
  `;
  const params: Array<number | string> = [ledgerId];

  if (start) {
    query += ' AND r.created_at >= ?';
    params.push(start);
  }

  if (end) {
    query += ' AND r.created_at < ?';
    params.push(end);
  }

  query += ' ORDER BY r.created_at DESC';
  return db.getAllAsync<RecordItem>(query, ...params);
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

export type BillListCursor = {
  createdAt: string;
  id: number;
};

export type BillListPageResult = {
  records: RecordItem[];
  hasMore: boolean;
  nextCursor: BillListCursor | null;
};

export type BillListMonthSummary = {
  yearMonth: string;
  recordCount: number;
  expenseTotal: number;
};

export type BillListCategoryOption = {
  category_id: number;
  category: string;
  icon: string;
};

export type RecordNoteSuggestion = Pick<
  RecordItem,
  'id' | 'amount' | 'type' | 'category_id' | 'sub_category_id' | 'category' | 'sub_category' | 'note' | 'created_at' | 'icon'
>;

type RecordMutationBase = Omit<RecordItem, 'id' | 'created_at' | 'icon'>;
type RecordInsertData = RecordMutationBase & { created_at?: string };
type RecordUpdateData = RecordMutationBase & { created_at: string };

type BillListQueryBuildOptions = {
  cursor?: BillListCursor;
  limit?: number;
  includeOrderBy?: boolean;
};

const buildBillListQuery = (
  params: BillListQueryParams,
  options: BillListQueryBuildOptions = {},
): { query: string; sqlParams: Array<string | number> } => {
  const { ledgerId, startDate, endDate, type = 'all', minAmount, maxAmount, categoryId, keyword } = params;
  const { cursor, limit, includeOrderBy = true } = options;
  const { start, end } = getDateBounds(startDate, endDate);

  let query = `
    SELECT r.*, ${RECORD_ICON_SELECT}
    FROM records r
    ${RECORD_CATEGORY_JOINS}
    WHERE r.ledger_id = ?
  `;
  const sqlParams: Array<string | number> = [ledgerId];

  if (start) {
    query += ` AND r.created_at >= ?`;
    sqlParams.push(start);
  }

  if (end) {
    query += ` AND r.created_at < ?`;
    sqlParams.push(end);
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

  if (cursor) {
    query += ` AND (r.created_at < ? OR (r.created_at = ? AND r.id < ?))`;
    sqlParams.push(cursor.createdAt, cursor.createdAt, cursor.id);
  }

  if (includeOrderBy) {
    query += ` ORDER BY r.created_at DESC, r.id DESC`;
  }

  if (typeof limit === 'number') {
    query += ` LIMIT ?`;
    sqlParams.push(limit);
  }

  return { query, sqlParams };
};

export const getRecordsForBillList = (db: SQLiteDatabase, params: BillListQueryParams): RecordItem[] => {
  const { query, sqlParams } = buildBillListQuery(params);
  return db.getAllSync<RecordItem>(query, ...sqlParams);
};

export const getRecordsForBillListAsync = async (db: SQLiteDatabase, params: BillListQueryParams): Promise<RecordItem[]> => {
  const { query, sqlParams } = buildBillListQuery(params);
  return db.getAllAsync<RecordItem>(query, ...sqlParams);
};

export const getBillListMonthSummariesAsync = async (
  db: SQLiteDatabase,
  params: BillListQueryParams,
): Promise<BillListMonthSummary[]> => {
  const { query: sourceQuery, sqlParams } = buildBillListQuery(params, { includeOrderBy: false });
  const rows = await db.getAllAsync<BillListMonthSummary>(
    `SELECT
        substr(source.created_at, 1, 7) as yearMonth,
        COUNT(*) as recordCount,
        IFNULL(SUM(CASE WHEN source.type = 'expense' THEN source.amount ELSE 0 END), 0) as expenseTotal
     FROM (${sourceQuery}) source
     GROUP BY substr(source.created_at, 1, 7)
     ORDER BY yearMonth DESC`,
    ...sqlParams,
  );

  return rows.map((row) => ({
    yearMonth: row.yearMonth,
    recordCount: Number(row.recordCount ?? 0),
    expenseTotal: Number(row.expenseTotal ?? 0),
  }));
};

export const getBillListPageAsync = async (
  db: SQLiteDatabase,
  params: BillListQueryParams & { limit: number; cursor?: BillListCursor | null },
): Promise<BillListPageResult> => {
  const pageSize = Math.max(1, params.limit);
  const { query, sqlParams } = buildBillListQuery(params, {
    cursor: params.cursor ?? undefined,
    limit: pageSize + 1,
  });

  const rows = await db.getAllAsync<RecordItem>(query, ...sqlParams);
  const hasMore = rows.length > pageSize;
  const records = hasMore ? rows.slice(0, pageSize) : rows;
  const lastRecord = records[records.length - 1];

  return {
    records,
    hasMore,
    nextCursor: hasMore && lastRecord ? { createdAt: lastRecord.created_at, id: lastRecord.id } : null,
  };
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

export const getBillListCategoryOptionsAsync = (db: SQLiteDatabase, ledgerId: number): Promise<BillListCategoryOption[]> => {
  return db.getAllAsync<BillListCategoryOption>(
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
    `SELECT r.*, ${RECORD_ICON_SELECT}
     FROM records r
     ${RECORD_CATEGORY_JOINS}
     WHERE r.id = ?`,
    id,
  );
};

export const getRecordNoteSuggestionsAsync = (
  db: SQLiteDatabase,
  ledgerId: number,
  type: 'expense' | 'income',
  keyword: string,
  limit: number = 10,
): Promise<RecordNoteSuggestion[]> => {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return Promise.resolve([]);
  }

  return db.getAllAsync<RecordNoteSuggestion>(
    `SELECT r.*, ${RECORD_ICON_SELECT}
     FROM records r
     ${RECORD_CATEGORY_JOINS}
     WHERE r.ledger_id = ?
       AND r.type = ?
       AND TRIM(IFNULL(r.note, '')) <> ''
       AND LOWER(r.note) LIKE ?
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT ?`,
    ledgerId,
    type,
    `%${normalizedKeyword}%`,
    limit,
  );
};

export const getDailySummaryByMonth = (db: SQLiteDatabase, ledgerId: number, year: string, month: string): { date: string; total_expense: number; total_income: number }[] => {
  const { start, end } = getMonthBounds(year, month);
  return db.getAllSync<{ date: string; total_expense: number; total_income: number }>(
    `SELECT substr(created_at, 1, 10) as date,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income
     FROM records
     WHERE ledger_id = ? AND created_at >= ? AND created_at < ?
     GROUP BY substr(created_at, 1, 10)`,
    ledgerId,
    start,
    end,
  );
};

export const getDailySummaryByMonthAsync = (
  db: SQLiteDatabase,
  ledgerId: number,
  year: string,
  month: string,
): Promise<{ date: string; total_expense: number; total_income: number }[]> => {
  const { start, end } = getMonthBounds(year, month);
  return db.getAllAsync<{ date: string; total_expense: number; total_income: number }>(
    `SELECT substr(created_at, 1, 10) as date,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income
     FROM records
     WHERE ledger_id = ? AND created_at >= ? AND created_at < ?
     GROUP BY substr(created_at, 1, 10)`,
    ledgerId,
    start,
    end,
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
      r.category,
      r.category_id,
      IFNULL(c.icon, 'Question') as icon,
      SUM(r.amount) as totalAmount,
      COUNT(*) as count
    FROM records r
    LEFT JOIN categories c ON r.category_id = c.id
    WHERE r.ledger_id = ? AND r.type = ?
  `;
  const params: any[] = [ledgerId, type];
  const { start, end } = getDateBounds(startDate, endDate);

  if (start) {
    query += ` AND r.created_at >= ?`;
    params.push(start);
  }

  if (end) {
    query += ` AND r.created_at < ?`;
    params.push(end);
  }

  query += ` GROUP BY r.category_id ORDER BY totalAmount DESC`;

  const rows = db.getAllSync<{ category: string; category_id: number; icon: string; totalAmount: number; count: number }>(query, ...params);

  const totalSum = rows.reduce((acc, row) => acc + row.totalAmount, 0);

  return rows.map((row) => ({
    ...row,
    percentage: totalSum > 0 ? (row.totalAmount / totalSum) * 100 : 0,
  }));
};

export const getCategoryStatsAsync = async (
  db: SQLiteDatabase,
  ledgerId: number,
  type: 'expense' | 'income',
  startDate?: string,
  endDate?: string,
): Promise<{ category: string; category_id: number; icon: string; totalAmount: number; count: number; percentage: number }[]> => {
  let query = `
    SELECT
      MAX(r.category) as category,
      r.category_id,
      IFNULL(c.icon, 'Question') as icon,
      SUM(r.amount) as totalAmount,
      COUNT(*) as count
    FROM records r
    LEFT JOIN categories c ON r.category_id = c.id
    WHERE r.ledger_id = ? AND r.type = ?
  `;
  const params: any[] = [ledgerId, type];
  const { start, end } = getDateBounds(startDate, endDate);

  if (start) {
    query += ` AND r.created_at >= ?`;
    params.push(start);
  }

  if (end) {
    query += ` AND r.created_at < ?`;
    params.push(end);
  }

  query += ` GROUP BY r.category_id ORDER BY totalAmount DESC`;

  const rows = await db.getAllAsync<{ category: string; category_id: number; icon: string; totalAmount: number; count: number }>(query, ...params);
  const totalSum = rows.reduce((acc, row) => acc + row.totalAmount, 0);

  return rows.map((row) => ({
    ...row,
    percentage: totalSum > 0 ? (row.totalAmount / totalSum) * 100 : 0,
  }));
};

export const getMonthlyExpenseTotalAsync = async (db: SQLiteDatabase, ledgerId: number, year: string, month: string): Promise<number> => {
  const { start, end } = getMonthBounds(year, month);
  const result = await db.getFirstAsync<{ total_expense: number | null }>(
    `SELECT IFNULL(SUM(amount), 0) as total_expense
     FROM records
     WHERE ledger_id = ? AND type = 'expense' AND created_at >= ? AND created_at < ?`,
    ledgerId,
    start,
    end,
  );

  return result?.total_expense ?? 0;
};

export const ensureLedgerSync = (db: SQLiteDatabase, name: string): number => {
  const existing = db.getFirstSync<Ledger>('SELECT * FROM ledgers WHERE name = ?', name);
  if (existing) {
    return existing.id;
  }
  return addLedger(db, name);
};

export const addRecord = (db: SQLiteDatabase, data: RecordInsertData) => {
  if (data.created_at) {
    const result = db.runSync(
      `INSERT INTO records (amount, type, category_id, sub_category_id, category, sub_category, note, ledger_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.amount,
      data.type,
      data.category_id,
      data.sub_category_id,
      data.category,
      data.sub_category,
      data.note,
      data.ledger_id,
      data.created_at,
    );
    return result.lastInsertRowId;
  } else {
    const result = db.runSync(
      `INSERT INTO records (amount, type, category_id, sub_category_id, category, sub_category, note, ledger_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      data.amount,
      data.type,
      data.category_id,
      data.sub_category_id,
      data.category,
      data.sub_category,
      data.note,
      data.ledger_id,
    );
    return result.lastInsertRowId;
  }
};

export const updateRecord = (db: SQLiteDatabase, id: number, data: RecordUpdateData) => {
  return db.runSync(
    `UPDATE records SET amount = ?, type = ?, category_id = ?, sub_category_id = ?, category = ?, sub_category = ?, note = ?, ledger_id = ?, created_at = ?
     WHERE id = ?`,
    data.amount,
    data.type,
    data.category_id,
    data.sub_category_id,
    data.category,
    data.sub_category,
    data.note,
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
