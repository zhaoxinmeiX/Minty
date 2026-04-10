import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronRight, FileText, Plus, Search } from 'lucide-react-native';
import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, InteractionManager, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { LedgerPickerAnchorFrame, LedgerPickerModal } from '@/components/add/LedgerPickerModal';
import { RecordDetailSheet } from '@/components/record/RecordDetailSheet';
import { RecordListItem } from '@/components/record/RecordListItem';
import { RecordSectionHeader } from '@/components/record/RecordSectionHeader';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getMonthlyExpenseTotalAsync } from '@/src/db/operations';
import { Ledger, RecordItem } from '@/src/db/schema';
import { useLedgers } from '@/src/hooks/useLedgers';
import { useRecords } from '@/src/hooks/useRecords';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
import { useStore } from '@/src/store';
import { formatDateToISO, parseISODate } from '@/src/utils/date';

type HomeLaunchSnapshot = {
  ledgers: Ledger[];
  records: RecordItem[];
  monthTotalExpense: number;
};

const areLedgersSynced = (left: Ledger[], right: Ledger[]) =>
  left.length === right.length && left.every((ledger, index) => ledger.id === right[index]?.id);

const areRecordsSynced = (left: RecordItem[], right: RecordItem[]) =>
  left.length === right.length && left.every((record, index) => record.id === right[index]?.id);

