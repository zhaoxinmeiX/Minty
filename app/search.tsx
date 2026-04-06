import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CircleX, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { RecordDetailSheet } from '@/components/record/RecordDetailSheet';
import { RecordListItem } from '@/components/record/RecordListItem';
import { Colors } from '@/constants/Colors';
import { deleteRecord, getRecordsForBillList } from '@/src/db/operations';
import { RecordItem } from '@/src/db/schema';
import { useLedgers } from '@/src/hooks/useLedgers';
import { useStore } from '@/src/store';

export default function SearchScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = Colors.light;
  const { activeLedgerId } = useStore();
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

  const expenseTotal = useMemo(() => {
    return records.reduce((sum, item) => (item.type === 'expense' ? sum + item.amount : sum), 0);
  }, [records]);

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerWrap}>
        <View style={styles.searchRow}>
          <Search size={22} color="#9CA3AF" />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="搜索分类、备注、金额"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
          />
          {!!keyword && (
            <Pressable onPress={() => setKeyword('')} hitSlop={8}>
              <CircleX size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <X size={20} color="#606266" />
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.countText}>共 {records.length} 笔</Text>
        <Text style={styles.expenseText}>- {expenseTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionTotal}>支 {section.expenseTotal.toFixed(2)}</Text>
          </View>
        )}
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
        ListEmptyComponent={<Text style={styles.emptyText}>没有找到相关账单</Text>}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: {
    marginTop: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchRow: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  expenseText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 16,
    height: 32,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTotal: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 120,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
  },
});
