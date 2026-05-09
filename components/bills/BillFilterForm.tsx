import { ArrowUpDown, Calendar, ChevronDown, ChevronRight, CircleDollarSign, Tag, CircleX } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { DateTimePickerModal } from '@/components/add/DateTimePickerModal';

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
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
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
  onStartDateChange,
  onEndDateChange,
  onClose,
  onReset,
  onApply,
}: Props) {
  const hasSelectedCategory = Boolean(selectedCategoryName);
  const hasDateRange = Boolean(startDateInput || endDateInput);

  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end' | null>(null);
  const [tempDatePickerDate, setTempDatePickerDate] = useState<Date>(new Date());

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleOpenDatePicker = (mode: 'start' | 'end') => {
    setDatePickerMode(mode);
    if (mode === 'start' && startDateInput) {
      setTempDatePickerDate(new Date(`${startDateInput}T00:00:00`));
    } else if (mode === 'end' && endDateInput) {
      setTempDatePickerDate(new Date(`${endDateInput}T00:00:00`));
    } else {
      setTempDatePickerDate(new Date());
    }
  };

  const handleDateConfirm = () => {
    const dateStr = getLocalDateString(tempDatePickerDate);
    if (datePickerMode === 'start') {
      if (endDateInput && dateStr > endDateInput) {
        onEndDateChange('');
      }
      onStartDateChange(dateStr);
    } else if (datePickerMode === 'end') {
      if (startDateInput && dateStr < startDateInput) {
        onStartDateChange('');
      }
      onEndDateChange(dateStr);
    }
    setDatePickerMode(null);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`;
    }
    return dateStr;
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.filterScrollContent}>

      <View style={styles.filterHeaderCompact}>
        <Text style={styles.filterMainTitle}>筛选</Text>
        <Pressable style={styles.headerIconBtnPlain} onPress={onClose} hitSlop={8}>
          <CircleX size={24} color={'#7F8671'} strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Date Range */}
      <View style={styles.filterCardBlock}>
        <View style={styles.sectionHeaderRow}>
          <Calendar size={20} color="#6E7D42" />
          <Text style={styles.filterTitle}>账单时间</Text>
          {hasDateRange ? (
            <Pressable style={styles.inlineClearBtn} onPress={onClearDateRange} hitSlop={8}>
              <Text style={styles.inlineClearText}>清空</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.rangeRow}>
          <Pressable style={[styles.rangeBlock, startDateInput ? styles.dateRangeTriggerActive : null]} onPress={() => handleOpenDatePicker('start')}>
            <Text style={styles.rangeBlockLabel}>开始日期</Text>
            <View style={styles.rangeBlockValueRow}>
              <Text style={[styles.rangeBlockValue, !startDateInput && styles.rangeBlockValueEmpty]}>{formatDisplayDate(startDateInput) || '开始日期'}</Text>
              <ChevronDown size={16} color="#9CA38F" />
            </View>
          </Pressable>
          <Text style={styles.rangeDivider}>至</Text>
          <Pressable style={[styles.rangeBlock, endDateInput ? styles.dateRangeTriggerActive : null]} onPress={() => handleOpenDatePicker('end')}>
            <Text style={styles.rangeBlockLabel}>结束日期</Text>
            <View style={styles.rangeBlockValueRow}>
              <Text style={[styles.rangeBlockValue, !endDateInput && styles.rangeBlockValueEmpty]}>{formatDisplayDate(endDateInput) || '结束日期'}</Text>
              <ChevronDown size={16} color="#9CA38F" />
            </View>
          </Pressable>
        </View>
      </View>

      {/* Type */}
      <View style={styles.filterCardBlock}>
        <View style={styles.sectionHeaderRow}>
          <ArrowUpDown size={20} color="#6E7D42" />
          <Text style={styles.filterTitle}>收支</Text>
        </View>
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

      {/* Amount Range */}
      <View style={styles.filterCardBlock}>
        <View style={styles.sectionHeaderRow}>
          <CircleDollarSign size={20} color="#6E7D42" />
          <Text style={styles.filterTitle}>金额范围</Text>
        </View>
        <View style={styles.rangeRow}>
          <View style={styles.rangeBlock}>
            <Text style={styles.rangeBlockLabel}>最小金额</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>¥</Text>
              <TextInput
                value={minAmountInput}
                onChangeText={onMinAmountChange}
                keyboardType="numeric"
                placeholder="最小金额"
                placeholderTextColor="#9CA38F"
                style={styles.amountInput}
              />
            </View>
          </View>
          <Text style={styles.rangeDivider}>至</Text>
          <View style={styles.rangeBlock}>
            <Text style={styles.rangeBlockLabel}>最大金额</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>¥</Text>
              <TextInput
                value={maxAmountInput}
                onChangeText={onMaxAmountChange}
                keyboardType="numeric"
                placeholder="最大金额"
                placeholderTextColor="#9CA38F"
                style={styles.amountInput}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Category */}
      <View style={styles.filterCardBlock}>
        <View style={styles.sectionHeaderRow}>
          <Tag size={20} color="#6E7D42" />
          <Text style={styles.filterTitle}>分类</Text>
        </View>
        <Pressable style={styles.filterRow} onPress={onOpenCategoryPicker}>
          <Text style={[styles.filterValue, hasSelectedCategory && styles.filterValueActive]} numberOfLines={1}>
            {selectedCategoryName || '选择分类'}
          </Text>
          <View style={styles.filterRowRight}>
            <ChevronRight size={20} color="#9CA38F" />
          </View>
        </Pressable>
      </View>

      <View style={styles.filterActions}>
        <Pressable style={styles.resetBtn} onPress={onReset}>
          <Text style={styles.resetText}>重置</Text>
        </Pressable>
        <Pressable style={styles.confirmBtn} onPress={onApply}>
          <Text style={styles.confirmText}>确定</Text>
        </Pressable>
      </View>

      <DateTimePickerModal
        visible={datePickerMode !== null}
        tempDate={tempDatePickerDate}
        minimumDate={datePickerMode === 'end' && startDateInput ? new Date(`${startDateInput}T00:00:00`) : undefined}
        maximumDate={datePickerMode === 'start' && endDateInput ? new Date(`${endDateInput}T00:00:00`) : undefined}
        onDateChange={setTempDatePickerDate}
        onConfirm={handleDateConfirm}
        onCancel={() => setDatePickerMode(null)}
        hideTimePicker={true}
      />
    </ScrollView>
  );
}
