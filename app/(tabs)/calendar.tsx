import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Calendar as CalendarIcon, ChevronDown, ChevronRight, Plus } from 'lucide-react-native';
import React, { startTransition, useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, InteractionManager, PixelRatio, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CalendarList, DateData } from 'react-native-calendars';

import { LedgerPickerAnchorFrame, LedgerPickerModal } from '@/components/add/LedgerPickerModal';
import { MonthPickerModal } from '@/components/calendar/MonthPickerModal';
import { RecordDetailSheet } from '@/components/record/RecordDetailSheet';
import { RecordListItem } from '@/components/record/RecordListItem';
import { RecordSectionHeader } from '@/components/record/RecordSectionHeader';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getDailySummaryByMonthAsync, getRecordsByLedgerAndMonthAsync } from '@/src/db/operations';
import { RecordItem } from '@/src/db/schema';
import { useLedgers } from '@/src/hooks/useLedgers';
import { useNavigationGuard } from '@/src/hooks/useNavigationGuard';
import { useStableSafeAreaInsets } from '@/src/hooks/useStableSafeAreaInsets';
import { useStore } from '@/src/store';
import { getLunarLabel } from '@/src/utils/lunar';

const SCREEN_HORIZONTAL_PADDING = 16;
const CALENDAR_SHELL_HORIZONTAL_PADDING = 10;
const DAY_CELL_GAP = 4;
const WEEK_ROW_GAP = 4;

