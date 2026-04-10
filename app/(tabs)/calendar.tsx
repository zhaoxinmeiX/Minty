import dayjs from 'dayjs';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BarChart3, Calendar as CalendarIcon, ChevronDown } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { CalendarList, DateData } from 'react-native-calendars';

import { LedgerPickerModal } from '@/components/add/LedgerPickerModal';
import { RecordDetailSheet } from '@/components/record/RecordDetailSheet';
import { RecordListItem } from '@/components/record/RecordListItem';
import { RecordSectionHeader } from '@/components/record/RecordSectionHeader';
import { Colors } from '@/constants/Colors';
import { getDailySummaryByMonth, getRecordsByLedgerAndMonth } from '@/src/db/operations';
import { RecordItem } from '@/src/db/schema';
import { useLedgers } from '@/src/hooks/useLedgers';
import { useStore } from '@/src/store';

import { MonthPickerModal } from '@/components/calendar/MonthPickerModal';
import { Typography } from '@/constants/Typography';
import { getLunarLabel } from '@/src/utils/lunar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_CELL_SIZE = (SCREEN_WIDTH - 20) / 7 - 2;
const WEEK_ROW_GAP = 4;
const CALENDAR_BODY_HEIGHT = DAY_CELL_SIZE * 6 + WEEK_ROW_GAP * 8;

