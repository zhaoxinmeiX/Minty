import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Ledger } from '@/src/db/schema';
import { getLedgers, addLedger, updateLedger, deleteLedger } from '@/src/db/operations';
import { exportLedgerToExcel, importExcelToLedger } from '@/src/utils/excel';

export function useLedgers() {
  const db = useSQLiteContext();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLedgers = useCallback(() => {
    setIsLoading(true);
    try {
      const data = getLedgers(db);
      setLedgers(data);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchLedgers();
  }, [fetchLedgers]);

  const add = (name: string, currency: string = 'NZD') => {
    addLedger(db, name, currency);
    fetchLedgers();
  };

  const update = (id: number, name: string) => {
    deleteLedger(db, id); // Wait, this was delete in my thought, must be update
    updateLedger(db, id, name);
    fetchLedgers();
  };

  const remove = (id: number) => {
    deleteLedger(db, id);
    fetchLedgers();
  };

  const exportExcel = (id: number, name: string) => {
    exportLedgerToExcel(db, id, name);
  };

  const importExcel = (id: number) => {
    importExcelToLedger(db, id, fetchLedgers);
  };

  return {
    ledgers,
    isLoading,
    fetchLedgers,
    add,
    update,
    remove,
    exportExcel,
    importExcel
  };
}
