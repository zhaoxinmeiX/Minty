import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LedgerPickerAnchorFrame, LedgerPickerModal } from '@/components/add/LedgerPickerModal';
import { BillFilterModal } from '@/components/bills/BillFilterModal';
import { BillsTopBar } from '@/components/bills/BillsTopBar';
import { MonthPickerModal } from '@/components/calendar/MonthPickerModal';
import { RecordDetailSheet } from '@/components/record/RecordDetailSheet';
import { RecordListItem } from '@/components/record/RecordListItem';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { BillListType, deleteRecord, getBillListCategoryOptions, getRecordsForBillList } from '@/src/db/operations';
import { RecordItem } from '@/src/db/schema';
import { useBillFilters } from '@/src/hooks/useBillFilters';
import { useLedgers } from '@/src/hooks/useLedgers';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
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
  const stableInsets = useStableSafeAreaInsets();
  const activeLedgerId = useStore((state) => state.activeLedgerId);
  const setActiveLedgerId = useStore((state) => state.setActiveLedgerId);
  const bumpDataVersion = useStore((state) => state.bumpDataVersion);
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
  const [ledgerAnchorFrame, setLedgerAnchorFrame] = useState<LedgerPickerAnchorFrame | null>(null);
  const ledgerButtonRef = React.useRef<View>(null);

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

  const openLedgerPicker = () => {
    if (!ledgerButtonRef.current) {
      setLedgerAnchorFrame(null);
      setIsLedgerModalVisible(true);
      return;
    }

    ledgerButtonRef.current.measureInWindow((x, y, width, height) => {
      setLedgerAnchorFrame({ x, y, width, height });
      setIsLedgerModalVisible(true);
    });
  };

  const renderSectionHeader = ({ section }: { section: { title: string; expenseTotal: number } }) => (
    <View style={styles.monthHeader}>
      <Text style={styles.monthTitle}>{section.title}</Text>
      <Text style={[styles.monthTotal, { color: theme.homeOlive }]}>支 {section.expenseTotal.toFixed(2)}</Text>
    </View>
  );

  const getDateKey = (record: RecordItem) => {
    const date = parseISODate(record.created_at);
    if (!date) return record.created_at.split(' ')[0] || record.created_at;
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.homeBackground, paddingTop: stableInsets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View pointerEvents="none" style={[localStyles.screenGlow, localStyles.screenGlowTop, { backgroundColor: 'rgba(252, 206, 180, 0.42)' }]} />
      <View pointerEvents="none" style={[localStyles.screenGlow, localStyles.screenGlowBottom, { backgroundColor: 'rgba(171, 215, 251, 0.34)' }]} />

      <BillsTopBar
        searchOpen={searchOpen}
        keyword={keyword}
        ledgerName={activeLedger?.name || '家庭账本'}
        ledgerTriggerRef={ledgerButtonRef}
        monthLabel={monthLabel}
        showFilters={showFilters}
        onBack={() => router.back()}
        onKeywordChange={setKeyword}
        onClearKeyword={() => setKeyword('')}
        onCloseSearch={() => setSearchOpen(false)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenLedgerPicker={openLedgerPicker}
        onOpenMonthPicker={() => setIsMonthPickerVisible(true)}
        onToggleFilters={handleToggleFilters}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
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
        ListEmptyComponent={
          <View style={[localStyles.emptyCard, { backgroundColor: theme.homeSurface }]}>
            <Text style={[localStyles.emptyTitle, { color: theme.text }]}>暂无符合条件的账单</Text>
            <Text style={[localStyles.emptyHint, { color: theme.homeMuted }]}>试试调整筛选条件或搜索关键词。</Text>
          </View>
        }
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
        accentColor={theme.homeAccent}
      />

      <RecordDetailSheet
        visible={isDetailVisible}
        record={selectedRecord}
        ledgerName={activeLedger?.name}
        onClose={() => setIsDetailVisible(false)}
        onEdit={(record) => {
          setIsDetailVisible(false);
          router.push({ pathname: '/add', params: { id: record.id.toString(), mode: 'edit' } });
        }}
        onCopy={(record) => {
          setIsDetailVisible(false);
          router.push({ pathname: '/add', params: { id: record.id.toString(), mode: 'copy' } });
        }}
        onDelete={(id) => {
          deleteRecord(db, id);
          bumpDataVersion();
          setIsDetailVisible(false);
          fetchRecords();
        }}
      />

      <LedgerPickerModal
        visible={isLedgerModalVisible}
        ledgers={ledgers}
        activeLedgerId={activeLedgerId}
        anchorFrame={ledgerAnchorFrame}
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
    </View>
  );
}

const localStyles = StyleSheet.create({
  screenGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  screenGlowTop: {
    width: 200,
    height: 200,
    top: 54,
    left: -48,
  },
  screenGlowBottom: {
    width: 240,
    height: 240,
    bottom: 120,
    right: -84,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 28,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: Typography.size.title,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: Typography.size.body,
  },
});
