import { RecordItem } from '@/src/db/schema';
import { parseISODate } from '@/src/utils/date';

export type MonthlyRecordSection = {
  key: string;
  title: string;
  data: RecordItem[];
  expenseTotal: number;
};

export function groupRecordsByMonth(records: RecordItem[]): MonthlyRecordSection[] {
  const groups = new Map<string, MonthlyRecordSection>();

  records.forEach((item) => {
    const date = parseISODate(item.created_at);
    if (!date) return;

    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const title = `${date.getFullYear()}年${date.getMonth() + 1}月`;

    if (!groups.has(key)) {
      groups.set(key, { key, title, data: [], expenseTotal: 0 });
    }

    const group = groups.get(key)!;
    group.data.push(item);
    if (item.type === 'expense') {
      group.expenseTotal += item.amount;
    }
  });

  return Array.from(groups.values());
}
