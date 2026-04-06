import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronRight, FileText, Search } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { LedgerPickerModal } from '@/components/add/LedgerPickerModal';
import { RecordDetailSheet } from '@/components/record/RecordDetailSheet';
import { RecordListItem } from '@/components/record/RecordListItem';
import { RecordSectionHeader } from '@/components/record/RecordSectionHeader';
import { Colors } from '@/constants/Colors';
import { RecordItem } from '@/src/db/schema';
import { useLedgers } from '@/src/hooks/useLedgers';
import { useRecords } from '@/src/hooks/useRecords';
import { useStore } from '@/src/store';

export default function RecordsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { activeLedgerId, setActiveLedgerId, setSelectedDateContext, setLastTab } = useStore();
  const theme = Colors.light;

  const { records, totalExpense, totalIncome, fetchRecords, remove } = useRecords(activeLedgerId);
  const { ledgers } = useLedgers();
  const activeLedger = ledgers.find((l) => l.id === activeLedgerId);

  const [selectedRecord, setSelectedRecord] = React.useState<RecordItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = React.useState(false);
  const [isLedgerModalVisible, setIsLedgerModalVisible] = React.useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchRecords();
      setSelectedDateContext(null);
      setLastTab('index');
    }, [fetchRecords, setSelectedDateContext, setLastTab]),
  );

  const sections = useMemo(() => {
    const groups = new Map<string, { records: RecordItem[]; total: number }>();
    const today = new Date();
    const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    records.forEach((r) => {
      const d = new Date(r.created_at);
      const dateKey = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
      const weekday = weekdays[d.getDay()];
      const displayDate = dateKey === todayStr ? `今天 ${d.getMonth() + 1}月${d.getDate()}日 ${weekday}` : `${d.getMonth() + 1}月${d.getDate()}日 ${weekday}`;

      if (!groups.has(displayDate)) {
        groups.set(displayDate, { records: [], total: 0 });
      }
      const group = groups.get(displayDate)!;
      group.records.push(r);
      if (r.type === 'expense') {
        group.total += r.amount;
      }
    });
    return Array.from(groups.entries()).map(([title, data]) => ({ title, data: data.records, total: data.total }));
  }, [records]);

  const handleDelete = (id: number) => {
    Alert.alert('删除记录', '确定要删除这条账目吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          remove(id);
          setIsDetailVisible(false);
        },
      },
    ]);
  };

  const handleEdit = (record: RecordItem) => {
    setIsDetailVisible(false);
    router.push({
      pathname: '/(tabs)/add',
      params: {
        id: record.id.toString(),
        mode: 'edit',
      },
    });
  };

  const handleCopy = (record: RecordItem) => {
    setIsDetailVisible(false);
    router.push({
      pathname: '/(tabs)/add',
      params: {
        id: record.id.toString(),
        mode: 'copy',
      },
    });
  };

  const openBills = () => {
    router.push('/bills');
  };

  const openSearchPage = () => {
    router.push('/search');
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Ledger Selection Row */}
      <View style={styles.topHeader}>
        <Pressable style={styles.ledgerSelector} onPress={() => setIsLedgerModalVisible(true)}>
          <Text style={[styles.ledgerName, { color: theme.text }]}>{activeLedger?.name || '家庭账本'}</Text>
          <ChevronRight size={18} color={theme.text} strokeWidth={2.5} />
        </Pressable>
        <View style={styles.headerIcons}>
          <Pressable style={styles.iconButton} onPress={openSearchPage}>
            <Search size={22} color="#333" />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={openBills}>
            <FileText size={22} color="#333" />
          </Pressable>
        </View>
      </View>

      {/* Monthly Spending Card */}
      <View style={[styles.summaryCard, { backgroundColor: '#FFD89B' }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardMonthText}>{new Date().getMonth() + 1}月 · 支出</Text>
        </View>

        <Text style={styles.cardAmountDisplay}>{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.footerStat}>
            <Text style={styles.footerLabel}>收入</Text>
            <Text style={styles.footerValue}>{totalIncome.toFixed(2)}</Text>
          </View>
          <View style={styles.footerStat}>
            <Text style={styles.footerLabel}>结余</Text>
            <Text style={styles.footerValue}>{(totalIncome - totalExpense).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>
      </View>

      {/* Bill List Header Section */}
      <View style={styles.billListHeader}>
        <Text style={[styles.billListTitle, { color: theme.text }]}>近30天账单</Text>
        <Pressable style={styles.allBillsLink} onPress={openBills}>
          <Text style={{ color: theme.tabIconDefault, fontSize: 12 }}>全部账单</Text>
          <ChevronRight size={14} color={theme.tabIconDefault} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <RecordSectionHeader title={section.title} total={section.total} />}
        renderItem={({ item }) => (
          <RecordListItem
            item={item}
            onPress={(item) => {
              setSelectedRecord(item);
              setIsDetailVisible(true);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: theme.tabIconDefault, fontSize: 12 }}>这里空空如也，去记一笔吧</Text>
          </View>
        }
      />

      <RecordDetailSheet
        visible={isDetailVisible}
        record={selectedRecord}
        ledgerName={activeLedger?.name}
        onClose={() => setIsDetailVisible(false)}
        onEdit={handleEdit}
        onCopy={handleCopy}
        onDelete={handleDelete}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 40 },
  headerContainer: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 10 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  ledgerSelector: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ledgerName: { fontSize: 14, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconButton: { padding: 4 },
  summaryCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#EEB169',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  cardHeader: { marginBottom: 12 },
  cardMonthText: { fontSize: 12, color: 'rgba(0,0,0,0.5)', fontWeight: '600' },
  cardAmountDisplay: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 20 },
  cardFooter: { flexDirection: 'row', gap: 24 },
  footerStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerLabel: { fontSize: 12, color: 'rgba(0,0,0,0.5)' },
  footerValue: { fontSize: 12, fontWeight: '600', color: '#000' },
  billListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 },
  billListTitle: { fontSize: 14, fontWeight: 'bold' },
  allBillsLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  emptyContainer: { padding: 100, alignItems: 'center' },
});
