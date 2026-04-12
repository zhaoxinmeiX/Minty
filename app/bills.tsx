import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, SectionList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { LedgerPickerAnchorFrame, LedgerPickerModal } from '@/components/add/LedgerPickerModal';
import { BillFilterModal } from '@/components/bills/BillFilterModal';
import { BillsTopBar } from '@/components/bills/BillsTopBar';
import { BillListRow, formatRecordAmount, getRecordDayKey } from '@/components/record/BillListRow';
import { RecordDetailSheet } from '@/components/record/RecordDetailSheet';
import { Colors } from '@/constants/Colors';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { Typography } from '@/constants/Typography';
import {
  BillListCursor,
  BillListMonthSummary,
  BillListType,
  deleteRecord,
  getBillListCategoryOptionsAsync,
  getBillListMonthSummariesAsync,
  getBillListPageAsync,
} from '@/src/db/operations';
import { RecordItem } from '@/src/db/schema';
import { useBillFilters } from '@/src/hooks/useBillFilters';
import { useLedgers } from '@/src/hooks/useLedgers';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
import { useStore } from '@/src/store';
import { CategoryOption, RouteParams } from '@/src/types/bills';
import { isValidDate } from '@/src/utils/billsFilters';
import { groupRecordsByMonth, MonthlyRecordSection } from '@/src/utils/recordSections';

import { styles } from './bills.styles';

const PAGE_SIZE = 60;
type BillSection = MonthlyRecordSection & { recordCount: number };

function mergeRecordPages(existing: RecordItem[], incoming: RecordItem[]) {
  if (existing.length === 0) {
    return incoming;
  }

  const seen = new Set(existing.map((item) => item.id));
  const merged = existing.slice();

  incoming.forEach((item) => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  });

  return merged;
}