export default function CalendarScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { activeLedgerId, setActiveLedgerId, setSelectedDateContext, setLastTab } = useStore();
  const theme = Colors.light;
  const { ledgers } = useLedgers();
  const activeLedger = ledgers.find((l) => l.id === activeLedgerId);

  const todayStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [currentMonth, setCurrentMonth] = useState(todayStr.slice(0, 7)); // YYYY-MM
  const [recordsByDate, setRecordsByDate] = useState<{ [date: string]: RecordItem[] }>({});
  const [dailySummaries, setDailySummaries] = useState<{ [date: string]: { expense: number; income: number } }>({});

  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isLedgerModalVisible, setIsLedgerModalVisible] = useState(false);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);

  const calendarRef = useRef<any>(null);
  const loadedRecordMonthsRef = useRef<Set<string>>(new Set());

  const fetchMonthSummaries = useCallback(
    (monthStr: string = currentMonth) => {
      const [year, month] = monthStr.split('-');
      const summaries = getDailySummaryByMonth(db, activeLedgerId, year, month);
      const summaryMap: { [date: string]: { expense: number; income: number } } = {};
      summaries.forEach((s) => {
        summaryMap[s.date] = { expense: s.total_expense, income: s.total_income };
      });
      setDailySummaries(summaryMap);
    },
    [db, activeLedgerId, currentMonth],
  );

  const fetchRecordsForMonth = useCallback(
    (monthStr: string, force = false) => {
      if (!force && loadedRecordMonthsRef.current.has(monthStr)) {
        return;
      }

      const [year, month] = monthStr.split('-');
      const data = getRecordsByLedgerAndMonth(db, activeLedgerId, year, month);

      // Group records by date for O(1) lookup
      const grouped: { [date: string]: RecordItem[] } = {};
      data.forEach((r) => {
        const dateKey = r.created_at.slice(0, 10);
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(r);
      });

      setRecordsByDate((prev) => ({ ...prev, ...grouped }));
      loadedRecordMonthsRef.current.add(monthStr);
    },
    [db, activeLedgerId],
  );

  React.useEffect(() => {
    loadedRecordMonthsRef.current.clear();
    setRecordsByDate({});
    setDailySummaries({});
  }, [activeLedgerId]);

  useFocusEffect(
    useCallback(() => {
      fetchMonthSummaries(currentMonth);
      fetchRecordsForMonth(currentMonth, true);
      setLastTab('calendar');
    }, [currentMonth, fetchMonthSummaries, fetchRecordsForMonth, setLastTab]),
  );

  // Still need to trigger fetch when currentMonth changes from swipe
  React.useEffect(() => {
    fetchMonthSummaries(currentMonth);
    // Also preload records for the visible month to ensure marks/list work smoothly
    fetchRecordsForMonth(currentMonth);
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

  const renderDay = useCallback(
    ({ date, state, marking }: any) => {
      const dateStr = date.dateString;
      const summary = dailySummaries[dateStr];
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;
      const isCurrentMonth = state !== 'disabled';

      const hasExpense = summary?.expense > 0 && isCurrentMonth;

      return (
        <Pressable onPress={() => setSelectedDate(dateStr)} style={[styles.dayContainer, hasExpense && { backgroundColor: '#FFE5E5' }]}>
          <View style={[styles.dateCircle, isSelected && { backgroundColor: theme.expense }]}>
            <Text style={[styles.dateText, { color: isSelected ? '#fff' : isToday ? theme.expense : isCurrentMonth ? theme.text : theme.tabIconDefault }]}>
              {isToday ? '今' : date.day}
            </Text>
          </View>

          <View style={styles.dayInfoSlot}>
            {hasExpense ? (
              <Text style={styles.dayExpenseText} numberOfLines={1}>
                -{summary.expense.toFixed(2)}
              </Text>
            ) : (
              <Text style={[styles.lunarTextMain, { color: isToday ? theme.expense : '#666' }]}>{getLunarLabel(date.year, date.month, date.day)}</Text>
            )}
          </View>
        </Pressable>
      );
    },
    [dailySummaries, selectedDate, theme],
  );

  const renderRecordItem = ({ item }: { item: RecordItem }) => {
    return (
      <RecordListItem
        item={item}
        onPress={(item) => {
          setSelectedRecord(item);
          setIsDetailVisible(true);
        }}
        showTime={true}
      />
    );
  };

  const dayRecords = useMemo(() => recordsByDate[selectedDate] || [], [recordsByDate, selectedDate]);
  const monthDisplay = useMemo(() => {
    const parsed = dayjs(`${currentMonth}-01`, 'YYYY-MM-DD', true);
    return parsed.isValid() ? parsed.format('YYYY年M月') : currentMonth;
  }, [currentMonth]);

  const sections = useMemo(() => {
    const total = dayRecords.reduce((acc, r) => acc + (r.type === 'expense' ? r.amount : 0), 0);

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={() => setIsLedgerModalVisible(true)} style={styles.ledgerBtn}>
          <Text style={[styles.ledgerName, { color: theme.text }]}>{activeLedger?.name || '账本'}</Text>
          <ChevronDown size={14} color={theme.text} />
        </Pressable>

        <Pressable onPress={() => setIsMonthPickerVisible(true)} style={styles.monthSelector}>
          <Text style={[styles.monthText, { color: theme.text }]}>{monthDisplay}</Text>
          <ChevronDown size={14} color={theme.text} />
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable onPress={handleJumpToToday} style={styles.actionIcon}>
            <View style={styles.calendarIconWrapper}>
              <CalendarIcon size={24} color={theme.tabIconDefault} />
              <Text style={[styles.todayChar, { color: theme.tabIconDefault }]}>今</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => router.push('/stats')} style={styles.actionIcon}>
            <BarChart3 size={24} color={theme.tabIconDefault} />
          </Pressable>
        </View>
      </View>

      {/* Fixed Weekday Header */}
      <View style={styles.weekdayHeader}>
        {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
          <Text
            key={day}
            style={[
              styles.weekdayText,
              (index === 0 || index === 6) && { color: '#F59E0B' }, // Orange for weekends
            ]}
          >
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calendarWrapper}>
        <CalendarList
          ref={calendarRef}
          current={todayStr}
          horizontal={true}
          pagingEnabled={true}
          calendarWidth={SCREEN_WIDTH}
          pastScrollRange={24}
          futureScrollRange={24}
          scrollEnabled={true}
          showScrollIndicator={false}
          hideArrows={true}
          hideExtraDays={true}
          showSixWeeks={true}
          staticHeader={true}
          disableMonthChange={false}
          hideDayNames={true}
          renderHeader={() => null}
          calendarStyle={{ paddingLeft: 10, paddingRight: 10 }}
          onMonthChange={(month: DateData) => {
            const newMonth = month.dateString.slice(0, 7);
            if (newMonth !== currentMonth) {
              setCurrentMonth(newMonth);
            }
          }}
          dayComponent={renderDay}
          theme={{
            // Keep week rows compact and avoid extra vertical spacing variance between months
            // @ts-ignore
            'stylesheet.calendar.main': {
              week: {
                marginTop: 0,
                marginBottom: WEEK_ROW_GAP,
                flexDirection: 'row',
                justifyContent: 'space-around',
              },
            },
          }}
          style={styles.calendar}
        />
      </View>

      {/* Daily Section Header */}
      <RecordSectionHeader title={sections.title} total={sections.total} />

      <FlatList
        data={dayRecords}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRecordItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: theme.tabIconDefault, fontSize: Typography.size.body }}>这一天没有记账哦</Text>
          </View>
        }
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

      <MonthPickerModal
        visible={isMonthPickerVisible}
        currentMonth={currentMonth}
        onSelect={(m) => {
          setCurrentMonth(m);
          calendarRef.current?.scrollToMonth(m);
          setIsMonthPickerVisible(false);
        }}
        onClose={() => setIsMonthPickerVisible(false)}
        accentColor={theme.expense}
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
          Alert.alert('删除记录', '确定要删除这条账目吗？', [
            { text: '取消', style: 'cancel' },
            {
              text: '删除',
              style: 'destructive',
              onPress: () => {
                import('@/src/db/operations').then((ops) => {
                  ops.deleteRecord(db, id);
                  setIsDetailVisible(false);
                  fetchMonthSummaries();
                  fetchRecordsForMonth(selectedDate.slice(0, 7));
                });
              },
            },
          ]);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ledgerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ledgerName: { fontSize: Typography.size.body, fontWeight: '600' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthText: { fontSize: Typography.size.title, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 16 },
  actionIcon: { padding: 4 },
  calendar: { marginBottom: 4 },
  calendarWrapper: {
    height: CALENDAR_BODY_HEIGHT,
    overflow: 'hidden',
  },
  dayContainer: {
    width: DAY_CELL_SIZE,
    height: DAY_CELL_SIZE,
    alignItems: 'center',
    paddingTop: 6,
    borderRadius: 8,
  },
  dateCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  dateText: { fontSize: Typography.size.label, fontWeight: '600' },
  dayInfoSlot: { height: 14, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  dayExpenseText: { fontSize: Typography.size.micro, fontWeight: '600', color: '#444', lineHeight: Typography.lineHeight.micro, textAlign: 'center' },
  listContent: { paddingBottom: 40 },
  emptyContainer: { paddingTop: 60, alignItems: 'center' },
  lunarTextMain: { fontSize: Typography.size.micro, fontWeight: '600', lineHeight: Typography.lineHeight.micro, textAlign: 'center' },
  calendarIconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  todayChar: {
    position: 'absolute',
    bottom: 2,
    fontSize: Typography.size.micro,
    fontWeight: '900',
  },
  weekdayHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.size.label,
    fontWeight: '700',
    color: '#999',
  },
});
