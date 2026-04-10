import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CircleX, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { RecordDetailSheet } from '@/components/record/RecordDetailSheet';
import { RecordListItem } from '@/components/record/RecordListItem';
import { RecordSectionHeader } from '@/components/record/RecordSectionHeader';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { deleteRecord, getRecordsForBillList } from '@/src/db/operations';
import { RecordItem } from '@/src/db/schema';
import { useLedgers } from '@/src/hooks/useLedgers';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
import { useStore } from '@/src/store';
import { parseISODate } from '@/src/utils/date';

export default function SearchScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = Colors.light;
  const insets = useStableSafeAreaInsets();
  const activeLedgerId = useStore((state) => state.activeLedgerId);
  const bumpDataVersion = useStore((state) => state.bumpDataVersion);
  const { ledgers } = useLedgers();
  const activeLedger = ledgers.find((item) => item.id === activeLedgerId);

  const [keyword, setKeyword] = useState('');
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  const fetchRecords = useCallback(() => {
    const result = getRecordsForBillList(db, {
      ledgerId: activeLedgerId,
      keyword,
    });
    setRecords(result);
  }, [activeLedgerId, db, keyword]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useFocusEffect(
    useCallback(() => {
      fetchRecords();
    }, [fetchRecords]),
  );

  const expenseTotal = useMemo(() => records.reduce((sum, item) => (item.type === 'expense' ? sum + item.amount : sum), 0), [records]);

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
      if (item.type === 'expense') {
        group.expenseTotal += item.amount;
      }
    });

    return Array.from(groups.entries()).map(([title, group]) => ({
      title,
      data: group.data,
      expenseTotal: group.expenseTotal,
    }));
  }, [records]);

  return (
    <View style={[styles.container, { backgroundColor: theme.homeBackground, paddingTop: insets.top + 10 }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View pointerEvents="none" style={[styles.screenGlow, styles.screenGlowTop, { backgroundColor: 'rgba(252, 206, 180, 0.42)' }]} />
      <View pointerEvents="none" style={[styles.screenGlow, styles.screenGlowBottom, { backgroundColor: 'rgba(171, 215, 251, 0.34)' }]} />

      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerEyebrow, { color: theme.homeMuted }]}>Search</Text>
          <Text style={[styles.headerTitle, { color: theme.homeOlive }]}>搜索账单</Text>
        </View>
        <Pressable style={[styles.closeBtn, { backgroundColor: theme.homeSurface }]} onPress={() => router.back()}>
          <X size={18} color={theme.homeOlive} />
        </Pressable>
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.homeSurface }]}>
        <Search size={20} color={theme.homeMuted} />
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder="搜索分类、备注、金额"
          placeholderTextColor={theme.homeMuted}
          style={[styles.searchInput, { color: theme.text }]}
          autoFocus
          returnKeyType="search"
        />
        {!!keyword && (
          <Pressable onPress={() => setKeyword('')} hitSlop={8}>
            <CircleX size={18} color={theme.homeMuted} />
          </Pressable>
        )}
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: theme.homeSurface }]}>
          <Text style={[styles.summaryLabel, { color: theme.homeMuted }]}>结果数量</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>{records.length} 笔</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.homeSection }]}>
          <Text style={[styles.summaryLabel, { color: theme.homeMuted }]}>支出合计</Text>
          <Text style={[styles.summaryValue, { color: theme.expense }]}>
            {expenseTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => <RecordSectionHeader title={section.title} total={section.expenseTotal} />}
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
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: theme.homeSurface }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>没有找到相关账单</Text>
            <Text style={[styles.emptyText, { color: theme.homeMuted }]}>换个关键词，或者直接搜索金额和备注。</Text>
          </View>
        }
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  screenGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  screenGlowTop: {
    width: 200,
    height: 200,
    top: 44,
    left: -48,
  },
  screenGlowBottom: {
    width: 240,
    height: 240,
    bottom: 120,
    right: -84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  headerEyebrow: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  searchBar: {
    height: 52,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.body,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryLabel: {
    fontSize: Typography.size.caption,
    fontWeight: '600',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: Typography.size.title,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyCard: {
    marginTop: 32,
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
  emptyText: {
    fontSize: Typography.size.body,
  },
});
