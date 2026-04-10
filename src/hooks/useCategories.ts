import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { Category } from '@/src/db/schema';
import { getCategories, getSubCategories, addCategory, updateCategory, deleteCategory } from '@/src/db/operations';
import { useStore } from '@/src/store';

export function useCategories(type: 'expense' | 'income') {
  const db = useSQLiteContext();
  const bumpDataVersion = useStore((state) => state.bumpDataVersion);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = useCallback(() => {
    setIsLoading(true);
    try {
      const data = getCategories(db, type);
      setCategories(data);
    } finally {
      setIsLoading(false);
    }
  }, [db, type]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const add = (name: string, icon: string, parentId: number | null = null) => {
    addCategory(db, name, icon, type, parentId);
    bumpDataVersion();
    fetchCategories();
  };

  const update = (id: number, name: string, icon: string) => {
    updateCategory(db, id, name, icon);
    bumpDataVersion();
    fetchCategories();
  };

  const remove = (id: number) => {
    deleteCategory(db, id);
    bumpDataVersion();
    fetchCategories();
  };

  const getSubs = (parentId: number) => {
    return getSubCategories(db, parentId);
  };

  return {
    categories,
    isLoading,
    fetchCategories,
    add,
    update,
    remove,
    getSubs
  };
}
