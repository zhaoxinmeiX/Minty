import { useEffect, useRef, useState } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { BillListType } from '@/src/db/operations';
import { AppliedFilters } from '@/src/types/bills';
import { isValidDate, normalizeBillType, parseNumber } from '@/src/utils/billsFilters';

type Params = {
  initialType?: string;
  initialCategoryIds?: number[];
  initialStartDate?: string;
  initialEndDate?: string;
  screenHeight: number;
};

export function useBillFilters({ initialType, initialCategoryIds, initialStartDate, initialEndDate, screenHeight }: Params) {
  const resolvedType = normalizeBillType(initialType);

  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [isFilterModalMounted, setIsFilterModalMounted] = useState(false);

  const [startDateInput, setStartDateInput] = useState(initialStartDate ?? '');
  const [endDateInput, setEndDateInput] = useState(initialEndDate ?? '');
  const [typeDraft, setTypeDraft] = useState<BillListType>(resolvedType);
  const [minAmountInput, setMinAmountInput] = useState('');
  const [maxAmountInput, setMaxAmountInput] = useState('');
  const [categoryDraftIds, setCategoryDraftIds] = useState<number[]>(initialCategoryIds || []);

  const [filters, setFilters] = useState<AppliedFilters>({
    startDate: initialStartDate,
    endDate: initialEndDate,
    type: resolvedType,
    categoryIds: initialCategoryIds,
  });

  const filterTranslateY = useSharedValue(screenHeight);
  const filterBackdropOpacity = useSharedValue(0);
  const hideFilterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: filterBackdropOpacity.value,
  }));

  const animatedFilterSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: filterTranslateY.value }],
  }));

  const syncDraftsFromFilters = (nextFilters: AppliedFilters) => {
    setStartDateInput(nextFilters.startDate ?? '');
    setEndDateInput(nextFilters.endDate ?? '');
    setTypeDraft(nextFilters.type ?? 'all');
    setMinAmountInput(nextFilters.minAmount !== undefined ? nextFilters.minAmount.toString() : '');
    setMaxAmountInput(nextFilters.maxAmount !== undefined ? nextFilters.maxAmount.toString() : '');
    setCategoryDraftIds(nextFilters.categoryIds || []);
  };

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

    filterTranslateY.value = withTiming(screenHeight, { duration: 220 });
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
      categoryIds: categoryDraftIds.length > 0 ? categoryDraftIds : undefined,
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
    setCategoryDraftIds([]);
  };

  const handleToggleFilters = () => {
    if (showFilters) {
      setShowCategoryPicker(false);
      setShowDateRangePicker(false);
      setShowFilters(false);
      return;
    }
    syncDraftsFromFilters(filters);
    setShowCategoryPicker(false);
    setShowDateRangePicker(false);
    setShowFilters(true);
  };

  const handleOpenCategoryPicker = () => {
    setShowDateRangePicker(false);
    setShowCategoryPicker(true);
  };
  const handleCloseCategoryPicker = () => setShowCategoryPicker(false);
  const handleOpenDateRangePicker = () => {
    setShowCategoryPicker(false);
    setShowDateRangePicker(true);
  };
  const handleCloseDateRangePicker = () => setShowDateRangePicker(false);
  const handleClearDateRange = () => {
    setStartDateInput('');
    setEndDateInput('');
  };

  return {
    filters,
    showFilters,
    showCategoryPicker,
    showDateRangePicker,
    isFilterModalMounted,
    startDateInput,
    endDateInput,
    typeDraft,
    minAmountInput,
    maxAmountInput,
    categoryDraftIds,
    animatedBackdropStyle,
    animatedFilterSheetStyle,
    setStartDateInput,
    setEndDateInput,
    setTypeDraft,
    setMinAmountInput,
    setMaxAmountInput,
    setCategoryDraftIds,
    handleApplyFilters,
    handleResetFilters,
    handleToggleFilters,
    handleOpenCategoryPicker,
    handleCloseCategoryPicker,
    handleOpenDateRangePicker,
    handleCloseDateRangePicker,
    handleClearDateRange,
  };
}
