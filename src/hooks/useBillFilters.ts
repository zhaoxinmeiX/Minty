import { useEffect, useMemo, useRef, useState } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { BillListType } from '@/src/db/operations';
import { AppliedFilters } from '@/src/types/bills';
import { getMonthLabel, getMonthRange, isValidDate, normalizeBillType, parseNumber } from '@/src/utils/billsFilters';

type Params = {
  initialType?: string;
  initialCategoryId?: number;
  initialStartDate?: string;
  initialEndDate?: string;
  screenHeight: number;
};

export function useBillFilters({ initialType, initialCategoryId, initialStartDate, initialEndDate, screenHeight }: Params) {
  const resolvedType = normalizeBillType(initialType);

  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isFilterModalMounted, setIsFilterModalMounted] = useState(false);

  const [startDateInput, setStartDateInput] = useState(initialStartDate ?? '');
  const [endDateInput, setEndDateInput] = useState(initialEndDate ?? '');
  const [typeDraft, setTypeDraft] = useState<BillListType>(resolvedType);
  const [minAmountInput, setMinAmountInput] = useState('');
  const [maxAmountInput, setMaxAmountInput] = useState('');
  const [categoryDraftId, setCategoryDraftId] = useState<number | undefined>(initialCategoryId);

  const [filters, setFilters] = useState<AppliedFilters>({
    startDate: initialStartDate,
    endDate: initialEndDate,
    type: resolvedType,
    categoryId: initialCategoryId,
  });

  const filterTranslateY = useSharedValue(-screenHeight);
  const filterBackdropOpacity = useSharedValue(0);
  const hideFilterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: filterBackdropOpacity.value,
  }));

  const animatedFilterSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: filterTranslateY.value }],
  }));

  const monthLabel = useMemo(() => getMonthLabel(filters.startDate, filters.endDate), [filters.endDate, filters.startDate]);

  const monthPickerValue = useMemo(() => {
    if (monthLabel && filters.startDate) {
      return filters.startDate.slice(0, 7);
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, [filters.startDate, monthLabel]);

  useEffect(() => {
    if (showFilters) {
      if (hideFilterTimerRef.current) {
        clearTimeout(hideFilterTimerRef.current);
        hideFilterTimerRef.current = null;
      }
      setIsFilterModalMounted(true);
      filterTranslateY.value = withTiming(0, { duration: 280 });
      filterBackdropOpacity.value = withTiming(1, { duration: 220 });
      return;
    }

    filterTranslateY.value = withTiming(-screenHeight, { duration: 220 });
    filterBackdropOpacity.value = withTiming(0, { duration: 200 });

    hideFilterTimerRef.current = setTimeout(() => {
      setIsFilterModalMounted(false);
      hideFilterTimerRef.current = null;
    }, 240);

    return () => {
      if (hideFilterTimerRef.current) {
        clearTimeout(hideFilterTimerRef.current);
        hideFilterTimerRef.current = null;
      }
    };
  }, [filterBackdropOpacity, filterTranslateY, screenHeight, showFilters]);

  useEffect(() => {
    return () => {
      if (hideFilterTimerRef.current) {
        clearTimeout(hideFilterTimerRef.current);
      }
    };
  }, []);

  const handleApplyFilters = () => {
    const next: AppliedFilters = {
      type: typeDraft,
      startDate: isValidDate(startDateInput) ? startDateInput : undefined,
      endDate: isValidDate(endDateInput) ? endDateInput : undefined,
      minAmount: parseNumber(minAmountInput),
      maxAmount: parseNumber(maxAmountInput),
      categoryId: categoryDraftId,
    };
    setFilters(next);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setStartDateInput('');
    setEndDateInput('');
    setTypeDraft('all');
    setMinAmountInput('');
    setMaxAmountInput('');
    setCategoryDraftId(undefined);
    setFilters({ type: 'all' });
  };

  const handleSelectMonth = (month: string) => {
    const { startDate, endDate } = getMonthRange(month);
    setStartDateInput(startDate);
    setEndDateInput(endDate);
    setFilters((prev) => ({
      ...prev,
      startDate,
      endDate,
    }));
  };

  const handleToggleFilters = () => {
    if (showFilters) {
      setShowCategoryPicker(false);
      setShowFilters(false);
      return;
    }
    setShowCategoryPicker(false);
    setShowFilters(true);
  };

  const handleOpenCategoryPicker = () => setShowCategoryPicker(true);
  const handleCloseCategoryPicker = () => setShowCategoryPicker(false);

  return {
    filters,
    monthLabel,
    monthPickerValue,
    showFilters,
    showCategoryPicker,
    isFilterModalMounted,
    startDateInput,
    endDateInput,
    typeDraft,
    minAmountInput,
    maxAmountInput,
    categoryDraftId,
    animatedBackdropStyle,
    animatedFilterSheetStyle,
    setStartDateInput,
    setEndDateInput,
    setTypeDraft,
    setMinAmountInput,
    setMaxAmountInput,
    setCategoryDraftId,
    handleApplyFilters,
    handleResetFilters,
    handleSelectMonth,
    handleToggleFilters,
    handleOpenCategoryPicker,
    handleCloseCategoryPicker,
  };
}
