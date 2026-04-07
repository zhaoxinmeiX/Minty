import solarLunar, { SolarLunarResult } from 'solarlunar';

const lunarLabelCache = new Map<string, string>();

interface LunarSummary {
  lYear: number;
  lMonth: number;
  lDay: number;
  isLeap: boolean;
  dayStr: string;
  monthStr: string;
  fullStr: string;
}

function getSolarLunarResult(y: number, m: number, d: number): SolarLunarResult | null {
  const result = solarLunar.solar2lunar(y, m, d);
  return result === -1 ? null : result;
}

function normalizeFestivalLabel(name: string) {
  if (!name) return '';
  return name;
}

export function solarToLunar(y: number, m: number, d: number): LunarSummary {
  const lunar = getSolarLunarResult(y, m, d);
  if (!lunar) {
    return {
      lYear: y,
      lMonth: m,
      lDay: d,
      isLeap: false,
      dayStr: '',
      monthStr: '',
      fullStr: '',
    };
  }

  return {
    lYear: lunar.lYear,
    lMonth: lunar.lMonth,
    lDay: lunar.lDay,
    isLeap: lunar.isLeap,
    dayStr: lunar.dayCn,
    monthStr: lunar.monthCn,
    fullStr: `${lunar.monthCn}${lunar.dayCn}`,
  };
}

/**
 * Get accurate lunar label for a given date
 * Prioritizes holidays, then first of month, then default lunar day name.
 */
export function getLunarLabel(y: number, m: number, d: number) {
  const cacheKey = `${y}-${m}-${d}`;
  const cached = lunarLabelCache.get(cacheKey);
  if (cached) return cached;

  const lunar = getSolarLunarResult(y, m, d);
  if (!lunar) return '';

  let label = '';
  const festivals = solarLunar.getFestivals(y, m, d);
  if (festivals.length > 0) {
    label = normalizeFestivalLabel(festivals[0]);
  } else if (lunar.isTerm && lunar.term) {
    label = normalizeFestivalLabel(lunar.term);
  } else if (lunar.lDay === 1) {
    label = lunar.monthCn;
  } else {
    label = lunar.dayCn;
  }

  lunarLabelCache.set(cacheKey, label);
  return label;
}
