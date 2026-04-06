import { deleteRecord, getRecordsByLedger, getRecordsByLedgerAndMonth } from '@/src/db/operations';
import { RecordItem } from '@/src/db/schema';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

export function useRecords(ledgerId: number, yearMonth?: string) {
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
  }, [db, ledgerId, yearMonth]);

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