export default function BillsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const params = useLocalSearchParams<RouteParams>();
  const theme = Colors.light;
  const { height: screenHeight } = useWindowDimensions();
  const stableInsets = useStableSafeAreaInsets();
  const activeLedgerId = useStore((state) => state.activeLedgerId);
  const setActiveLedgerId = useStore((state) => state.setActiveLedgerId);
  const dataVersion = useStore((state) => state.dataVersion);
  const bumpDataVersion = useStore((state) => state.bumpDataVersion);
  const { ledgers } = useLedgers();
  const activeLedger = ledgers.find((item) => item.id === activeLedgerId);
  const requestIdRef = useRef(0);
  const categoryRequestIdRef = useRef(0);
  const lastSyncedDataVersionRef = useRef(dataVersion);
  const hasLoadedAtLeastOnceRef = useRef(false);

  const initialType = (params.type as BillListType) || 'all';
  const initialCategoryId = params.categoryId ? Number(params.categoryId) : undefined;
  const initialStartDate = params.startDate && isValidDate(params.startDate) ? params.startDate : undefined;
  const initialEndDate = params.endDate && isValidDate(params.endDate) ? params.endDate : undefined;

  const [records, setRecords] = useState<RecordItem[]>([]);
  const [monthSummaries, setMonthSummaries] = useState<BillListMonthSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<BillListCursor | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isLedgerModalVisible, setIsLedgerModalVisible] = useState(false);
  const [ledgerAnchorFrame, setLedgerAnchorFrame] = useState<LedgerPickerAnchorFrame | null>(null);
  const ledgerButtonRef = React.useRef<View>(null);

  const [searchOpen, setSearchOpen] = useState(params.openSearch === '1');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [isSearchPending, setIsSearchPending] = useState(false);

  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);

  const {
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
    handleToggleFilters,
    handleOpenCategoryPicker,
    handleCloseCategoryPicker,
    handleOpenDateRangePicker,
    handleCloseDateRangePicker,
    handleClearDateRange,
  } = useBillFilters({
    initialType,
    initialCategoryId,
    initialStartDate,
    initialEndDate,
    screenHeight,
  });

  const queryParams = useMemo(
    () => ({
      ledgerId: activeLedgerId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      type: filters.type,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
      categoryId: filters.categoryId,
      keyword: appliedKeyword,
    }),
    [activeLedgerId, appliedKeyword, filters.categoryId, filters.endDate, filters.maxAmount, filters.minAmount, filters.startDate, filters.type],
  );

  const hasFilters = useMemo(() => {
    return (
      filters.type !== 'all' ||
      !!filters.startDate ||
      !!filters.endDate ||
      filters.minAmount !== undefined ||
      filters.maxAmount !== undefined ||
      filters.categoryId !== undefined
    );
  }, [filters]);

  const fetchCategoryOptions = useCallback(async () => {
    const requestId = ++categoryRequestIdRef.current;
    const result = await getBillListCategoryOptionsAsync(db, activeLedgerId);

    if (requestId !== categoryRequestIdRef.current) {
      return;
    }

    setCategoryOptions(result);
  }, [db, activeLedgerId]);

  const loadFirstPage = useCallback(
    async (options: { preserveRecords?: boolean } = {}) => {
      const { preserveRecords = false } = options;
      const requestId = ++requestIdRef.current;

      if (!preserveRecords) {
        setRecords([]);
        setNextCursor(null);
        setHasMore(true);
      }

      setIsLoadingMore(false);
      setIsInitialLoading(true);

      try {
        const [page, summaries] = await Promise.all([
          getBillListPageAsync(db, {
            ...queryParams,
            limit: PAGE_SIZE,
          }),
          getBillListMonthSummariesAsync(db, queryParams),
        ]);

        if (requestId !== requestIdRef.current) {
          return;
        }

        lastSyncedDataVersionRef.current = useStore.getState().dataVersion;
        hasLoadedAtLeastOnceRef.current = true;

        setRecords(page.records);
        setMonthSummaries(summaries);
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsInitialLoading(false);
          setIsSearchPending(false);
        }
      }
    },
    [db, queryParams],
  );

  const loadMore = useCallback(async () => {
    if (isInitialLoading || isLoadingMore || !hasMore || !nextCursor) {
      return;
    }

    const requestId = requestIdRef.current;
    setIsLoadingMore(true);

    try {
      const page = await getBillListPageAsync(db, {
        ...queryParams,
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setRecords((current) => mergeRecordPages(current, page.records));
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [db, hasMore, isInitialLoading, isLoadingMore, nextCursor, queryParams]);

  useEffect(() => {
    void fetchCategoryOptions();
  }, [fetchCategoryOptions]);

  useEffect(() => {
    void loadFirstPage({ preserveRecords: hasLoadedAtLeastOnceRef.current });
  }, [loadFirstPage]);

  useFocusEffect(
    useCallback(() => {
      if (lastSyncedDataVersionRef.current === dataVersion) {
        return;
      }

      void fetchCategoryOptions();
      void loadFirstPage({ preserveRecords: true });
    }, [dataVersion, fetchCategoryOptions, loadFirstPage]),
  );

  const monthSummaryByKey = useMemo(() => {
    const map = new Map<string, { recordCount: number; expenseTotal: number }>();

    monthSummaries.forEach((summary) => {
      const [year, month] = summary.yearMonth.split('-');
      if (!year || !month) {
        return;
      }

      map.set(`${year}-${Number(month)}`, {
        recordCount: summary.recordCount,
        expenseTotal: summary.expenseTotal,
      });
    });

    return map;
  }, [monthSummaries]);

  const sections = useMemo<BillSection[]>(() => {
    return groupRecordsByMonth(records).map((section) => {
      const summary = monthSummaryByKey.get(section.key);

      return {
        ...section,
        recordCount: summary?.recordCount ?? section.data.length,
        expenseTotal: summary?.expenseTotal ?? section.expenseTotal,
      };
    });
  }, [monthSummaryByKey, records]);

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

  const ledgerName = activeLedger?.name || '家庭账本';
  const handleKeywordSubmit = useCallback(() => {
    const nextKeyword = keyword.trim();

    if (nextKeyword === appliedKeyword) {
      return;
    }

    setIsSearchPending(true);
    setAppliedKeyword(nextKeyword);
  }, [appliedKeyword, keyword]);

  const handleKeywordClear = useCallback(() => {
    setKeyword('');
    if (!appliedKeyword) {
      return;
    }

    setIsSearchPending(true);
    setAppliedKeyword('');
  }, [appliedKeyword]);

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false);
    handleKeywordClear();
  }, [handleKeywordClear]);

  return (
    <View style={[styles.container, { backgroundColor: theme.homeBackground, paddingTop: stableInsets.top }]}>
      <ScreenBackground />
      <Stack.Screen options={{ headerShown: false }} />

      <BillsTopBar
        searchOpen={searchOpen}
        keyword={keyword}
        ledgerName={activeLedger?.name || '家庭账本'}
        ledgerTriggerRef={ledgerButtonRef}
        showFilters={showFilters}
        hasFilters={hasFilters}
        onBack={() => router.back()}
        onKeywordChange={setKeyword}
        onSubmitKeyword={handleKeywordSubmit}
        onClearKeyword={handleKeywordClear}
        onCloseSearch={handleCloseSearch}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenLedgerPicker={openLedgerPicker}
        onToggleFilters={handleToggleFilters}
      />

      <View style={localStyles.listShell}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: stableInsets.bottom + 28 }, sections.length === 0 && localStyles.listContentEmpty]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={Keyboard.dismiss}
          stickySectionHeadersEnabled={false}
          initialNumToRender={18}
          maxToRenderPerBatch={24}
          windowSize={10}
          removeClippedSubviews
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          renderSectionHeader={({ section }) => {
            return (
              <View style={localStyles.sectionHeader}>
                <View style={styles.sectionMetaRow}>
                  <View style={styles.sectionMetaLeft}>
                    <View style={[styles.sectionMetaDot, { backgroundColor: theme.homeAccent }]} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
                    <View style={[styles.sectionCountPill, { backgroundColor: 'rgba(110, 125, 66, 0.08)' }]}>
                      <Text style={[styles.sectionCountText, { color: theme.homeMuted }]}>{section.recordCount} 笔</Text>
                    </View>
                  </View>
                  <Text style={[styles.sectionTotalText, { color: theme.text }]}>支 {formatRecordAmount(section.expenseTotal)}</Text>
                </View>
              </View>
            );
          }}
          renderItem={({ item, index, section }) => {
            const currentDayKey = getRecordDayKey(item.created_at);
            const previousDayKey = index > 0 ? getRecordDayKey(section.data[index - 1].created_at) : '';
            const isFirst = index === 0;
            const isLast = index === section.data.length - 1;

            return (
              <View
                style={[
                  localStyles.sectionRowShell,
                  {
                    backgroundColor: theme.card,
                    borderColor: 'rgba(110, 125, 66, 0.08)',
                  },
                  isFirst && localStyles.sectionRowFirst,
                  isLast && localStyles.sectionRowLast,
                  isFirst && isLast && localStyles.sectionRowSingle,
                ]}
              >
                <BillListRow
                  item={item}
                  ledgerName={ledgerName}
                  showDate={isFirst || currentDayKey !== previousDayKey}
                  showDivider={!isLast}
                  onPress={(selected) => {
                    setSelectedRecord(selected);
                    setIsDetailVisible(true);
                  }}
                />
              </View>
            );
          }}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={localStyles.footerLoader}>
                <ActivityIndicator size="small" color={theme.homeOlive} />
                <Text style={[localStyles.loadingHint, { color: theme.homeMuted }]}>继续加载账单...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            isSearchPending ? null : isInitialLoading ? (
              <View style={[localStyles.loadingCard, { backgroundColor: theme.homeSurface }]}>
                <ActivityIndicator size="small" color={theme.homeOlive} />
                <Text style={[localStyles.loadingHint, { color: theme.homeMuted }]}>正在加载账单...</Text>
              </View>
            ) : (
              <View style={[localStyles.emptyCard, { backgroundColor: theme.homeSurface }]}>
                <Text style={[localStyles.emptyTitle, { color: theme.text }]}>暂无符合条件的账单</Text>
                <Text style={[localStyles.emptyHint, { color: theme.homeMuted }]}>试试调整筛选条件或搜索关键词。</Text>
              </View>
            )
          }
        />

        {isSearchPending ? (
          <View style={[localStyles.searchLoadingOverlay, { backgroundColor: 'transparent' }]}>
            <View style={[localStyles.searchLoadingPanel, { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: 'rgba(110, 125, 66, 0.12)' }]}>
              <ActivityIndicator size="small" color={theme.homeOlive} />
              <Text style={[localStyles.searchLoadingText, { color: theme.homeMuted }]}>搜索中...</Text>
            </View>
          </View>
        ) : null}
      </View>

      <BillFilterModal
        visible={isFilterModalMounted}
        showCategoryPicker={showCategoryPicker}
        showDateRangePicker={showDateRangePicker}
        startDateInput={startDateInput}
        endDateInput={endDateInput}
        minAmountInput={minAmountInput}
        maxAmountInput={maxAmountInput}
        typeDraft={typeDraft}
        selectedCategoryId={categoryDraftId}
        selectedCategoryName={selectedCategory?.category}
        categoryOptions={categoryOptions}
        animatedBackdropStyle={animatedBackdropStyle}
        animatedFilterSheetStyle={animatedFilterSheetStyle}
        onClose={handleToggleFilters}
        onClearDateRange={handleClearDateRange}
        onOpenDateRangePicker={handleOpenDateRangePicker}
        onOpenCategoryPicker={handleOpenCategoryPicker}
        onCloseCategoryPicker={handleCloseCategoryPicker}
        onCloseDateRangePicker={handleCloseDateRangePicker}
        onStartDateChange={setStartDateInput}
        onEndDateChange={setEndDateInput}
        onMinAmountChange={setMinAmountInput}
        onMaxAmountChange={setMaxAmountInput}
        onTypeChange={setTypeDraft}
        onSelectCategory={setCategoryDraftId}
        onReset={handleResetFilters}
        onApply={handleApplyFilters}
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
          void fetchCategoryOptions();
          void loadFirstPage({ preserveRecords: true });
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
  searchLoadingText: {
    fontSize: Typography.size.footnote,
    lineHeight: Typography.lineHeight.footnote,
    fontWeight: '700',
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  listShell: {
    flex: 1,
    position: 'relative',
  },
  sectionHeader: {
    marginHorizontal: 16,
    marginBottom: 4,
  },
  sectionRowShell: {
    marginHorizontal: 16,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    overflow: 'hidden',
  },
  sectionRowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  sectionRowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginBottom: 10,
  },
  sectionRowSingle: {
    marginBottom: 10,
  },
  loadingCard: {
    marginHorizontal: 16,
    marginTop: 28,
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingHint: {
    fontSize: Typography.size.body,
    marginTop: 10,
  },
  footerLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 18,
  },
  searchLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  searchLoadingPanel: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
