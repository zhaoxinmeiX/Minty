import { useSQLiteContext } from 'expo-sqlite';
import { startTransition, useCallback, useEffect, useRef, useState } from 'react';

import { deleteRecord, getRecordsByLedgerAndMonthAsync, getRecordsByLedgerAsync, getRecordsByLedgerInRangeAsync } from '@/src/db/operations';
import { RecordItem } from '@/src/db/schema';
import { useStore } from '@/src/store';

export function useRecords(
  ledgerId: number,
  yearMonth?: string,
  startDate?: string,
  endDate?: string,
  includeTotals = true,
  autoFetch = true,
) {
  const db = useSQLiteContext();
  const bumpDataVersion = useStore((state) => state.bumpDataVersion);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef(0);

  const fetchRecords = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    try {
      let data: RecordItem[] = [];

      if (yearMonth) {
        const parts = yearMonth.split('-');
        if (parts.length === 2) {
          data = await getRecordsByLedgerAndMonthAsync(db, ledgerId, parts[0], parts[1]);
        } else {
          data = await getRecordsByLedgerAsync(db, ledgerId);
        }
      } else if (startDate || endDate) {
        data = await getRecordsByLedgerInRangeAsync(db, ledgerId, startDate, endDate);
      } else {
        data = await getRecordsByLedgerAsync(db, ledgerId);
      }

      if (requestId !== requestIdRef.current) return;

      startTransition(() => {
        setRecords(data);

        if (!includeTotals) {
          setTotalExpense(0);
          setTotalIncome(0);
          return;
        }

        let exp = 0;
        let inc = 0;
        data.forEach((r) => {
          if (r.type === 'expense') exp += r.amount;
          else if (r.type === 'income') inc += r.amount;
        });

        setTotalExpense(exp);
        setTotalIncome(inc);
      });

      return data;
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [db, ledgerId, yearMonth, startDate, endDate, includeTotals]);

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    void fetchRecords();
  }, [autoFetch, fetchRecords]);

  const remove = (id: number) => {
    deleteRecord(db, id);
    bumpDataVersion();
    void fetchRecords();
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