export default function CalendarScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const navigateOnce = useNavigationGuard();
  const activeLedgerId = useStore((state) => state.activeLedgerId);
  const setActiveLedgerId = useStore((state) => state.setActiveLedgerId);
  const setSelectedDateContext = useStore((state) => state.setSelectedDateContext);
  const setLastTab = useStore((state) => state.setLastTab);
  const dataVersion = useStore((state) => state.dataVersion);
  const bumpDataVersion = useStore((state) => state.bumpDataVersion);
  const theme = Colors.light;
  const insets = useStableSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { ledgers } = useLedgers();
  const activeLedger = ledgers.find((l) => l.id === activeLedgerId);
  const displayLedgerName = useMemo(() => {
    const rawName = activeLedger?.name || '账本';
    const chars = Array.from(rawName);
    return chars.length > 6 ? `${chars.slice(0, 6).join('')}...` : rawName;
  }, [activeLedger?.name]);

  const todayStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [currentMonth, setCurrentMonth] = useState(todayStr.slice(0, 7));
  const [recordsByDate, setRecordsByDate] = useState<{ [date: string]: RecordItem[] }>({});
  const [dailySummaries, setDailySummaries] = useState<{ [date: string]: { expense: number; income: number } }>({});

  const [selectedRecord, setSelectedRecord] = React.useState<RecordItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = React.useState(false);
  const [isLedgerModalVisible, setIsLedgerModalVisible] = React.useState(false);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = React.useState(false);
  const [ledgerAnchorFrame, setLedgerAnchorFrame] = React.useState<LedgerPickerAnchorFrame | null>(null);

  const calendarRef = useRef<any>(null);
  const loadedRecordMonthsRef = useRef<Set<string>>(new Set());
  const loadingRecordMonthsRef = useRef<Set<string>>(new Set());
  const ledgerButtonRef = useRef<View>(null);
  const hasFocusedRef = useRef(false);
  const hasSyncedMonthRef = useRef(false);
  const currentMonthRef = useRef(currentMonth);
  const lastSyncedDataVersionRef = useRef(dataVersion);
  const dataVersionRef = useRef(0);
  const summaryRequestIdRef = useRef(0);

  const fetchMonthSummaries = useCallback(
    async (monthStr: string) => {
      const requestId = ++summaryRequestIdRef.current;
      const version = dataVersionRef.current;
      const [year, month] = monthStr.split('-');
      const summaries = await getDailySummaryByMonthAsync(db, activeLedgerId, year, month);
      if (version !== dataVersionRef.current || requestId !== summaryRequestIdRef.current) return;

      const summaryMap: { [date: string]: { expense: number; income: number } } = {};
      summaries.forEach((summary) => {
        summaryMap[summary.date] = { expense: summary.total_expense, income: summary.total_income };
      });

      startTransition(() => {
        setDailySummaries(summaryMap);
      });
    },
    [db, activeLedgerId],
  );

  const fetchRecordsForMonth = useCallback(
    async (monthStr: string, force = false) => {
      if (!force && loadedRecordMonthsRef.current.has(monthStr)) {
        return;
      }

      if (!force && loadingRecordMonthsRef.current.has(monthStr)) {
        return;
      }

      const version = dataVersionRef.current;
      loadingRecordMonthsRef.current.add(monthStr);

      const [year, month] = monthStr.split('-');
      try {
        const data = await getRecordsByLedgerAndMonthAsync(db, activeLedgerId, year, month);
        if (version !== dataVersionRef.current) return;

        const grouped: { [date: string]: RecordItem[] } = {};
        data.forEach((record) => {
          const dateKey = record.created_at.slice(0, 10);
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(record);
        });

        loadedRecordMonthsRef.current.add(monthStr);
        startTransition(() => {
          setRecordsByDate((prev) => ({ ...prev, ...grouped }));
        });
      } finally {
        loadingRecordMonthsRef.current.delete(monthStr);
      }
    },
    [db, activeLedgerId],
  );

  React.useEffect(() => {
    currentMonthRef.current = currentMonth;
  }, [currentMonth]);

  React.useEffect(() => {
    dataVersionRef.current += 1;
    summaryRequestIdRef.current += 1;
    loadedRecordMonthsRef.current.clear();
    loadingRecordMonthsRef.current.clear();
    setRecordsByDate({});
    setDailySummaries({});
  }, [activeLedgerId]);

  React.useEffect(() => {
    const monthToLoad = currentMonthRef.current;

    void (async () => {
      await Promise.all([fetchMonthSummaries(monthToLoad), fetchRecordsForMonth(monthToLoad, true)]);
      hasFocusedRef.current = true;
      lastSyncedDataVersionRef.current = useStore.getState().dataVersion;
    })();
  }, [activeLedgerId, fetchMonthSummaries, fetchRecordsForMonth]);

  useFocusEffect(
    useCallback(() => {
      setLastTab('calendar');
      setSelectedDateContext(selectedDate);

      if (!hasFocusedRef.current) {
        return;
      }

      if (lastSyncedDataVersionRef.current === dataVersion) {
        return;
      }

      const task = InteractionManager.runAfterInteractions(() => {
        void (async () => {
          await Promise.all([fetchMonthSummaries(currentMonth), fetchRecordsForMonth(currentMonth, true)]);
          lastSyncedDataVersionRef.current = useStore.getState().dataVersion;
        })();
      });

      return () => task.cancel();
    }, [currentMonth, dataVersion, fetchMonthSummaries, fetchRecordsForMonth, selectedDate, setSelectedDateContext, setLastTab]),
  );

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        calendarRef.current?.scrollToMonth(`${currentMonthRef.current}-01`);
      });

      return () => task.cancel();
    }, []),
  );

  React.useEffect(() => {
    if (!hasSyncedMonthRef.current) {
      hasSyncedMonthRef.current = true;
      return;
    }

    void fetchMonthSummaries(currentMonth);
    void fetchRecordsForMonth(currentMonth);
  }, [fetchMonthSummaries, fetchRecordsForMonth, currentMonth]);

  React.useEffect(() => {
    setSelectedDateContext(selectedDate);
  }, [selectedDate, setSelectedDateContext]);

  const handleJumpToToday = () => {
    setSelectedDate(todayStr);
    const todayMonth = todayStr.slice(0, 7);
    if (currentMonth !== todayMonth) {
      setCurrentMonth(todayMonth);
    }
    calendarRef.current?.scrollToMonth(todayStr);
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

  const openAddPage = useCallback(() => {
    navigateOnce(() => router.push({ pathname: '/add', params: { date: selectedDate } }));
  }, [navigateOnce, router, selectedDate]);

  const { calendarWidth, calendarBodyHeight, dayCellSize } = useMemo(() => {
    const contentWidth = windowWidth - SCREEN_HORIZONTAL_PADDING * 2 - CALENDAR_SHELL_HORIZONTAL_PADDING * 2;
    const availableCalendarWidth = Math.max(contentWidth, 0);
    const resolvedCalendarWidth =
      Platform.OS === 'android'
        ? Math.floor(availableCalendarWidth * PixelRatio.get()) / PixelRatio.get()
        : availableCalendarWidth;
    const resolvedDayCellSize = resolvedCalendarWidth / 7 - DAY_CELL_GAP;

    const monthStart = dayjs(`${currentMonth}-01`);
    const weeksInMonth = monthStart.isValid() ? Math.ceil((monthStart.day() + monthStart.daysInMonth()) / 7) : 6;
    const resolvedCalendarBodyHeight = weeksInMonth * (resolvedDayCellSize + WEEK_ROW_GAP) + 2;

    return {
      calendarWidth: resolvedCalendarWidth,
      calendarBodyHeight: resolvedCalendarBodyHeight,
      dayCellSize: resolvedDayCellSize,
    };
  }, [currentMonth, windowWidth]);

  const renderDay = useCallback(
    ({ date, state }: any) => {
      const dateStr = date.dateString;
      const summary = dailySummaries[dateStr];
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;
      const isCurrentMonth = state !== 'disabled';
      const hasExpense = summary?.expense > 0 && isCurrentMonth;
      const hasIncome = summary?.income > 0 && isCurrentMonth;

      let secondaryText = getLunarLabel(date.year, date.month, date.day);
      let secondaryColor = theme.homeMuted;
      if (hasExpense) {
        secondaryText = `-${summary!.expense.toFixed(2)}`;
        secondaryColor = theme.expense;
      } else if (hasIncome) {
        secondaryText = `+${summary!.income.toFixed(2)}`;
        secondaryColor = theme.income;
      }

      return (
        <Pressable
          onPress={() => setSelectedDate(dateStr)}
          style={[
            styles.dayContainer,
            { width: dayCellSize, height: dayCellSize },
            isSelected
              ? { backgroundColor: theme.homeAccent }
              : hasExpense
                ? { backgroundColor: '#FDE9DE' }
                : hasIncome
                  ? { backgroundColor: '#E7F3E7' }
                  : { backgroundColor: 'transparent' },
          ]}
        >
          <View style={[styles.dateCircle, isToday && !isSelected && { backgroundColor: 'rgba(249, 140, 88, 0.14)' }]}>
            <Text
              style={[
                styles.dateText,
                {
                  color: isSelected ? '#FFF' : isToday ? theme.homeAccent : isCurrentMonth ? theme.text : theme.tabIconDefault,
                },
              ]}
            >
              {isToday ? '今' : date.day}
            </Text>
          </View>

          <View style={styles.dayInfoSlot}>
            <Text
              style={[
                styles.lunarTextMain,
                {
                  color: isSelected ? 'rgba(255,255,255,0.86)' : isCurrentMonth ? secondaryColor : theme.tabIconDefault,
                },
              ]}
              numberOfLines={1}
            >
              {secondaryText}
            </Text>
          </View>
        </Pressable>
      );
    },
    [dailySummaries, dayCellSize, selectedDate, theme, todayStr],
  );

  const renderRecordItem = ({ item }: { item: RecordItem }) => (
    <RecordListItem
      item={item}
      onPress={(record) => {
        setSelectedRecord(record);
        setIsDetailVisible(true);
      }}
      showTime
      compact
    />
  );

  const dayRecords = useMemo(() => recordsByDate[selectedDate] || [], [recordsByDate, selectedDate]);
  const currentMonthExpense = useMemo(
    () =>
      Object.entries(dailySummaries).reduce(
        (total, [date, summary]) => (date.startsWith(`${currentMonth}-`) ? total + summary.expense : total),
        0,
      ),
    [currentMonth, dailySummaries],
  );
  const currentMonthExpenseText = useMemo(
    () => currentMonthExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [currentMonthExpense],
  );
  const monthDisplay = useMemo(() => {
    const parsed = dayjs(`${currentMonth}-01`, 'YYYY-MM-DD', true);
    return parsed.isValid() ? parsed.format('YYYY年M月') : currentMonth;
  }, [currentMonth]);
  const calendarTheme = useMemo(
    () =>
      ({
        calendarBackground: 'transparent',
        'stylesheet.calendar.main': {
          week: {
            marginTop: 0,
            marginBottom: WEEK_ROW_GAP,
            flexDirection: 'row',
            justifyContent: 'space-around',
          },
        },
      }) as any,
    [],
  );

  const sections = useMemo(() => {
    const total = dayRecords.reduce((acc, record) => acc + (record.type === 'expense' ? record.amount : 0), 0);
    const selected = dayjs(selectedDate, 'YYYY-MM-DD', true);
    if (!selected.isValid()) {
      return { title: selectedDate, total, data: dayRecords };
    }

    const m = selected.month() + 1;
    const d = selected.date();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const isToday = selected.isSame(dayjs(), 'day');
    const isYesterday = selected.isSame(dayjs().subtract(1, 'day'), 'day');

    let titlePrefix = '';
    if (isToday) titlePrefix = '今天 ';
    else if (isYesterday) titlePrefix = '昨天 ';

    const title = `${titlePrefix}${m}月${d}日 ${weekdays[selected.day()]}`;
    return { title, total, data: dayRecords };
  }, [dayRecords, selectedDate]);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent', paddingTop: insets.top }]}>

      <View style={styles.header}>
        <View ref={ledgerButtonRef} collapsable={false} style={styles.headerLedgerButtonWrap}>
          <Pressable style={[styles.headerLedgerButton, { backgroundColor: theme.homeSurface }]} onPress={openLedgerPicker}>
            <Text style={[styles.headerLedgerName, { color: theme.text }]} numberOfLines={1}>
              {displayLedgerName}
            </Text>
            <ChevronRight size={16} color={theme.homeOlive} strokeWidth={2.5} />
          </Pressable>
        </View>

        <View pointerEvents="box-none" style={styles.monthPickerCenter}>
          <Pressable style={[styles.monthPill, { backgroundColor: theme.homeSurface }]} onPress={() => setIsMonthPickerVisible(true)}>
            <Text style={[styles.monthPillText, { color: theme.text }]}>{monthDisplay}</Text>
            <ChevronDown size={16} color={theme.homeOlive} />
          </Pressable>
        </View>

        <View style={styles.headerIcons}>
          <Pressable style={[styles.iconButton, { backgroundColor: theme.homeSurface }]} onPress={handleJumpToToday}>
            <CalendarIcon size={20} color={theme.homeOlive} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.calendarShell, { backgroundColor: theme.homeSurface }]}>
        <View style={styles.weekdayHeader}>
          {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
            <Text key={day} style={[styles.weekdayText, { color: index === 0 || index === 6 ? theme.homeAccent : theme.homeMuted }]}>
              {day}
            </Text>
          ))}
        </View>

        <View style={[styles.calendarWrapper, { width: calendarWidth, height: calendarBodyHeight }]}>
          <CalendarList
            ref={calendarRef}
            current={todayStr}
            horizontal
            pagingEnabled
            calendarWidth={calendarWidth}
            calendarHeight={calendarBodyHeight}
            pastScrollRange={24}
            futureScrollRange={24}
            scrollEnabled
            showScrollIndicator={false}
            hideArrows
            hideExtraDays
            staticHeader
            disableMonthChange={false}
            hideDayNames
            renderHeader={() => null}
            calendarStyle={styles.calendar}
            onMonthChange={(month: DateData) => {
              const newMonth = month.dateString.slice(0, 7);
              if (newMonth !== currentMonth) {
                setCurrentMonth(newMonth);
              }
            }}
            dayComponent={renderDay}
            theme={calendarTheme}
            style={styles.calendar}
          />
        </View>

        <View style={[styles.monthExpenseRow, { borderTopColor: theme.border }]}>
          <Text style={[styles.monthExpenseLabel, { color: theme.homeMuted }]}>本月支出</Text>
          <Text style={[styles.monthExpenseAmount, { color: theme.expense }]}>{currentMonthExpenseText}</Text>
        </View>
      </View>

      <RecordSectionHeader title={sections.title} total={sections.total} compact />

      <FlatList
        data={dayRecords}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRecordItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: theme.homeSurface }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>这一天还没有记录</Text>
            <Text style={[styles.emptyText, { color: theme.homeMuted }]}>切到新增页补一笔，这里会自动汇总。</Text>
          </View>
        }
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

      <MonthPickerModal
        visible={isMonthPickerVisible}
        currentMonth={currentMonth}
        onSelect={(month) => {
          setCurrentMonth(month);
          calendarRef.current?.scrollToMonth(month);
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
          navigateOnce(() => router.push({ pathname: '/add', params: { id: record.id.toString(), mode: 'edit' } }));
        }}
        onCopy={(record) => {
          setIsDetailVisible(false);
          navigateOnce(() => router.push({ pathname: '/add', params: { id: record.id.toString(), mode: 'copy' } }));
        }}
        onDelete={(id) => {
          Alert.alert('删除记录', '确定要删除这条账目吗？', [
            { text: '取消', style: 'cancel' },
            {
              text: '删除',
              style: 'destructive',
              onPress: () => {
                import('@/src/db/operations').then((ops) => {
                  ops.deleteRecord(db, id);
                  bumpDataVersion();
                  setIsDetailVisible(false);
                  void fetchMonthSummaries(currentMonth);
                  void fetchRecordsForMonth(selectedDate.slice(0, 7), true);
                });
              },
            },
          ]);
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    paddingTop: 6,
    paddingBottom: 12,
    zIndex: 1,
  },
  headerLedgerButtonWrap: {
    maxWidth: 196,
    justifyContent: 'center',
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
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthPickerCenter: {
    position: 'absolute',
    top: 6,
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 999,
    maxWidth: 180,
  },
  monthPillText: {
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    fontWeight: '800',
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
  calendarShell: {
    borderRadius: 22,
    paddingHorizontal: CALENDAR_SHELL_HORIZONTAL_PADDING,
    paddingTop: 10,
    paddingBottom: 12,
    marginBottom: 4,
  },
  weekdayHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    paddingTop: 6,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.size.label,
    fontWeight: '800',
  },
  calendar: {
    marginBottom: 0,
    backgroundColor: 'transparent',
    paddingLeft: 0,
    paddingRight: 0,
  },
  calendarWrapper: {
    alignSelf: 'center',
    overflow: 'hidden',
  },
  monthExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 2,
  },
  monthExpenseLabel: {
    fontSize: Typography.size.label,
    lineHeight: Typography.lineHeight.label,
    fontWeight: '700',
  },
  monthExpenseAmount: {
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    fontWeight: '900',
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 12,
  },
  dateCircle: {
    minWidth: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dateText: {
    fontSize: Typography.size.label,
    fontWeight: '800',
  },
  dayInfoSlot: {
    minHeight: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  lunarTextMain: {
    fontSize: Typography.size.micro,
    fontWeight: '700',
    lineHeight: Typography.lineHeight.micro,
    textAlign: 'center',
  },
  listContent: {
    paddingTop: 2,
    paddingBottom: 132,
  },
  emptyContainer: {
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: Typography.size.title,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: Typography.size.body,
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
