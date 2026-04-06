import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, ChevronDown, ChevronRight, CircleX, Ellipsis, Search, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, SafeAreaView, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { LedgerPickerModal } from '@/components/add/LedgerPickerModal';
import { RecordDetailSheet } from '@/components/record/RecordDetailSheet';
import { RecordListItem } from '@/components/record/RecordListItem';
import { Colors } from '@/constants/Colors';
import { BillListType, deleteRecord, getBillListCategoryOptions, getRecordsForBillList } from '@/src/db/operations';
import { RecordItem } from '@/src/db/schema';
import { useLedgers } from '@/src/hooks/useLedgers';
import { useStore } from '@/src/store';

type RouteParams = {
  openSearch?: string;
  type?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
};

type CategoryOption = {
  category_id: number;
  category: string;
  icon: string;
};

type AppliedFilters = {
  startDate?: string;
  endDate?: string;
  type: BillListType;
  minAmount?: number;
  maxAmount?: number;
  categoryId?: number;
};

const HISTORY_KEY = 'minty-bill-search-history';

const typeOptions: Array<{ key: BillListType; label: string }> = [
  { key: 'all', label: '不限' },
  { key: 'expense', label: '支出' },
  { key: 'income', label: '收入' },
];

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime());
};

const parseNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
};

