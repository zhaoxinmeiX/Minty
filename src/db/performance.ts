/**
 * 性能优化的数据库操作
 * 这些函数返回聚合统计数据，避免在应用层重复计算
 */

import { SQLiteDatabase } from 'expo-sqlite';

/**
 * 获取某个账本的收支统计
 * 直接在 SQL 层计算总和，而不是在应用层遍历
 */
export const getLedgerSummary = (db: SQLiteDatabase, ledgerId: number): { totalExpense: number; totalIncome: number; recordCount: number } => {
  try {
    const result = db.getFirstSync<{
      totalExpense: number;
      totalIncome: number;
      recordCount: number;
    }>(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
        COUNT(*) as recordCount
       FROM records
       WHERE ledger_id = ?`,
      ledgerId,
    );

    return result || { totalExpense: 0, totalIncome: 0, recordCount: 0 };
  } catch (error) {
    console.error('Error getting ledger summary:', error);
    return { totalExpense: 0, totalIncome: 0, recordCount: 0 };
  }
};

/**
 * 获取某个月的收支统计
 */
export const getMonthSummary = (db: SQLiteDatabase, ledgerId: number, year: number, month: number): { totalExpense: number; totalIncome: number; recordCount: number } => {
  try {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const likePattern = `${monthStr}-%`;

    const result = db.getFirstSync<{
      totalExpense: number;
      totalIncome: number;
      recordCount: number;
    }>(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
        COUNT(*) as recordCount
       FROM records
       WHERE ledger_id = ? AND date(created_at) LIKE ?`,
      ledgerId,
      likePattern,
    );

    return result || { totalExpense: 0, totalIncome: 0, recordCount: 0 };
  } catch (error) {
    console.error('Error getting month summary:', error);
    return { totalExpense: 0, totalIncome: 0, recordCount: 0 };
  }
};

/**
 * 获取某个日期的收支统计
 */
export const getDaySummary = (db: SQLiteDatabase, ledgerId: number, dateStr: string): { totalExpense: number; totalIncome: number; recordCount: number } => {
  try {
    const result = db.getFirstSync<{
      totalExpense: number;
      totalIncome: number;
      recordCount: number;
    }>(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
        COUNT(*) as recordCount
       FROM records
       WHERE ledger_id = ? AND date(created_at) = ?`,
      ledgerId,
      dateStr,
    );

    return result || { totalExpense: 0, totalIncome: 0, recordCount: 0 };
  } catch (error) {
    console.error('Error getting day summary:', error);
    return { totalExpense: 0, totalIncome: 0, recordCount: 0 };
  }
};


/**
 * 获取时间范围内的收支统计
 */
export const getDateRangeSummary = (
  db: SQLiteDatabase,
  ledgerId: number,
  startDate: string,
  endDate: string,
): { totalExpense: number; totalIncome: number; recordCount: number } => {
  try {
    const result = db.getFirstSync<{
      totalExpense: number;
      totalIncome: number;
      recordCount: number;
    }>(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
        COUNT(*) as recordCount
       FROM records
       WHERE ledger_id = ? AND date(created_at) BETWEEN ? AND ?`,
      ledgerId,
      startDate,
      endDate,
    );

    return result || { totalExpense: 0, totalIncome: 0, recordCount: 0 };
  } catch (error) {
    console.error('Error getting date range summary:', error);
    return { totalExpense: 0, totalIncome: 0, recordCount: 0 };
  }
};

/**
 * 获取最近 N 条记录（用于分页）
 */
export const getRecentRecords = (db: SQLiteDatabase, ledgerId: number, limit: number = 50): any[] => {
  try {
    return db.getAllSync(
      `SELECT r.*, COALESCE(sc.icon, c.icon, 'LayoutGrid') as icon
       FROM records r
       LEFT JOIN categories c ON r.category_id = c.id
       LEFT JOIN categories sc ON r.sub_category_id = sc.id
       WHERE r.ledger_id = ?
       ORDER BY r.created_at DESC
       LIMIT ?`,
      ledgerId,
      limit,
    );
  } catch (error) {
    console.error('Error getting recent records:', error);
    return [];
  }
};

/**
 * 检查数据库大小
 */
export const getDatabaseStats = (db: SQLiteDatabase): { recordCount: number; categoryCount: number; ledgerCount: number } => {
  try {
    const recordCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM records')?.count || 0;

    const categoryCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories')?.count || 0;

    const ledgerCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM ledgers')?.count || 0;

    return { recordCount, categoryCount, ledgerCount };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { recordCount: 0, categoryCount: 0, ledgerCount: 0 };
  }
};
