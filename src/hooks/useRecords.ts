import { deleteRecord, getRecordsByLedger, getRecordsByLedgerAndMonth } from '@/src/db/operations';
import { RecordItem } from '@/src/db/schema';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

export function useRecords(ledgerId: number, yearMonth?: string, startDate?: string, endDate?: string) {
  const db = useSQLiteContext();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecords = useCallback(() => {
    setIsLoading(true);
    try {
      let data: RecordItem[] = [];
      if (yearMonth) {
        const parts = yearMonth.split('-');
        if (parts.length === 2) {
          data = getRecordsByLedgerAndMonth(db, ledgerId, parts[0], parts[1]);
        } else {
          data = getRecordsByLedger(db, ledgerId);
        }
      } else if (startDate || endDate) {
        let query = `
          SELECT r.*, IFNULL(c.icon, 'LayoutGrid') as icon
          FROM records r
          LEFT JOIN categories c ON r.category_id = c.id
          WHERE r.ledger_id = ?
        `;
        const params: (number | string)[] = [ledgerId];

        if (startDate) {
          query += ' AND date(r.created_at) >= ?';
          params.push(startDate);
        }

        if (endDate) {
          query += ' AND date(r.created_at) <= ?';
          params.push(endDate);
        }

        query += ' ORDER BY r.created_at DESC';
        data = db.getAllSync<RecordItem>(query, ...params);
      } else {
        data = getRecordsByLedger(db, ledgerId);
      }

      setRecords(data);

      let exp = 0;
      let inc = 0;
      data.forEach((r) => {
        if (r.type === 'expense') exp += r.amount;
        else if (r.type === 'income') inc += r.amount;
      });
      setTotalExpense(exp);
      setTotalIncome(inc);
    } finally {
      setIsLoading(false);
    }
  }, [db, ledgerId, yearMonth, startDate, endDate]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const remove = (id: number) => {
    deleteRecord(db, id);
    fetchRecords();
  };

  return {
    records,
    totalExpense,
    totalIncome,
    isLoading,
    fetchRecords,
    remove,
  };
}
