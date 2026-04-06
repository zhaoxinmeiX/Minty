const isValidType = (value: string): value is 'all' | 'expense' | 'income' => value === 'all' || value === 'expense' || value === 'income';

export const normalizeBillType = (value?: string) => (value && isValidType(value) ? value : 'all');

export const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime());
};

export const parseNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
};

export const getMonthRange = (month: string) => {
  const [year, monthPart] = month.split('-');
  const monthIndex = Number(monthPart);
  const lastDay = new Date(Number(year), monthIndex, 0).getDate();

  return {
    startDate: `${year}-${monthPart}-01`,
    endDate: `${year}-${monthPart}-${String(lastDay).padStart(2, '0')}`,
  };
};

export const getMonthLabel = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate || !isValidDate(startDate) || !isValidDate(endDate)) return null;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);

  if (start.getDate() !== 1 || end.getFullYear() !== start.getFullYear() || end.getMonth() !== start.getMonth() || end.getDate() !== lastDay.getDate()) {
    return null;
  }

  return `${start.getFullYear()}年${start.getMonth() + 1}月`;
};
