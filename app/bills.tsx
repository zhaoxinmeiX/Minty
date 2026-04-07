import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, SectionList, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LedgerPickerModal } from '@/components/add/LedgerPickerModal';
import { BillFilterModal } from '@/components/bills/BillFilterModal';
import { BillsTopBar } from '@/components/bills/BillsTopBar';
import { MonthPickerModal } from '@/components/calendar/MonthPickerModal';
import { RecordDetailSheet } from '@/components/record/RecordDetailSheet';
import { RecordListItem } from '@/components/record/RecordListItem';
import { Colors } from '@/constants/Colors';
import { BillListType, deleteRecord, getBillListCategoryOptions, getRecordsForBillList } from '@/src/db/operations';
import { RecordItem } from '@/src/db/schema';
import { useBillFilters } from '@/src/hooks/useBillFilters';
import { useLedgers } from '@/src/hooks/useLedgers';
import { useStore } from '@/src/store';
import { CategoryOption, RouteParams } from '@/src/types/bills';
import { isValidDate } from '@/src/utils/billsFilters';
import { parseISODate } from '@/src/utils/date';

import { styles } from './bills.styles';

export default function BillsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const params = useLocalSearchParams<RouteParams>();
  const theme = Colors.light;
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { activeLedgerId, setActiveLedgerId } = useStore();
  const { ledgers } = useLedgers();
  const activeLedger = ledgers.find((item) => item.id === activeLedgerId);

  const initialType = (params.type as BillListType) || 'all';
  const initialCategoryId = params.categoryId ? Number(params.categoryId) : undefined;
  const initialStartDate = params.startDate && isValidDate(params.startDate) ? params.startDate : undefined;
  const initialEndDate = params.endDate && isValidDate(params.endDate) ? params.endDate : undefined;

  const [records, setRecords] = useState<RecordItem[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isLedgerModalVisible, setIsLedgerModalVisible] = useState(false);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);

  const [searchOpen, setSearchOpen] = useState(params.openSearch === '1');
  const [keyword, setKeyword] = useState('');

  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);

  const {
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
  } = useBillFilters({
    initialType,
    initialCategoryId,
    initialStartDate,
    initialEndDate,
    screenHeight,
  });

  const fetchCategoryOptions = useCallback(() => {
    const result = getBillListCategoryOptions(db, activeLedgerId);
    setCategoryOptions(result);
  }, [db, activeLedgerId]);

  const fetchRecords = useCallback(() => {
    const result = getRecordsForBillList(db, {
      ledgerId: activeLedgerId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      type: filters.type,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
      categoryId: filters.categoryId,
      keyword,
    });
    setRecords(result);
  }, [db, activeLedgerId, filters, keyword]);

  useEffect(() => {
    fetchCategoryOptions();
  }, [fetchCategoryOptions]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useFocusEffect(
    useCallback(() => {
      fetchRecords();
    }, [fetchRecords]),
  );

  const sections = useMemo(() => {
    const groups = new Map<string, { data: RecordItem[]; expenseTotal: number }>();
    records.forEach((item) => {
      const date = parseISODate(item.created_at);
      if (!date) return;
      const title = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      if (!groups.has(title)) {
        groups.set(title, { data: [], expenseTotal: 0 });
      }
      const group = groups.get(title)!;
      group.data.push(item);
      if (item.type === 'expense') group.expenseTotal += item.amount;
    });

    return Array.from(groups.entries()).map(([title, group]) => ({
      title,
      data: group.data,
      expenseTotal: group.expenseTotal,
    }));
  }, [records]);

  const selectedCategory = useMemo(() => categoryOptions.find((item) => item.category_id === categoryDraftId), [categoryDraftId, categoryOptions]);

  const appliedCategory = useMemo(() => categoryOptions.find((item) => item.category_id === filters.categoryId), [categoryOptions, filters.categoryId]);

  const renderSectionHeader = ({ section }: { section: { title: string; expenseTotal: number } }) => (
    <View style={styles.monthHeader}>
      <Text style={styles.monthTitle}>{section.title}</Text>
      <Text style={[styles.monthTotal, { color: theme.tabIconDefault }]}>支 {section.expenseTotal.toFixed(2)}</Text>
    </View>
  );

  const getDateKey = (record: RecordItem) => {
    const date = parseISODate(record.created_at);
    if (!date) return record.created_at.split(' ')[0] || record.created_at;
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <BillsTopBar
        searchOpen={searchOpen}
        keyword={keyword}
        ledgerName={activeLedger?.name || '家庭账本'}
        monthLabel={monthLabel}
        showFilters={showFilters}
        onBack={() => router.back()}
        onKeywordChange={setKeyword}
        onClearKeyword={() => setKeyword('')}
        onCloseSearch={() => setSearchOpen(false)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenLedgerPicker={() => setIsLedgerModalVisible(true)}
        onOpenMonthPicker={() => setIsMonthPickerVisible(true)}
        onToggleFilters={handleToggleFilters}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        renderItem={({ item, index, section }) => {
          const prevItem = index > 0 ? section.data[index - 1] : null;
          const showDateBadge = !prevItem || getDateKey(prevItem) !== getDateKey(item);

          return (
            <RecordListItem
              item={item}
              showTime
              showDateBadge={showDateBadge}
              reserveDateBadgeSpace
              onPress={(record) => {
                setSelectedRecord(record);
                setIsDetailVisible(true);
              }}
            />
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无符合条件的账单</Text>}
      />

      <BillFilterModal
        visible={isFilterModalMounted}
        showCategoryPicker={showCategoryPicker}
        startDateInput={startDateInput}
        endDateInput={endDateInput}
        minAmountInput={minAmountInput}
        maxAmountInput={maxAmountInput}
        typeDraft={typeDraft}
        selectedCategoryName={selectedCategory?.category}
        categoryOptions={categoryOptions}
        insetTop={insets.top}
        animatedBackdropStyle={animatedBackdropStyle}
        animatedFilterSheetStyle={animatedFilterSheetStyle}
        onClose={handleToggleFilters}
        onOpenCategoryPicker={handleOpenCategoryPicker}
        onCloseCategoryPicker={handleCloseCategoryPicker}
        onStartDateChange={setStartDateInput}
        onEndDateChange={setEndDateInput}
        onMinAmountChange={setMinAmountInput}
        onMaxAmountChange={setMaxAmountInput}
        onTypeChange={setTypeDraft}
        onSelectCategory={setCategoryDraftId}
        onReset={handleResetFilters}
        onApply={handleApplyFilters}
      />

      <MonthPickerModal
        visible={isMonthPickerVisible}
        currentMonth={monthPickerValue}
        onSelect={(month) => {
          handleSelectMonth(month);
          setIsMonthPickerVisible(false);
        }}
        onClose={() => setIsMonthPickerVisible(false)}
        accentColor={theme.accent}
      />

      <RecordDetailSheet
        visible={isDetailVisible}
        record={selectedRecord}
        ledgerName={activeLedger?.name}
        onClose={() => setIsDetailVisible(false)}
        onEdit={(record) => {
          setIsDetailVisible(false);
          router.push({ pathname: '/(tabs)/add', params: { id: record.id.toString(), mode: 'edit' } });
        }}
        onCopy={(record) => {
          setIsDetailVisible(false);
          router.push({ pathname: '/(tabs)/add', params: { id: record.id.toString(), mode: 'copy' } });
        }}
        onDelete={(id) => {
          deleteRecord(db, id);
          setIsDetailVisible(false);
          fetchRecords();
        }}
      />

      <LedgerPickerModal
        visible={isLedgerModalVisible}
        ledgers={ledgers}
        activeLedgerId={activeLedgerId}
        onSelect={(id) => {
          setActiveLedgerId(id);
          setIsLedgerModalVisible(false);
        }}
        onClose={() => setIsLedgerModalVisible(false)}
      />

      {appliedCategory && (
        <View style={styles.appliedHint}>
          <Text style={styles.appliedHintText}>已筛选分类：{appliedCategory.category}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
