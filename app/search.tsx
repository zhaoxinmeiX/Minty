import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CircleX, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BillListRow, formatRecordAmount, getRecordDayKey } from '@/components/record/BillListRow';
import { RecordDetailSheet } from '@/components/record/RecordDetailSheet';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { deleteRecord, getRecordsForBillListAsync } from '@/src/db/operations';
import { RecordItem } from '@/src/db/schema';
import { useLedgers } from '@/src/hooks/useLedgers';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
import { useStore } from '@/src/store';
import { groupRecordsByMonth, MonthlyRecordSection } from '@/src/utils/recordSections';

export default function SearchScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = Colors.light;
  const insets = useStableSafeAreaInsets();
  const activeLedgerId = useStore((state) => state.activeLedgerId);
  const bumpDataVersion = useStore((state) => state.bumpDataVersion);
  const { ledgers } = useLedgers();
  const activeLedger = ledgers.find((item) => item.id === activeLedgerId);
  const ledgerName = activeLedger?.name || '家庭账本';
  const requestIdRef = useRef(0);

  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchPending, setIsSearchPending] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const trimmedAppliedKeyword = appliedKeyword.trim();
  const hasKeyword = trimmedAppliedKeyword.length > 0;

  const fetchRecords = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!trimmedAppliedKeyword) {
      setRecords([]);
      setIsSearching(false);
      setIsSearchPending(false);
      return;
    }

    setIsSearchPending(true);
    setIsSearching(true);

    try {
      const result = await getRecordsForBillListAsync(db, {
        ledgerId: activeLedgerId,
        keyword: trimmedAppliedKeyword,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setRecords(result);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSearching(false);
        setIsSearchPending(false);
      }
    }
  }, [activeLedgerId, db, trimmedAppliedKeyword]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  useFocusEffect(
    useCallback(() => {
      void fetchRecords();
    }, [fetchRecords]),
  );

  const expenseTotal = useMemo(() => records.reduce((sum, item) => (item.type === 'expense' ? sum + item.amount : sum), 0), [records]);

  const sections = useMemo<MonthlyRecordSection[]>(() => groupRecordsByMonth(records), [records]);
  const handleSubmitKeyword = useCallback(() => {
    const nextKeyword = keyword.trim();

    if (nextKeyword === appliedKeyword) {
      return;
    }

    requestIdRef.current += 1;
    setIsSearchPending(nextKeyword.length > 0);
    setAppliedKeyword(nextKeyword);
  }, [appliedKeyword, keyword]);

  const handleClearKeyword = useCallback(() => {
    requestIdRef.current += 1;
    setKeyword('');
    setAppliedKeyword('');
    setRecords([]);
    setIsSearching(false);
    setIsSearchPending(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 8 }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.card,
              borderColor: 'rgba(110, 125, 66, 0.12)',
            },
          ]}
        >
          <Search size={20} color={theme.homeMuted} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="搜索分类、备注、金额"
            placeholderTextColor={theme.homeMuted}
            style={[styles.searchInput, { color: theme.text }]}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={handleSubmitKeyword}
          />
          {!!keyword && (
            <Pressable onPress={handleClearKeyword} hitSlop={8}>
              <CircleX size={18} color={theme.homeMuted} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.closeBtn,
            {
              backgroundColor: theme.homeSurface,
            },
            pressed && styles.closeBtnPressed,
          ]}
          onPress={() => router.back()}
        >
          <X size={20} color={theme.homeOlive} />
        </Pressable>
      </View>

      <View style={styles.listShell}>
        {hasKeyword ? (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryCount, { color: theme.homeMuted }]}>共 {records.length} 笔</Text>
            <Text style={[styles.summaryAmount, { color: expenseTotal > 0 ? theme.expense : theme.homeMuted }]}>
              - {formatRecordAmount(expenseTotal)}
            </Text>
          </View>
        ) : null}

        <FlatList
          data={hasKeyword ? sections : []}
          keyExtractor={(item) => item.key}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 28 }, (!hasKeyword || sections.length === 0) && styles.listContentEmpty]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={Keyboard.dismiss}
          renderItem={({ item: section }) => (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionMetaRow}>
                <View style={styles.sectionMetaLeft}>
                  <View style={[styles.sectionMetaDot, { backgroundColor: theme.homeAccent }]} />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
                  <View style={[styles.sectionCountPill, { backgroundColor: 'rgba(110, 125, 66, 0.08)' }]}>
                    <Text style={[styles.sectionCountText, { color: theme.homeMuted }]}>{section.data.length} 笔</Text>
                  </View>
                </View>
                <Text style={[styles.sectionTotalText, { color: theme.text }]}>支 {formatRecordAmount(section.expenseTotal)}</Text>
              </View>

              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: 'rgba(110, 125, 66, 0.08)',
                  },
                ]}
              >
                {section.data.map((record, index) => {
                  const currentDayKey = getRecordDayKey(record.created_at);
                  const previousDayKey = index > 0 ? getRecordDayKey(section.data[index - 1].created_at) : '';

                  return (
                    <BillListRow
                      key={record.id}
                      item={record}
                      ledgerName={ledgerName}
                      showDate={index === 0 || currentDayKey !== previousDayKey}
                      showDivider={index < section.data.length - 1}
                      onPress={(item) => {
                        setSelectedRecord(item);
                        setIsDetailVisible(true);
                      }}
                    />
                  );
                })}
              </View>
            </View>
          )}
          ListEmptyComponent={
            isSearchPending ? null : hasKeyword ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: 'rgba(110, 125, 66, 0.08)',
                  },
                ]}
              >
                <Text style={[styles.emptyTitle, { color: theme.text }]}>没有找到相关账单</Text>
                <Text style={[styles.emptyText, { color: theme.homeMuted }]}>换个关键词，或者直接搜索金额和备注。</Text>
              </View>
            ) : (
              <View style={styles.idleState}>
                <Text style={[styles.idleTitle, { color: theme.homeOlive }]}>输入关键词开始搜索</Text>
                <Text style={[styles.idleText, { color: theme.homeMuted }]}>搜索分类、备注或金额后，再展示结果。</Text>
              </View>
            )
          }
        />

        {isSearchPending ? (
          <View style={[styles.searchLoadingOverlay, { backgroundColor: 'rgba(255, 249, 241, 0.68)' }]}>
            <View style={[styles.searchLoadingPanel, { backgroundColor: 'rgba(255, 249, 241, 0.96)', borderColor: 'rgba(110, 125, 66, 0.12)' }]}>
              <ActivityIndicator size="small" color={theme.homeOlive} />
              <Text style={[styles.searchLoadingText, { color: theme.homeMuted }]}>搜索中...</Text>
            </View>
          </View>
        ) : null}
      </View>

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
          void fetchRecords();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnPressed: {
    backgroundColor: 'rgba(110, 125, 66, 0.08)',
  },
  searchBar: {
    flex: 1,
    minHeight: 42,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.body,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  summaryCount: {
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    fontWeight: '700',
  },
  summaryAmount: {
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    fontWeight: '800',
  },
  searchLoadingText: {
    fontSize: Typography.size.footnote,
    lineHeight: Typography.lineHeight.footnote,
    fontWeight: '700',
  },
  listContent: {
    paddingTop: 2,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  listShell: {
    flex: 1,
    position: 'relative',
  },
  sectionBlock: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  sectionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  sectionMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
  },
  sectionMetaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    fontWeight: '800',
  },
  sectionCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  sectionCountText: {
    fontSize: Typography.size.footnote,
    lineHeight: Typography.lineHeight.footnote,
    fontWeight: '700',
  },
  sectionTotalText: {
    fontSize: Typography.size.caption,
    lineHeight: Typography.lineHeight.caption,
  },
  sectionCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#A9B66D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  emptyCard: {
    marginTop: 32,
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: Typography.size.title,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: Typography.size.body,
  },
  idleState: {
    paddingTop: 84,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  idleTitle: {
    fontSize: Typography.size.title,
    lineHeight: Typography.lineHeight.title,
    fontWeight: '800',
    marginBottom: 8,
  },
  idleText: {
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    textAlign: 'center',
  },
  searchLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  searchLoadingPanel: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
});
