/**
 * 周期性日期生成工具
 * 根据频率规则生成日期列表，用于批量创建周期账单
 */

export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export type RecurringRule = {
  startDate: Date;
  endDate: Date;
  frequency: RecurringFrequency;
  /** 0=周日, 1=周一, ..., 6=周六 (用于 weekly / biweekly) */
  dayOfWeek?: number;
  /** 1-31 (用于 monthly) */
  dayOfMonth?: number;
};

/**
 * 根据规则计算所有匹配的日期
 * 返回的日期时间固定为 12:00:00（中午），避免 DST 边界问题
 */
export function generateRecurringDates(rule: RecurringRule): Date[] {
  const { startDate, endDate, frequency } = rule;

  if (startDate > endDate) {
    return [];
  }

  switch (frequency) {
    case 'daily':
      return generateDailyDates(startDate, endDate);
    case 'weekly':
      return generateWeeklyDates(startDate, endDate, rule.dayOfWeek ?? startDate.getDay());
    case 'biweekly':
      return generateBiweeklyDates(startDate, endDate, rule.dayOfWeek ?? startDate.getDay());
    case 'monthly':
      return generateMonthlyDates(startDate, endDate, rule.dayOfMonth ?? startDate.getDate());
    default:
      return [];
  }
}

/** 创建一个干净的本地日期（中午 12:00，避免 DST 问题） */
function makeLocalNoon(year: number, month: number, day: number): Date {
  return new Date(year, month, day, 12, 0, 0, 0);
}

/** 比较两个日期的年月日（忽略时间） */
function dateOnlyValue(d: Date): number {
  return d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
}

function generateDailyDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = makeLocalNoon(start.getFullYear(), start.getMonth(), start.getDate());
  const endValue = dateOnlyValue(end);

  while (dateOnlyValue(current) <= endValue) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function generateWeeklyDates(start: Date, end: Date, targetDay: number): Date[] {
  const dates: Date[] = [];
  // 从 startDate 开始，找到第一个目标星期几
  const current = makeLocalNoon(start.getFullYear(), start.getMonth(), start.getDate());
  const endValue = dateOnlyValue(end);

  // 调整到第一个目标星期几
  const daysUntilTarget = (targetDay - current.getDay() + 7) % 7;
  current.setDate(current.getDate() + daysUntilTarget);

  while (dateOnlyValue(current) <= endValue) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }

  return dates;
}

function generateBiweeklyDates(start: Date, end: Date, targetDay: number): Date[] {
  const dates: Date[] = [];
  const current = makeLocalNoon(start.getFullYear(), start.getMonth(), start.getDate());
  const endValue = dateOnlyValue(end);

  // 调整到第一个目标星期几
  const daysUntilTarget = (targetDay - current.getDay() + 7) % 7;
  current.setDate(current.getDate() + daysUntilTarget);

  while (dateOnlyValue(current) <= endValue) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 14);
  }

  return dates;
}

function generateMonthlyDates(start: Date, end: Date, targetDay: number): Date[] {
  const dates: Date[] = [];
  const endValue = dateOnlyValue(end);

  let year = start.getFullYear();
  let month = start.getMonth();

  // 最多循环 200 个月（~17年），安全上限
  for (let i = 0; i < 200; i++) {
    // 处理大月小月：如目标是31号，但当月只有30天，则用当月最后一天
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const actualDay = Math.min(targetDay, daysInMonth);
    const candidate = makeLocalNoon(year, month, actualDay);

    if (dateOnlyValue(candidate) >= dateOnlyValue(start) && dateOnlyValue(candidate) <= endValue) {
      dates.push(candidate);
    }

    // 如果已经超过结束日期了，可以提前退出
    if (dateOnlyValue(candidate) > endValue) {
      break;
    }

    // 前进一个月
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return dates;
}

/** 获取频率的中文标签 */
export function getFrequencyLabel(frequency: RecurringFrequency): string {
  switch (frequency) {
    case 'daily':
      return '每天';
    case 'weekly':
      return '每周';
    case 'biweekly':
      return '每两周';
    case 'monthly':
      return '每月';
  }
}

/** 周几名称 */
export const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