export default function RecordsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const activeLedgerId = useStore((state) => state.activeLedgerId);
  const setActiveLedgerId = useStore((state) => state.setActiveLedgerId);
  const setSelectedDateContext = useStore((state) => state.setSelectedDateContext);
  const setLastTab = useStore((state) => state.setLastTab);
  const setHomeLaunchOverlayVisible = useStore((state) => state.setHomeLaunchOverlayVisible);
  const dataVersion = useStore((state) => state.dataVersion);
  const theme = Colors.light;
  const insets = useStableSafeAreaInsets();

  const today = new Date();
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthExpenseLabel = `${today.getMonth() + 1}月支出`;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 29);
  const recentRangeStart = formatDateToISO(startDate);
  const recentRangeEnd = formatDateToISO(today);

  const { records, fetchRecords, remove } = useRecords(activeLedgerId, undefined, recentRangeStart, recentRangeEnd, false, false);
  const { ledgers, fetchLedgers } = useLedgers(false);
  const [monthTotalExpense, setMonthTotalExpense] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isLedgerModalVisible, setIsLedgerModalVisible] = useState(false);
  const [launchSnapshot, setLaunchSnapshot] = useState<HomeLaunchSnapshot | null>(null);
  const [ledgerAnchorFrame, setLedgerAnchorFrame] = useState<LedgerPickerAnchorFrame | null>(null);
  const ledgerButtonRef = useRef<View>(null);
  const hasFocusedRef = useRef(false);
  const lastSyncedDataVersionRef = useRef(dataVersion);
  const monthSummaryRequestIdRef = useRef(0);
  const launchOverlayHideFrameRef = useRef<number | null>(null);
  const launchOverlayHideFrame2Ref = useRef<number | null>(null);
  const displayLedgers = launchSnapshot?.ledgers ?? ledgers;
  const displayRecords = launchSnapshot?.records ?? records;
  const displayMonthTotalExpense = launchSnapshot?.monthTotalExpense ?? monthTotalExpense;
  const activeLedger = displayLedgers.find((l) => l.id === activeLedgerId);
  const displayLedgerName = useMemo(() => {
    const rawName = activeLedger?.name || '家庭账本';
    const chars = Array.from(rawName);
    return chars.length > 6 ? `${chars.slice(0, 6).join('')}...` : rawName;
  }, [activeLedger?.name]);

  const fetchMonthSummary = useCallback(async () => {
    const requestId = ++monthSummaryRequestIdRef.current;
    const [year, month] = currentYearMonth.split('-');
    const total = await getMonthlyExpenseTotalAsync(db, activeLedgerId, year, month);
    if (requestId !== monthSummaryRequestIdRef.current) return;

    startTransition(() => {
      setMonthTotalExpense(total);
    });

    return total;
  }, [activeLedgerId, currentYearMonth, db]);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const [initialLedgers, initialRecords, initialMonthTotal] = await Promise.all([fetchLedgers(), fetchRecords(), fetchMonthSummary()]);
        if (isCancelled) {
          return;
        }

        hasFocusedRef.current = true;
        lastSyncedDataVersionRef.current = useStore.getState().dataVersion;
        setLaunchSnapshot({
          ledgers: initialLedgers ?? [],
          records: initialRecords ?? [],
          monthTotalExpense: initialMonthTotal ?? 0,
        });

        launchOverlayHideFrameRef.current = requestAnimationFrame(() => {
          launchOverlayHideFrame2Ref.current = requestAnimationFrame(() => {
            if (!isCancelled) {
              setHomeLaunchOverlayVisible(false);
            }
          });
        });
      } finally {
        if (!isCancelled && launchOverlayHideFrameRef.current === null) {
          setHomeLaunchOverlayVisible(false);
        }
      }
    })();

    return () => {
      isCancelled = true;

      if (launchOverlayHideFrameRef.current !== null) {
        cancelAnimationFrame(launchOverlayHideFrameRef.current);
      }

      if (launchOverlayHideFrame2Ref.current !== null) {
        cancelAnimationFrame(launchOverlayHideFrame2Ref.current);
      }
    };
  }, [fetchLedgers, fetchMonthSummary, fetchRecords, setHomeLaunchOverlayVisible]);

  useEffect(() => {
    if (!launchSnapshot) {
      return;
    }

    const isMonthReady = Math.abs(monthTotalExpense - launchSnapshot.monthTotalExpense) < 0.001;
    if (!areLedgersSynced(ledgers, launchSnapshot.ledgers) || !areRecordsSynced(records, launchSnapshot.records) || !isMonthReady) {
      return;
    }

    setLaunchSnapshot(null);
  }, [launchSnapshot, ledgers, monthTotalExpense, records]);

  useFocusEffect(
    useCallback(() => {
      setSelectedDateContext(null);
      setLastTab('index');

      if (!hasFocusedRef.current) {
        return;
      }

      if (lastSyncedDataVersionRef.current === dataVersion) {
        return;
      }

      const task = InteractionManager.runAfterInteractions(() => {
        void (async () => {
          await Promise.all([fetchLedgers(), fetchRecords(), fetchMonthSummary()]);
          lastSyncedDataVersionRef.current = useStore.getState().dataVersion;
        })();
      });

      return () => task.cancel();
    }, [dataVersion, fetchLedgers, fetchMonthSummary, fetchRecords, setSelectedDateContext, setLastTab]),
  );

  const sections = useMemo(() => {
    const groups = new Map<string, { records: RecordItem[]; total: number }>();
    const todayValue = new Date();
    const todayStr = `${todayValue.getFullYear()}年${todayValue.getMonth() + 1}月${todayValue.getDate()}日`;
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    displayRecords.forEach((record) => {
      const date = parseISODate(record.created_at);
      if (!date) return;

      const dateKey = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
      const weekday = weekdays[date.getDay()];
      const displayDate =
        dateKey === todayStr ? `今天 ${date.getMonth() + 1}月${date.getDate()}日 ${weekday}` : `${date.getMonth() + 1}月${date.getDate()}日 ${weekday}`;

      if (!groups.has(displayDate)) {
        groups.set(displayDate, { records: [], total: 0 });
      }

      const group = groups.get(displayDate)!;
      group.records.push(record);
      if (record.type === 'expense') {
        group.total += record.amount;
      }
    });

    return Array.from(groups.entries()).map(([title, data]) => ({
      title,
      data: data.records,
      total: data.total,
    }));
  }, [displayRecords]);

  const formatAmount = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleDelete = (id: number) => {
    Alert.alert('删除记录', '确定要删除这条账目吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          remove(id);
          void fetchMonthSummary();
          setIsDetailVisible(false);
        },
      },
    ]);
  };

  const handleEdit = (record: RecordItem) => {
    setIsDetailVisible(false);
    router.push({
      pathname: '/add',
      params: {
        id: record.id.toString(),
        mode: 'edit',
      },
    });
  };

  const handleCopy = (record: RecordItem) => {
    setIsDetailVisible(false);
    router.push({
      pathname: '/add',
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

  const openAddPage = () => {
    router.push('/add');
  };

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

  const renderFixedHeader = () => (
    <View style={styles.fixedHeader}>
      <View style={styles.topHeader}>
        <View ref={ledgerButtonRef} collapsable={false} style={styles.headerLedgerButtonWrap}>
          <Pressable style={[styles.headerLedgerButton, { backgroundColor: theme.homeSurface }]} onPress={openLedgerPicker}>
            <Text style={[styles.headerLedgerName, { color: theme.text }]} numberOfLines={1}>
              {displayLedgerName}
            </Text>
            <ChevronRight size={16} color={theme.homeOlive} strokeWidth={2.5} />
          </Pressable>
        </View>
        <View style={styles.headerIcons}>
          <Pressable style={[styles.iconButton, { backgroundColor: theme.homeSurface }]} onPress={openSearchPage}>
            <Search size={20} color={theme.homeOlive} />
          </Pressable>
          <Pressable style={[styles.iconButton, { backgroundColor: theme.homeSurface }]} onPress={openBills}>
            <FileText size={20} color={theme.homeOlive} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      <LinearGradient colors={[theme.homeAccentSoft, theme.homeAccent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summaryCard}>
        <View style={styles.summaryDecorLayer} pointerEvents="none">
          <View style={styles.summaryOrbLarge} />
          <View style={[styles.summaryOrbSmall, { backgroundColor: 'rgba(255, 249, 241, 0.26)' }]} />
          <View style={[styles.summaryOrbBlue, { backgroundColor: 'rgba(171, 215, 251, 0.16)' }]} />
        </View>

        <View style={styles.summaryTopRow}>
          <Text style={[styles.summaryOverviewLabel, { color: 'rgba(44, 52, 32, 0.72)' }]}>{currentMonthExpenseLabel}</Text>
          <View style={[styles.summaryCountPill, { backgroundColor: 'rgba(110, 125, 66, 0.09)' }]}>
            <Text style={[styles.summaryCountText, { color: 'rgba(44, 52, 32, 0.84)' }]}>{displayRecords.length} 笔流水</Text>
          </View>
        </View>

        <Text style={[styles.summaryAmount, { color: theme.text }]}>{formatAmount(displayMonthTotalExpense)}</Text>
      </LinearGradient>

      <View style={styles.billListHeader}>
        <Text style={[styles.billListTitle, { color: theme.text }]}>近30天账单</Text>
        <Pressable style={[styles.allBillsLink, { backgroundColor: theme.homeSurface }]} onPress={openBills}>
          <Text style={[styles.allBillsText, { color: theme.homeOlive }]}>全部账单</Text>
          <ChevronRight size={14} color={theme.homeOlive} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.homeBackground, paddingTop: insets.top }]}>
      <View pointerEvents="none" style={[styles.screenGlow, styles.screenGlowTop, { backgroundColor: 'rgba(252, 206, 180, 0.42)' }]} />
      <View pointerEvents="none" style={[styles.screenGlow, styles.screenGlowRight, { backgroundColor: 'rgba(171, 215, 251, 0.22)' }]} />

      {renderFixedHeader()}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        renderSectionHeader={({ section }) => <RecordSectionHeader title={section.title} total={section.total} />}
        renderItem={({ item }) => (
          <RecordListItem
            item={item}
            onPress={(record) => {
              setSelectedRecord(record);
              setIsDetailVisible(true);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: theme.homeSurface }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>这里还没有记录</Text>
            <Pressable style={[styles.emptyActionButton, { backgroundColor: theme.homeAccent }]} onPress={openAddPage}>
              <Text style={styles.emptyActionText}>去记一笔</Text>
            </Pressable>
          </View>
        }
      />

      <Pressable accessibilityRole="button" onPress={openAddPage} style={styles.fabWrap}>
        {({ pressed }) => (
          <LinearGradient
            colors={[theme.homeAccent, '#E4743F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.fab, pressed && styles.fabPressed]}
          >
            <Plus size={24} color="#FFF" strokeWidth={2.8} />
          </LinearGradient>
        )}
      </Pressable>

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
        ledgers={displayLedgers}
        activeLedgerId={activeLedgerId}
        anchorFrame={ledgerAnchorFrame}
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
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 172,
  },
  fixedHeader: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    zIndex: 1,
  },
  listHeaderContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  screenGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  screenGlowTop: {
    width: 220,
    height: 220,
    top: 36,
    left: -56,
  },
  screenGlowRight: {
    width: 230,
    height: 230,
    top: 160,
    right: -82,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  headerLedgerButtonWrap: {
    maxWidth: 196,
    justifyContent: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerLedgerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 44,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 999,
  },
  headerLedgerName: {
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    fontWeight: '800',
    maxWidth: 132,
  },
  summaryCard: {
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  summaryDecorLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  summaryOrbLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    right: -56,
    top: -40,
    backgroundColor: 'rgba(255, 249, 241, 0.16)',
  },
  summaryOrbSmall: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    left: -18,
    bottom: 56,
  },
  summaryOrbBlue: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    right: 34,
    bottom: -8,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    minHeight: 30,
  },
  summaryOverviewLabel: {
    fontSize: Typography.size.label,
    lineHeight: Typography.lineHeight.label,
    fontWeight: '700',
    flex: 1,
    textAlignVertical: 'center',
  },
  summaryCountPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    justifyContent: 'center',
  },
  summaryCountText: {
    fontSize: Typography.size.footnote,
    lineHeight: Typography.lineHeight.footnote,
    fontWeight: '700',
  },
  summaryAmount: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  billListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  billListTitle: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  allBillsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  allBillsText: {
    fontSize: Typography.size.label,
    lineHeight: Typography.lineHeight.label,
    fontWeight: '700',
  },
  emptyContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: Typography.size.title,
    lineHeight: Typography.lineHeight.title,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyActionButton: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  emptyActionText: {
    color: '#FFF',
    fontSize: Typography.size.label,
    lineHeight: Typography.lineHeight.label,
    fontWeight: '800',
  },
  fabWrap: {
    position: 'absolute',
    right: 20,
    bottom: 112,
    borderRadius: 999,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: '#D67245',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabPressed: {
    transform: [{ scale: 0.98 }],
  },
});
