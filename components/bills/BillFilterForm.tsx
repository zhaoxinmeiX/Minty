import { ChevronRight, CircleX } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

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
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onMinAmountChange: (value: string) => void;
  onMaxAmountChange: (value: string) => void;
  onTypeChange: (value: BillListType) => void;
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
  onStartDateChange,
  onEndDateChange,
  onMinAmountChange,
  onMaxAmountChange,
  onTypeChange,
  onOpenCategoryPicker,
  onClose,
  onReset,
  onApply,
}: Props) {
  const theme = Colors.light;

  return (
    <>
      <View style={styles.filterHeader}>
        <View>
          <Text style={styles.filterMainTitle}>高级筛选</Text>
          <Text style={styles.filterHeaderHint}>组合条件，快速定位账单</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={8}>
          <CircleX size={22} color={theme.homeMuted} />
        </Pressable>
      </View>

      <View style={styles.filterCardBlock}>
        <Text style={styles.filterTitle}>账单时间</Text>
        <View style={styles.rangeRow}>
          <TextInput value={startDateInput} onChangeText={onStartDateChange} placeholder="开始日期" placeholderTextColor={theme.homeMuted} style={styles.rangeInput} />
          <Text style={styles.rangeDivider}>~</Text>
          <TextInput value={endDateInput} onChangeText={onEndDateChange} placeholder="结束日期" placeholderTextColor={theme.homeMuted} style={styles.rangeInput} />
        </View>
        <Text style={styles.helperText}>日期格式：YYYY-MM-DD</Text>
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
          <Text style={styles.rangeDivider}>~</Text>
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
          <Text style={styles.filterValue}>{selectedCategoryName || '不限制'}</Text>
          <ChevronRight size={18} color={theme.homeMuted} />
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
    </>
  );
}