export default function BillsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const params = useLocalSearchParams<RouteParams>();
  const theme = Colors.light;
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

  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [searchOpen, setSearchOpen] = useState(params.openSearch === '1');
  const [keyword, setKeyword] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);

  const [startDateInput, setStartDateInput] = useState(initialStartDate ?? '');
  const [endDateInput, setEndDateInput] = useState(initialEndDate ?? '');
  const [typeDraft, setTypeDraft] = useState<BillListType>(typeOptions.some((t) => t.key === initialType) ? initialType : 'all');
  const [minAmountInput, setMinAmountInput] = useState('');
  const [maxAmountInput, setMaxAmountInput] = useState('');
  const [categoryDraftId, setCategoryDraftId] = useState<number | undefined>(initialCategoryId);

  const [filters, setFilters] = useState<AppliedFilters>({
    startDate: initialStartDate,
    endDate: initialEndDate,
    type: typeOptions.some((t) => t.key === initialType) ? initialType : 'all',
    categoryId: initialCategoryId,
  });

  const loadHistory = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        setSearchHistory(parsed.filter(Boolean).slice(0, 8));
      }
    } catch {
      setSearchHistory([]);
    }
  }, []);

  const persistHistory = useCallback(async (next: string[]) => {
    setSearchHistory(next);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }, []);

  const rememberKeyword = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const next = [trimmed, ...searchHistory.filter((item) => item !== trimmed)].slice(0, 8);
      await persistHistory(next);
    },
    [persistHistory, searchHistory],
  );

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
    loadHistory();
  }, [loadHistory]);

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
      const date = new Date(item.created_at);
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

  const handleDeleteHistory = async () => {
    await persistHistory([]);
  };

  const renderSectionHeader = ({ section }: { section: { title: string; expenseTotal: number } }) => (
    <View style={styles.monthHeader}>
      <Text style={styles.monthTitle}>{section.title}</Text>
      <Text style={[styles.monthTotal, { color: theme.tabIconDefault }]}>支 {section.expenseTotal.toFixed(2)}</Text>
    </View>
  );

  const renderSearchPanel = () => {
    if (!searchOpen) return null;

    return (
      <View style={styles.searchOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setSearchOpen(false)} />
        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Search size={24} color="#8D8D95" />
            <TextInput
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={() => rememberKeyword(keyword)}
              placeholder="搜索分类、备注、金额"
              placeholderTextColor="#A3A3AA"
              style={styles.searchInput}
              autoFocus
            />
            <Pressable
              onPress={() => {
                setKeyword('');
                setSearchOpen(false);
              }}
              hitSlop={8}
            >
              <CircleX size={28} color="#3F3F46" />
            </Pressable>
          </View>

          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>历史搜索</Text>
            <Pressable onPress={handleDeleteHistory} hitSlop={8}>
              <Trash2 size={20} color="#666" />
            </Pressable>
          </View>

          <View style={styles.historyWrap}>
            {searchHistory.map((item) => (
              <Pressable
                key={item}
                style={styles.historyChip}
                onPress={() => {
                  setKeyword(item);
                  rememberKeyword(item);
                }}
              >
                <Text style={styles.historyChipText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderFilterPanel = () => {
    if (!showFilters) return null;

    return (
      <Modal visible={showFilters} transparent animationType="fade" onRequestClose={() => setShowFilters(false)}>
        <Pressable style={styles.filterOverlay} onPress={() => setShowFilters(false)}>
          <Pressable style={styles.filterSheet} onPress={() => undefined}>
            <View style={styles.filterPanel}>
              <Text style={styles.filterTitle}>账单时间</Text>
              <View style={styles.rangeRow}>
                <TextInput value={startDateInput} onChangeText={setStartDateInput} placeholder="开始日期" placeholderTextColor="#B1B1B8" style={styles.rangeInput} />
                <Text style={styles.rangeDivider}>~</Text>
                <TextInput value={endDateInput} onChangeText={setEndDateInput} placeholder="结束日期" placeholderTextColor="#B1B1B8" style={styles.rangeInput} />
              </View>
              <Text style={styles.helperText}>日期格式：YYYY-MM-DD</Text>

              <Text style={[styles.filterTitle, styles.filterBlockGap]}>收支</Text>
              <View style={styles.typeWrap}>
                {typeOptions.map((option) => {
                  const selected = typeDraft === option.key;
                  return (
                    <Pressable key={option.key} style={[styles.typeChip, selected && styles.typeChipActive]} onPress={() => setTypeDraft(option.key)}>
                      <Text style={[styles.typeChipText, selected && styles.typeChipTextActive]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.filterTitle, styles.filterBlockGap]}>金额范围</Text>
              <View style={styles.rangeRow}>
                <TextInput
                  value={minAmountInput}
                  onChangeText={setMinAmountInput}
                  keyboardType="numeric"
                  placeholder="最小金额"
                  placeholderTextColor="#B1B1B8"
                  style={styles.rangeInput}
                />
                <Text style={styles.rangeDivider}>~</Text>
                <TextInput
                  value={maxAmountInput}
                  onChangeText={setMaxAmountInput}
                  keyboardType="numeric"
                  placeholder="最大金额"
                  placeholderTextColor="#B1B1B8"
                  style={styles.rangeInput}
                />
              </View>

              <Pressable style={[styles.filterRow, styles.filterBlockGap]} onPress={() => setShowCategoryPicker(true)}>
                <Text style={styles.filterTitle}>分类</Text>
                <View style={styles.filterRowRight}>
                  <Text style={styles.filterValue}>{selectedCategory?.category || '不限制'}</Text>
                  <ChevronRight size={18} color="#9CA3AF" />
                </View>
              </Pressable>

              <View style={styles.filterActions}>
                <Pressable style={styles.resetBtn} onPress={handleResetFilters}>
                  <Text style={styles.resetText}>重置</Text>
                </Pressable>
                <Pressable style={styles.confirmBtn} onPress={handleApplyFilters}>
                  <Text style={styles.confirmText}>确定</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft size={28} color="#222" />
        </Pressable>
        <Text style={styles.headerTitle}>账单列表</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={() => setSearchOpen(true)} style={styles.headerBtn}>
            <Search size={30} color="#222" />
          </Pressable>
          <Pressable style={styles.headerBtn}>
            <Ellipsis size={30} color="#222" />
          </Pressable>
        </View>
      </View>

      <View style={styles.toolbar}>
        <Pressable style={styles.toolbarChip} onPress={() => setIsLedgerModalVisible(true)}>
          <Text style={styles.toolbarChipText}>{activeLedger?.name || '家庭账本'}</Text>
          <ChevronDown size={16} color="#4B5563" />
        </Pressable>

        <View style={styles.toolbarChip}>
          <Text style={styles.toolbarChipText}>全部时间</Text>
          <ChevronDown size={16} color="#4B5563" />
        </View>

        <Pressable style={[styles.toolbarChip, showFilters && styles.toolbarChipActive]} onPress={() => setShowFilters((prev) => !prev)}>
          <Text style={[styles.toolbarChipText, showFilters && styles.toolbarChipActiveText]}>筛选</Text>
          <ChevronDown size={16} color={showFilters ? '#F59E0B' : '#4B5563'} />
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        renderItem={({ item }) => (
          <RecordListItem
            item={item}
            showTime
            onPress={(record) => {
              setSelectedRecord(record);
              setIsDetailVisible(true);
            }}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无符合条件的账单</Text>}
      />

      {renderFilterPanel()}

      {renderSearchPanel()}

      <Modal visible={showCategoryPicker} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCategoryPicker(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>选择分类</Text>
            <FlatList
              data={categoryOptions}
              keyExtractor={(item) => item.category_id.toString()}
              ListHeaderComponent={
                <Pressable
                  style={styles.modalItem}
                  onPress={() => {
                    setCategoryDraftId(undefined);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>不限制</Text>
                </Pressable>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalItem}
                  onPress={() => {
                    setCategoryDraftId(item.category_id);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.category}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: { padding: 8 },
  headerTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  toolbarChip: {
    minHeight: 38,
    borderRadius: 20,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarChipActive: {
    backgroundColor: '#FFF5E6',
  },
  toolbarChipText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  toolbarChipActiveText: { color: '#F59E0B' },

  filterPanel: {
    borderRadius: 12,
    backgroundColor: '#F8F8F9',
    borderWidth: 1,
    borderColor: '#ECECEE',
    padding: 14,
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.2)',
    paddingHorizontal: 16,
    paddingTop: 142,
  },
  filterSheet: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  filterTitle: { fontSize: 13, color: '#333', fontWeight: '600' },
  filterBlockGap: { marginTop: 14 },
  rangeRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rangeInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFEFF4',
    paddingHorizontal: 12,
    color: '#111827',
    fontSize: 12,
  },
  rangeDivider: { color: '#6B7280', fontSize: 12 },
  helperText: { marginTop: 8, color: '#9CA3AF', fontSize: 12 },

  typeWrap: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    minWidth: 70,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFEFF4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  typeChipActive: {
    backgroundColor: '#FFE9BF',
  },
  typeChipText: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  typeChipTextActive: { color: '#F59E0B' },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#ECECEE',
    paddingTop: 14,
  },
  filterRowRight: { flexDirection: 'row', alignItems: 'center' },
  filterValue: { color: '#6B7280', fontSize: 12 },

  filterActions: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  resetBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F6D28A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  confirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  listContent: { paddingBottom: 40 },
  monthHeader: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 8,
  },
  monthTitle: { color: '#374151', fontSize: 13, fontWeight: '700' },
  monthTotal: { fontSize: 13, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 120, color: '#9CA3AF', fontSize: 12 },

  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.42)',
    zIndex: 20,
  },
  searchCard: {
    marginTop: 64,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  searchRow: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, color: '#1F2937', fontSize: 12 },
  historyHeader: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  historyWrap: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', minHeight: 36 },
  historyChip: {
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyChipText: { color: '#374151', fontSize: 12 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: 16,
    backgroundColor: '#FFF',
    paddingTop: 14,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  modalItem: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEE',
  },
  modalItemText: { fontSize: 12, color: '#111827' },

  appliedHint: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  appliedHintText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
});
