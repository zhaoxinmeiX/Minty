import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BillListType } from '@/src/db/operations';
import { CategoryOption } from '@/src/types/bills';

import { BillFilterCategoryPicker } from './BillFilterCategoryPicker';
import { BillFilterDateRangePicker } from './BillFilterDateRangePicker';
import { BillFilterForm } from './BillFilterForm';
import { styles } from './BillFilterModal.styles';

type Props = {
  visible: boolean;
  showCategoryPicker: boolean;
  showDateRangePicker: boolean;
  startDateInput: string;
  endDateInput: string;
  minAmountInput: string;
  maxAmountInput: string;
  typeDraft: BillListType;
  selectedCategoryId?: number;
  selectedCategoryName?: string;
  categoryOptions: CategoryOption[];
  animatedBackdropStyle: object;
  animatedFilterSheetStyle: object;
  onClose: () => void;
  onClearDateRange: () => void;
  onOpenDateRangePicker: () => void;
  onOpenCategoryPicker: () => void;
  onCloseCategoryPicker: () => void;
  onCloseDateRangePicker: () => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onMinAmountChange: (value: string) => void;
  onMaxAmountChange: (value: string) => void;
  onTypeChange: (value: BillListType) => void;
  onSelectCategory: (categoryId?: number) => void;
  onReset: () => void;
  onApply: () => void;
};

export function BillFilterModal({
  visible,
  showCategoryPicker,
  showDateRangePicker,
  startDateInput,
  endDateInput,
  minAmountInput,
  maxAmountInput,
  typeDraft,
  selectedCategoryId,
  selectedCategoryName,
  categoryOptions,
  animatedBackdropStyle,
  animatedFilterSheetStyle,
  onClose,
  onClearDateRange,
  onOpenDateRangePicker,
  onOpenCategoryPicker,
  onCloseCategoryPicker,
  onCloseDateRangePicker,
  onStartDateChange,
  onEndDateChange,
  onMinAmountChange,
  onMaxAmountChange,
  onTypeChange,
  onSelectCategory,
  onReset,
  onApply,
}: Props) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.filterOverlay}>
        <Animated.View style={[styles.filterBackdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.filterSheet, animatedFilterSheetStyle]}>
          {showCategoryPicker ? (
            <BillFilterCategoryPicker
              categoryOptions={categoryOptions}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
              onCloseCategoryPicker={onCloseCategoryPicker}
              onClose={onClose}
            />
          ) : showDateRangePicker ? (
            <BillFilterDateRangePicker
              startDateInput={startDateInput}
              endDateInput={endDateInput}
              onStartDateChange={onStartDateChange}
              onEndDateChange={onEndDateChange}
              onCloseDateRangePicker={onCloseDateRangePicker}
              onClose={onClose}
            />
          ) : (
            <BillFilterForm
              startDateInput={startDateInput}
              endDateInput={endDateInput}
              minAmountInput={minAmountInput}
              maxAmountInput={maxAmountInput}
              typeDraft={typeDraft}
              selectedCategoryName={selectedCategoryName}
              onClearDateRange={onClearDateRange}
              onMinAmountChange={onMinAmountChange}
              onMaxAmountChange={onMaxAmountChange}
              onTypeChange={onTypeChange}
              onOpenDateRangePicker={onOpenDateRangePicker}
              onOpenCategoryPicker={onOpenCategoryPicker}
              onClose={onClose}
              onReset={onReset}
              onApply={onApply}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
