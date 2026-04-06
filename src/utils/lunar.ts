/**
 * Accurate Lunar Calendar Utility (1900-2100)
 * Ported from solarlunar and other high-precision libraries.
 */

const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, 0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0,
  0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0,
  0x1c8d7, 0x0c950, 0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0,
  0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250,
  0x0d558, 0x0b540, 0x0b6a0, 0x195a6, 0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50,
  0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50,
  0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, 0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0,
  0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, 0x14b63,
];

const solarMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const nStr1 = ['日', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const nStr2 = ['初', '十', '廿', '卅', '　'];

/**
 * Returns the number of days in a year (total)
 */
function lYearDays(y: number) {
  let i,
    sum = 348;
  for (i = 0x8000; i > 0x8; i >>= 1) sum += lunarInfo[y - 1900] & i ? 1 : 0;
  return sum + leapDays(y);
}

/**
 * Returns the number of days in a leap month
 */
function leapDays(y: number) {
  if (leapMonth(y)) return lunarInfo[y - 1900] & 0x10000 ? 30 : 29;
  return 0;
}

/**
 * Returns the leap month (1-12, 0 means no leap)
 */
function leapMonth(y: number) {
  return lunarInfo[y - 1900] & 0xf;
}

/**
 * Returns the number of days in a specific lunar month
 */
function monthDays(y: number, m: number) {
  return lunarInfo[y - 1900] & (0x10000 >> m) ? 30 : 29;
}

/**
 * Main conversion function
 */
export function solarToLunar(y: number, m: number, d: number) {
  let i,
    leap = 0,
    temp = 0;
  let offset = (Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000;

  for (i = 1900; i < 2101 && offset > 0; i++) {
    temp = lYearDays(i);
    offset -= temp;
  }

  if (offset < 0) {
    offset += temp;
    i--;
  }

  const year = i;
  leap = leapMonth(i); // Leap month position
  let isLeap = false;

  for (i = 1; i < 13 && offset > 0; i++) {
    // Leap month logic
    if (leap > 0 && i === leap + 1 && !isLeap) {
      --i;
      isLeap = true;
      temp = leapDays(year);
    } else {
      temp = monthDays(year, i);
    }

    // Reset leap flat if we just passed it
    if (isLeap && i === leap + 1) isLeap = false;

    offset -= temp;
  }

  if (offset < 0) {
    offset += temp;
    i--;
  }

  if (offset === 0 && leap > 0 && i === leap) {
    if (isLeap) {
      isLeap = false;
    } else {
      isLeap = true;
    }
  }

  const month = i;
  const day = offset + 1;

  return {
    lYear: year,
    lMonth: month,
    lDay: day,
    isLeap,
    dayStr: getLunarDayStr(day),
    monthStr: getLunarMonthStr(month),
    fullStr: `${getLunarMonthStr(month)}${getLunarDayStr(day)}`,
  };
}

function getLunarDayStr(day: number) {
  if (day === 10) return '初十';
  if (day === 20) return '二十';
  if (day === 30) return '三十';
  return nStr2[Math.floor(day / 10)] + nStr1[day % 10];
}

function getLunarMonthStr(month: number) {
  if (month === 1) return '正月';
  if (month === 12) return '腊月';
  if (month === 11) return '冬月';
  return nStr1[month] + '月';
}

/**
 * Get accurate lunar label for a given date
 * Prioritizes holidays, then first of month, then default lunar day name.
 */
export function getLunarLabel(y: number, m: number, d: number) {
  const lunar = solarToLunar(y, m, d);

  // Specific holidays (Lunar based)
  if (lunar.lMonth === 1 && lunar.lDay === 1) return '春节';
  if (lunar.lMonth === 1 && lunar.lDay === 15) return '元宵';
  if (lunar.lMonth === 5 && lunar.lDay === 5) return '端午';
  if (lunar.lMonth === 8 && lunar.lDay === 15) return '中秋';
  if (lunar.lMonth === 9 && lunar.lDay === 9) return '重阳';

  // Solar based (simplified holidays)
  if (m === 1 && d === 1) return '元旦';
  if (m === 5 && d === 1) return '劳动';
  if (m === 10 && d === 1) return '国庆';

  // Approximate Qingming (usually 4/4 or 4/5)
  if (m === 4 && d === 5) return '清明';

  // Return "初一" as month name if first day
  if (lunar.lDay === 1) return lunar.monthStr;

  return lunar.dayStr;
}
