import { BillListType } from '@/src/db/operations';

export type RouteParams = {
  openSearch?: string;
  type?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
};

export type CategoryOption = {
  category_id: number;
  category: string;
  icon: string;
};

export type AppliedFilters = {
  startDate?: string;
  endDate?: string;
  type: BillListType;
  minAmount?: number;
  maxAmount?: number;
  categoryId?: number;
};
