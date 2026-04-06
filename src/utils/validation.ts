/**
 * 数据验证工具层
 * 所有用户输入和数据库操作前都应通过此层验证
 */

import { Category, Ledger, RecordItem } from '@/src/db/schema';
import { Alert } from 'react-native';

/**
 * 验证结果类型
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  message?: string;
}

/**
 * 验证单个金额
 * @param amount 金额值
 * @param allowZero 是否允许为 0（默认 false）
 * @returns 验证结果
 */
export const validateAmount = (amount: number | string, allowZero: boolean = false): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!amount && amount !== 0) {
    errors.amount = '金额不能为空';
    return { isValid: false, errors };
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    errors.amount = '金额必须为有效数字';
  } else if (numAmount < 0) {
    errors.amount = '金额不能为负数';
  } else if (numAmount === 0 && !allowZero) {
    errors.amount = '金额必须大于 0';
  } else if (!isFinite(numAmount)) {
    errors.amount = '金额超出范围';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * 验证账单数据
 */
export const validateRecord = (
  data: Partial<Omit<RecordItem, 'id' | 'created_at' | 'icon'>> & {
    created_at?: string;
  },
): ValidationResult => {
  const errors: Record<string, string> = {};

  // 验证金额
  if (!data.amount && data.amount !== 0) {
    errors.amount = '金额不能为空';
  } else if (data.amount < 0) {
    errors.amount = '金额不能为负数';
  } else if (data.amount === 0) {
    errors.amount = '金额必须大于 0';
  }

  // 验证类型
  if (!data.type) {
    errors.type = '必须选择收入或支出';
  } else if (!['expense', 'income'].includes(data.type)) {
    errors.type = '无效的账单类型';
  }

  // 验证分类
  if (!data.category_id) {
    errors.category_id = '必须选择分类';
  } else if (!Number.isInteger(data.category_id) || data.category_id <= 0) {
    errors.category_id = '分类 ID 无效';
  }

  // 验证账本
  if (!data.ledger_id) {
    errors.ledger_id = '必须选择账本';
  } else if (!Number.isInteger(data.ledger_id) || data.ledger_id <= 0) {
    errors.ledger_id = '账本 ID 无效';
  }

  // 验证分类名称
  if (!data.category) {
    errors.category = '分类名称不能为空';
  } else if (typeof data.category !== 'string' || data.category.trim() === '') {
    errors.category = '分类名称无效';
  }

  // 验证日期
  if (data.created_at) {
    if (typeof data.created_at !== 'string') {
      errors.created_at = '日期格式无效';
    } else {
      const date = new Date(data.created_at);
      if (isNaN(date.getTime())) {
        errors.created_at = '日期格式无效';
      }
    }
  }

  // 验证可选字段
  if (data.sub_category_id !== null && data.sub_category_id !== undefined) {
    if (!Number.isInteger(data.sub_category_id) || data.sub_category_id <= 0) {
      errors.sub_category_id = '二级分类 ID 无效';
    }
  }

  // 验证备注（可选，但如果存在需要检查类型）
  if (data.note !== null && data.note !== undefined) {
    if (typeof data.note !== 'string' || data.note.length > 500) {
      errors.note = '备注过长（最多 500 字符）';
    }
  }

  // 验证成员（可选）
  if (data.member !== null && data.member !== undefined) {
    if (typeof data.member !== 'string' || data.member.length > 100) {
      errors.member = '成员名称过长（最多 100 字符）';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * 验证分类数据
 */
export const validateCategory = (data: Partial<Omit<Category, 'id'>>): ValidationResult => {
  const errors: Record<string, string> = {};

  // 验证名称
  if (!data.name) {
    errors.name = '分类名称不能为空';
  } else if (typeof data.name !== 'string') {
    errors.name = '分类名称必须为文本';
  } else if (data.name.trim() === '' || data.name.length > 50) {
    errors.name = '分类名称长度不合法（1-50 字符）';
  }

  // 验证图标
  if (!data.icon) {
    errors.icon = '必须选择图标';
  } else if (typeof data.icon !== 'string' || data.icon.length > 50) {
    errors.icon = '图标名称无效';
  }

  // 验证类型
  if (!data.type) {
    errors.type = '必须选择分类类型';
  } else if (!['expense', 'income'].includes(data.type)) {
    errors.type = '无效的分类类型';
  }

  // 验证父分类 ID
  if (data.parent_id !== null && data.parent_id !== undefined) {
    if (!Number.isInteger(data.parent_id) || data.parent_id <= 0) {
      errors.parent_id = '母分类 ID 无效';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * 验证账本数据
 */
export const validateLedger = (data: Partial<Omit<Ledger, 'id' | 'created_at'>>): ValidationResult => {
  const errors: Record<string, string> = {};

  // 验证账本名称
  if (!data.name) {
    errors.name = '账本名称不能为空';
  } else if (typeof data.name !== 'string') {
    errors.name = '账本名称必须为文本';
  } else if (data.name.trim() === '' || data.name.length > 100) {
    errors.name = '账本名称长度不合法（1-100 字符）';
  }

  // 验证货币代码
  if (data.currency) {
    if (typeof data.currency !== 'string' || !/^[A-Z]{3}$/.test(data.currency)) {
      errors.currency = '货币代码必须为 3 个大写字母（如 NZD）';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * 验证日期范围
 */
export const validateDateRange = (startDate: string | Date, endDate: string | Date): ValidationResult => {
  const errors: Record<string, string> = {};

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (isNaN(start.getTime())) {
    errors.startDate = '开始日期无效';
  }

  if (isNaN(end.getTime())) {
    errors.endDate = '结束日期无效';
  }

  if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
    errors.dateRange = '开始日期不能晚于结束日期';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * 验证年月格式 (YYYY-MM)
 */
export const validateYearMonth = (yearMonth: string): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    errors.yearMonth = '年月格式无效（应为 YYYY-MM）';
  } else {
    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    if (year < 1900 || year > 2100) {
      errors.year = '年份应在 1900-2100 之间';
    }

    if (month < 1 || month > 12) {
      errors.month = '月份应在 01-12 之间';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * 验证日期格式 (YYYY-MM-DD)
 */
export const validateDate = (date: string): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.date = '日期格式无效（应为 YYYY-MM-DD）';
  } else {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      errors.date = '日期无效';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * 验证数字输入（用于计算器）
 */
export const validateNumberInput = (input: string): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!input) {
    errors.input = '输入不能为空';
    return { isValid: false, errors };
  }

  // 检查是否包含非法字符
  // 允许的字符：数字、算术符号、括号、小数点
  if (!/^[0-9+\-×÷().\s]*$/.test(input)) {
    errors.input = '输入包含非法字符';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * 生成友好的错误提示文本
 */
export const formatValidationErrors = (errors: Record<string, string>): string => {
  const messages = Object.values(errors);
  return messages.length > 0 ? messages.join('；') : '数据验证失败';
};

/**
 * 向用户展示验证错误（使用 Alert）
 */
export const showValidationError = (errors: Record<string, string>, title: string = '输入错误'): void => {
  const message = formatValidationErrors(errors);
  Alert.alert(title, message, [{ text: '确定', style: 'default' }]);
};

/**
 * 快速验证函数（返回是否通过，并自动显示错误）
 */
export const validateAndAlert = (result: ValidationResult, title: string = '输入错误'): boolean => {
  if (!result.isValid) {
    showValidationError(result.errors, title);
    return false;
  }
  return true;
};
