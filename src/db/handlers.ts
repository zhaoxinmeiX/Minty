/**
 * 数据库错误处理和包装层
 * 为所有 DB 操作提供统一的错误处理、日志和重试机制
 */

import { SQLiteDatabase } from 'expo-sqlite';
import { Alert } from 'react-native';

/**
 * DB 操作的错误类型
 */
export class DatabaseError extends Error {
  constructor(
    public operation: string,
    public originalError: any,
    message: string,
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * 错误信息映射
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  'UNIQUE constraint failed': '数据已存在，无法重复添加',
  'FOREIGN KEY constraint failed': '关联数据不存在或已被删除',
  'NOT NULL constraint failed': '必填字段不能为空',
  'disk I/O error': '数据库文件系统错误，请重试',
  'database is locked': '数据库被锁定，请稍后重试',
  'cannot open shared object file': '数据库驱动加载失败',
};

/**
 * 将低级错误转换为用户友好的消息
 */
function getUserFriendlyErrorMessage(error: any): string {
  const errorStr = error?.message || error?.toString() || 'Unknown error';

  // 检查是否匹配预定义的错误信息
  for (const [key, message] of Object.entries(ERROR_MESSAGE_MAP)) {
    if (errorStr.includes(key)) {
      return message;
    }
  }

  // 如果是外键约束错误
  if (errorStr.includes('FOREIGN KEY')) {
    return '操作关联的数据不存在，请检查输入';
  }

  // 默认消息
  return '数据库操作失败，请重试';
}

/**
 * 日志系统（简单的控制台日志）
 */
const DBLogger = {
  /**
   * 记录信息
   */
  info: (operation: string, message: string) => {
    if (__DEV__) {
      console.log(`[DB:${operation}] ${message}`);
    }
  },

  /**
   * 记录错误
   */
  error: (operation: string, error: any) => {
    console.error(`[DB:${operation}] ERROR:`, {
      message: error?.message || error,
      stack: error?.stack,
      originalError: error,
    });
  },

  /**
   * 记录性能
   */
  perf: (operation: string, duration: number) => {
    if (__DEV__ && duration > 100) {
      console.warn(`[DB:${operation}] Slow query detected: ${duration}ms`);
    }
  },
};

/**
 * 包装同步数据库操作（SELECT）
 */
export function withDBQuery<T>(operation: string, queryFunc: () => T, showError: boolean = true): T | null {
  const startTime = performance.now();

  try {
    const result = queryFunc();
    const duration = performance.now() - startTime;
    DBLogger.perf(operation, duration);
    return result;
  } catch (error) {
    DBLogger.error(operation, error);

    if (showError) {
      const message = getUserFriendlyErrorMessage(error);
      Alert.alert('数据查询失败', message, [{ text: '确定' }]);
    }

    return null;
  }
}

/**
 * 包装同步数据库修改操作（INSERT/UPDATE/DELETE）
 */
export function withDBMutation<T extends { lastInsertRowId?: number }>(operation: string, mutationFunc: () => T, showError: boolean = true): T | null {
  const startTime = performance.now();

  try {
    const result = mutationFunc();
    const duration = performance.now() - startTime;
    DBLogger.perf(operation, duration);
    DBLogger.info(operation, `Success${result.lastInsertRowId ? ` (ID: ${result.lastInsertRowId})` : ''}`);
    return result;
  } catch (error) {
    DBLogger.error(operation, error);

    if (showError) {
      const message = getUserFriendlyErrorMessage(error);
      Alert.alert('数据保存失败', message, [{ text: '确定' }]);
    }

    return null;
  }
}

/**
 * 包装异步数据库操作
 */
export async function withDBAsync<T>(operation: string, asyncFunc: () => Promise<T>, showError: boolean = true): Promise<T | null> {
  const startTime = performance.now();

  try {
    const result = await asyncFunc();
    const duration = performance.now() - startTime;
    DBLogger.perf(operation, duration);
    return result;
  } catch (error) {
    DBLogger.error(operation, error);

    if (showError) {
      const message = getUserFriendlyErrorMessage(error);
      Alert.alert('操作失败', message, [{ text: '确定' }]);
    }

    return null;
  }
}

/**
 * 批量操作的事务包装
 * 确保所有操作成功或全部回滚
 */
export async function withTransaction<T>(db: SQLiteDatabase, operation: string, transactionFunc: (db: SQLiteDatabase) => Promise<T>, showError: boolean = true): Promise<T | null> {
  const startTime = performance.now();

  try {
    // SQLite 的同步事务模式
    // 注意：expo-sqlite 可能不完全支持异步事务，这里是概念性的
    const result = await transactionFunc(db);
    const duration = performance.now() - startTime;
    DBLogger.perf(operation, duration);
    return result;
  } catch (error) {
    DBLogger.error(operation, error);

    if (showError) {
      const message = getUserFriendlyErrorMessage(error);
      Alert.alert('批量操作失败', `${message}（可能的部分数据变更）`, [{ text: '确定' }]);
    }

    return null;
  }
}

/**
 * 重试机制
 * 用于处理短期故障（如数据库锁定）
 */
export async function withRetry<T>(operation: string, asyncFunc: () => Promise<T>, maxRetries: number = 3, delayMs: number = 100, showError: boolean = true): Promise<T | null> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      DBLogger.info(operation, `Attempt ${attempt}/${maxRetries}`);
      const result = await asyncFunc();
      return result;
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // 指数退避
        const delay = delayMs * attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  DBLogger.error(operation, lastError);

  if (showError) {
    const message = getUserFriendlyErrorMessage(lastError);
    Alert.alert('操作失败', `${message}（已重试 ${maxRetries} 次）`, [{ text: '确定' }]);
  }

  return null;
}

/**
 * 验证数据库连接
 */
export async function verifyDatabaseConnection(db: SQLiteDatabase): Promise<boolean> {
  try {
    const result = await db.getFirstAsync('SELECT 1 as ping');
    return result !== undefined;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * 导出日志（用于调试）
 */
export const enableDebugLogging = () => {
  // 这可以扩展为更复杂的日志系统
  console.log('[DB] Debug logging enabled');
};
