import { ChevronRight, CircleX } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { BillListType } from '@/src/db/operations';

import { styles } from './BillFilterModal.styles';

type Props = {
  startDateInput: string;
  endDateInput: string;
  minAmountInput: string;
  maxAmountInput: string;
  typeDraft: BillListType;
  selectedCategoryName?: string;
  onClearDateRange: () => void;
  onMinAmountChange: (value: string) => void;
  onMaxAmountChange: (value: string) => void;
  onTypeChange: (value: BillListType) => void;
  onOpenDateRangePicker: () => void;
  onOpenCategoryPicker: () => void;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
};

const typeOptions: Array<{ key: BillListType; label: string }> = [
  { key: 'all', label: '不限' },
  { key: 'expense', label: '支出' },
  { key: 'income', label: '收入' },
];

export function BillFilterForm({
  startDateInput,
  endDateInput,
  minAmountInput,
  maxAmountInput,
  typeDraft,
  selectedCategoryName,
  onClearDateRange,
  onMinAmountChange,
  onMaxAmountChange,
  onTypeChange,
  onOpenDateRangePicker,
  onOpenCategoryPicker,
  onClose,
  onReset,
  onApply,
}: Props) {
  const theme = Colors.light;
  const hasSelectedCategory = Boolean(selectedCategoryName);
  const hasDateRange = Boolean(startDateInput || endDateInput);

  const dateRangeText = startDateInput && endDateInput ? `${startDateInput} 至 ${endDateInput}` : startDateInput ? `${startDateInput} 起` : endDateInput ? `截止 ${endDateInput}` : '选择日期范围';

  return (
    <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.filterScrollContent}>
      <View style={styles.filterHeaderCompact}>
        <Text style={styles.filterMainTitle}>筛选</Text>
        <Pressable style={styles.headerIconBtnPlain} onPress={onClose} hitSlop={8}>
          <CircleX size={22} color={theme.homeMuted} />
        </Pressable>
      </View>

      <View style={styles.filterCardBlock}>
        <View style={styles.dateRangeHeader}>
          <Text style={styles.filterTitle}>账单时间</Text>
          {hasDateRange ? (
            <Pressable style={styles.inlineClearBtn} onPress={onClearDateRange} hitSlop={8}>
              <Text style={styles.inlineClearText}>清空</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable style={styles.dateRangeTrigger} onPress={onOpenDateRangePicker}>
          <Text style={[styles.dateRangeTriggerText, hasDateRange && styles.dateRangeTriggerTextActive]} numberOfLines={1}>
            {dateRangeText}
          </Text>
          <ChevronRight size={18} color={hasDateRange ? theme.homeOlive : theme.homeMuted} />
        </Pressable>
      </View>

      <View style={[styles.filterCardBlock, styles.filterBlockGap]}>
        <Text style={styles.filterTitle}>收支</Text>
        <View style={styles.typeWrap}>
          {typeOptions.map((option) => {
            const selected = typeDraft === option.key;
            return (
              <Pressable key={option.key} style={[styles.typeChip, selected && styles.typeChipActive]} onPress={() => onTypeChange(option.key)}>
                <Text style={[styles.typeChipText, selected && styles.typeChipTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.filterCardBlock, styles.filterBlockGap]}>
        <Text style={styles.filterTitle}>金额范围</Text>
        <View style={styles.rangeRow}>
          <TextInput
            value={minAmountInput}
            onChangeText={onMinAmountChange}
            keyboardType="numeric"
            placeholder="最小金额"
            placeholderTextColor={theme.homeMuted}
            style={styles.rangeInput}
          />
          <Text style={styles.rangeDivider}>至</Text>
          <TextInput
            value={maxAmountInput}
            onChangeText={onMaxAmountChange}
            keyboardType="numeric"
            placeholder="最大金额"
            placeholderTextColor={theme.homeMuted}
            style={styles.rangeInput}
          />
        </View>
      </View>

      <Pressable style={[styles.filterRow, styles.filterBlockGap]} onPress={onOpenCategoryPicker}>
        <Text style={styles.filterTitle}>分类</Text>
        <View style={styles.filterRowRight}>
          <Text style={[styles.filterValue, hasSelectedCategory && styles.filterValueActive]} numberOfLines={1}>
            {selectedCategoryName || '不限制'}
          </Text>
          <ChevronRight size={18} color={hasSelectedCategory ? theme.homeOlive : theme.homeMuted} />
        </View>
      </Pressable>

      <View style={styles.filterActions}>
        <Pressable style={styles.resetBtn} onPress={onReset}>
          <Text style={styles.resetText}>重置</Text>
        </Pressable>
        <Pressable style={styles.confirmBtn} onPress={onApply}>
          <Text style={styles.confirmText}>确定</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
