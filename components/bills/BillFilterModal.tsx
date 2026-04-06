import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BillListType } from '@/src/db/operations';
import { CategoryOption } from '@/src/types/bills';

import { BillFilterCategoryPicker } from './BillFilterCategoryPicker';
import { BillFilterForm } from './BillFilterForm';
import { styles } from './BillFilterModal.styles';

type Props = {
  visible: boolean;
  showCategoryPicker: boolean;
  startDateInput: string;
  endDateInput: string;
  minAmountInput: string;
  maxAmountInput: string;
  typeDraft: BillListType;
  selectedCategoryName?: string;
  categoryOptions: CategoryOption[];
  insetTop: number;
  animatedBackdropStyle: object;
  animatedFilterSheetStyle: object;
  onClose: () => void;
  onOpenCategoryPicker: () => void;
  onCloseCategoryPicker: () => void;
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
  startDateInput,
  endDateInput,
  minAmountInput,
  maxAmountInput,
  typeDraft,
  selectedCategoryName,
  categoryOptions,
  insetTop,
  animatedBackdropStyle,
  animatedFilterSheetStyle,
  onClose,
  onOpenCategoryPicker,
  onCloseCategoryPicker,
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
          <View style={[styles.filterPanel, { paddingTop: Math.max(insetTop, 16), paddingBottom: 16, paddingHorizontal: 16 }]}>
            {showCategoryPicker ? (
              <BillFilterCategoryPicker categoryOptions={categoryOptions} onSelectCategory={onSelectCategory} onCloseCategoryPicker={onCloseCategoryPicker} onClose={onClose} />
            ) : (
              <BillFilterForm
                startDateInput={startDateInput}
                endDateInput={endDateInput}
                minAmountInput={minAmountInput}
                maxAmountInput={maxAmountInput}
                typeDraft={typeDraft}
                selectedCategoryName={selectedCategoryName}
                onStartDateChange={onStartDateChange}
                onEndDateChange={onEndDateChange}
                onMinAmountChange={onMinAmountChange}
                onMaxAmountChange={onMaxAmountChange}
                onTypeChange={onTypeChange}
                onOpenCategoryPicker={onOpenCategoryPicker}
                onClose={onClose}
                onReset={onReset}
                onApply={onApply}
              />
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
