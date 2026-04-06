/**
 * 统一的时间处理工具
 * 所有日期操作都应使用此模块，确保时区处理一致
 */

/**
 * 将 Date 对象转换为 ISO 日期字符串 (YYYY-MM-DD)
 * 支持本地时区，不受时区偏差影响
 */
export const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 将 Date 对象转换为 ISO 日期时间字符串 (YYYY-MM-DD HH:MM:SS)
 */
export const formatDateTimeToISO = (date: Date): string => {
  const dateStr = formatDateToISO(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
};

/**
 * 将 Date 对象转换为年月字符串 (YYYY-MM)
 */
export const formatDateToYearMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * 从 ISO 日期字符串解析为 Date 对象
 * @param dateStr ISO 日期字符串 (YYYY-MM-DD 或 YYYY-MM-DD HH:MM:SS)
 */
export const parseISODate = (dateStr: string): Date | null => {
  try {
    const [datePart, timePart] = dateStr.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);

    if (!year || !month || !day) return null;

    const date = new Date();
    date.setFullYear(year, month - 1, day);

    if (timePart) {
      const [hours, minutes, seconds] = timePart.split(':').map(Number);
      date.setHours(hours || 0, minutes || 0, seconds || 0, 0);
    } else {
      date.setHours(0, 0, 0, 0);
    }

    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

/**
 * 获取今天的 ISO 日期字符串
 */
export const getTodayISO = (): string => {
  return formatDateToISO(new Date());
};

/**
 * 获取当前月的 YYYY-MM 字符串
 */
export const getCurrentYearMonth = (): string => {
  return formatDateToYearMonth(new Date());
};

/**
 * 从 Date 提取年月日的元组 (year, month, day)
 * month 是 1-12 的数字，而不是 0-11
 */
export const getDateComponents = (date: Date): [number, number, number] => {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
};

/**
 * 解析 YYYY-MM 字符串为 [year, month]
 */
export const parseYearMonth = (yearMonth: string): [number, number] | null => {
  try {
    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    if (year < 1900 || year > 2100 || month < 1 || month > 12) {
      return null;
    }

    return [year, month];
  } catch {
    return null;
  }
};

/**
 * 解析 YYYY-MM-DD 字符串为 [year, month, day]
 */
export const parseDate = (dateStr: string): [number, number, number] | null => {
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const day = parseInt(dayStr);

    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    return [year, month, day];
  } catch {
    return null;
  }
};

/**
 * 计算两个日期之间的天数差
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 天数（date2 - date1）
 */
export const daysDifference = (date1: Date, date2: Date): number => {
  const time1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate()).getTime();
  const time2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate()).getTime();
  return Math.floor((time2 - time1) / (1000 * 60 * 60 * 24));
};

/**
 * 获取某个月的最后一天
 */
export const getLastDayOfMonth = (year: number, month: number): number => {
  const date = new Date(year, month, 0);
  return date.getDate();
};

/**
 * 获取某个月的第一天和最后一天 (ISO 日期格式)
 */
export const getMonthRange = (year: number, month: number): [string, string] => {
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = getLastDayOfMonth(year, month);
  const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return [firstDay, lastDayStr];
};

/**
 * 格式化显示用的日期字符串
 * @param dateStr ISO 日期字符串
 * @param format 格式选项：'short' (M月D日) | 'full' (YYYY年M月D日)
 */
export const formatDateForDisplay = (dateStr: string, format: 'short' | 'full' = 'short'): string => {
  const parsed = parseDate(dateStr);
  if (!parsed) return dateStr;

  const [year, month, day] = parsed;

  if (format === 'short') {
    return `${month}月${day}日`;
  } else {
    return `${year}年${month}月${day}日`;
  }
};

/**
 * 格式化显示用的年月字符串
 */
export const formatYearMonthForDisplay = (yearMonth: string): string => {
  const parsed = parseYearMonth(yearMonth);
  if (!parsed) return yearMonth;

  const [year, month] = parsed;
  return `${year}年${month}月`;
};

/**
 * 获取 ISO 日期对应的年月字符串
 */
export const getYearMonthFromDate = (dateStr: string): string | null => {
  const parsed = parseDate(dateStr);
  if (!parsed) return null;

  const [year, month] = parsed;
  return `${year}-${String(month).padStart(2, '0')}`;
};

/**
 * 比较两个日期是否相同（只比较年月日）
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
};

/**
 * 检查日期是否在某个范围内
 */
export const isDateInRange = (date: string, startDate: string, endDate: string): boolean => {
  return date >= startDate && date <= endDate;
};

/**
 * 获取最近 N 天的日期范围
 * @param days 天数
 */
export const getRecentDateRange = (days: number): [string, string] => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  return [formatDateToISO(startDate), formatDateToISO(endDate)];
};

/**
 * 获取本月的日期范围
 */
export const getThisMonthRange = (): [string, string] => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  return getMonthRange(year, month);
};

/**
 * 获取上个月的日期范围
 */
export const getLastMonthRange = (): [string, string] => {
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth(); // 已经是 0-11

  if (month === 0) {
    year -= 1;
    month = 12;
  }

  return getMonthRange(year, month);
};

/**
 * 获取本年的日期范围
 */
export const getThisYearRange = (): [string, string] => {
  const year = new Date().getFullYear();
  return [`${year}-01-01`, `${year}-12-31`];
};

/**
 * 时间段预设选项
 */
export const TIME_PRESETS = {
  LAST_7_DAYS: { label: '近 7 天', value: () => getRecentDateRange(7) },
  LAST_30_DAYS: { label: '近 30 天', value: () => getRecentDateRange(30) },
  THIS_MONTH: { label: '本月', value: () => getThisMonthRange() },
  LAST_MONTH: { label: '上月', value: () => getLastMonthRange() },
  THIS_YEAR: { label: '本年', value: () => getThisYearRange() },
} as const;
