import { startTransition, useState, useCallback, useEffect, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { Ledger } from '@/src/db/schema';
import { getLedgersAsync, addLedger, updateLedger, deleteLedger } from '@/src/db/operations';
import { useStore } from '@/src/store';
import { exportLedgerToExcel, importExcelToLedger } from '@/src/utils/excel';

export function useLedgers(autoFetch = true) {
  const db = useSQLiteContext();
  const bumpDataVersion = useStore((state) => state.bumpDataVersion);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef(0);

  const fetchLedgers = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    try {
      const data = await getLedgersAsync(db);
      if (requestId !== requestIdRef.current) return;

      startTransition(() => {
        setLedgers(data);
      });

      return data;
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [db]);

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    void fetchLedgers();
  }, [autoFetch, fetchLedgers]);

  const add = (name: string, currency: string = 'NZD') => {
    addLedger(db, name, currency);
    bumpDataVersion();
    void fetchLedgers();
  };

  const update = (id: number, name: string) => {
    updateLedger(db, id, name);
    bumpDataVersion();
    void fetchLedgers();
  };

  const remove = (id: number) => {
    deleteLedger(db, id);
    bumpDataVersion();
    void fetchLedgers();
  };

  const exportExcel = (id: number, name: string) => {
    exportLedgerToExcel(db, id, name);
  };

  const importExcel = (id: number) => {
    importExcelToLedger(db, id, () => {
      bumpDataVersion();
      void fetchLedgers();
    });
  };

  return {
    ledgers,
    isLoading,
    fetchLedgers,
    add,
    update,
    remove,
    exportExcel,
    importExcel,
  };
}
