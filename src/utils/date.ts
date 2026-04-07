/**
 * 统一的时间处理工具
 * 所有日期操作都应使用此模块，确保时区处理一致
 */

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

/**
 * 将 Date 对象转换为 ISO 日期字符串 (YYYY-MM-DD)
 * 支持本地时区，不受时区偏差影响
 */
export const formatDateToISO = (date: Date): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

/**
 * 将 Date 对象转换为 ISO 日期时间字符串 (YYYY-MM-DD HH:MM:SS)
 */
export const formatDateTimeToISO = (date: Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * 将 Date 对象转换为年月字符串 (YYYY-MM)
 */
export const formatDateToYearMonth = (date: Date): string => {
  return dayjs(date).format('YYYY-MM');
};

/**
 * 从 ISO 日期字符串解析为 Date 对象
 * @param dateStr ISO 日期字符串 (YYYY-MM-DD 或 YYYY-MM-DD HH:MM:SS)
 */
export const parseISODate = (dateStr: string): Date | null => {
  const withTime = dayjs(dateStr, 'YYYY-MM-DD HH:mm:ss', true);
  if (withTime.isValid()) return withTime.toDate();

  const onlyDate = dayjs(dateStr, 'YYYY-MM-DD', true);
  if (onlyDate.isValid()) return onlyDate.toDate();

  return null;
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
  const d = dayjs(date);
  return [d.year(), d.month() + 1, d.date()];
};

/**
 * 解析 YYYY-MM 字符串为 [year, month]
 */
export const parseYearMonth = (yearMonth: string): [number, number] | null => {
  const parsed = dayjs(yearMonth, 'YYYY-MM', true);
  if (!parsed.isValid()) return null;

  const year = parsed.year();
  const month = parsed.month() + 1;
  if (year < 1900 || year > 2100 || month < 1 || month > 12) return null;

  return [year, month];
};

/**
 * 解析 YYYY-MM-DD 字符串为 [year, month, day]
 */
export const parseDate = (dateStr: string): [number, number, number] | null => {
  const parsed = dayjs(dateStr, 'YYYY-MM-DD', true);
  if (!parsed.isValid()) return null;

  const year = parsed.year();
  const month = parsed.month() + 1;
  const day = parsed.date();
  if (year < 1900 || year > 2100) return null;

  return [year, month, day];
};

/**
 * 计算两个日期之间的天数差
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 天数（date2 - date1）
 */
export const daysDifference = (date1: Date, date2: Date): number => {
  return dayjs(date2).startOf('day').diff(dayjs(date1).startOf('day'), 'day');
};

/**
 * 获取某个月的最后一天
 */
export const getLastDayOfMonth = (year: number, month: number): number => {
  return dayjs(`${year}-${String(month).padStart(2, '0')}-01`, 'YYYY-MM-DD', true).daysInMonth();
};

/**
 * 获取某个月的第一天和最后一天 (ISO 日期格式)
 */
export const getMonthRange = (year: number, month: number): [string, string] => {
  const monthStart = dayjs(`${year}-${String(month).padStart(2, '0')}-01`, 'YYYY-MM-DD', true);
  return [monthStart.format('YYYY-MM-DD'), monthStart.endOf('month').format('YYYY-MM-DD')];
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
  return dayjs(date1).isSame(dayjs(date2), 'day');
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
  const endDate = dayjs();
  const startDate = endDate.subtract(days, 'day');
  return [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')];
};

/**
 * 获取本月的日期范围
 */
export const getThisMonthRange = (): [string, string] => {
  const today = dayjs();
  return [today.startOf('month').format('YYYY-MM-DD'), today.endOf('month').format('YYYY-MM-DD')];
};

/**
 * 获取上个月的日期范围
 */
export const getLastMonthRange = (): [string, string] => {
  const lastMonth = dayjs().subtract(1, 'month');
  return [lastMonth.startOf('month').format('YYYY-MM-DD'), lastMonth.endOf('month').format('YYYY-MM-DD')];
};

/**
 * 获取本年的日期范围
 */
export const getThisYearRange = (): [string, string] => {
  const now = dayjs();
  return [now.startOf('year').format('YYYY-MM-DD'), now.endOf('year').format('YYYY-MM-DD')];
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
