import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getLunarLabel } from '@/src/utils/lunar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronRight as ChevronRightSmall } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Dimensions, Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CalendarList } from 'react-native-calendars';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DateTimePickerModalProps {
  visible: boolean;
  tempDate: Date;
  onDateChange: (date: Date) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({ visible, tempDate, onDateChange, onConfirm, onCancel }) => {
  const theme = Colors.light;
  const accentColor = '#F59E0B'; // Orange from reference
  const { width, height } = useWindowDimensions();

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseYearMonthToLocalDate = (yearMonth: string) => {
    const [yearStr, monthStr] = yearMonth.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return new Date();
    }

    return new Date(year, month - 1, 1);
  };

  const [currentMonth, setCurrentMonth] = React.useState(getLocalDateString(tempDate).slice(0, 7));
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [showMonthYearPicker, setShowMonthYearPicker] = React.useState(false);
  const [pickerYear, setPickerYear] = React.useState(parseInt(currentMonth.split('-')[0]));

  // Animation values
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
      setCurrentMonth(getLocalDateString(tempDate).slice(0, 7));
    } else {
      translateY.value = withTiming(height, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
      setShowTimePicker(false);
    }
  }, [visible, height]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Force re-mount when jumping to today to ensure view updates
  const [calendarKey, setCalendarKey] = React.useState(Date.now());

  const handleDayPress = (day: any) => {
    const n = new Date(tempDate);
    n.setFullYear(day.year, day.month - 1, day.day);
    onDateChange(n);
  };

  const handleTimeChange = (_: any, selectedDate?: Date) => {
    if (selectedDate) {
      const n = new Date(tempDate);
      n.setHours(selectedDate.getHours());
      n.setMinutes(selectedDate.getMinutes());
      onDateChange(n);
    }
    if (Platform.OS === 'android') setShowTimePicker(false);
  };

  const handleSetToday = () => {
    const now = new Date();
    onDateChange(now);
    setCurrentMonth(getLocalDateString(now).slice(0, 7));
    setCalendarKey(Date.now());
  };

  const renderDay = ({ date, state }: any) => {
    const dateStr = date.dateString;
    const isToday = dateStr === getLocalDateString(new Date());
    const isSelected = dateStr === getLocalDateString(tempDate);
    const isDisabled = state === 'disabled';

    const lunarDay = getLunarLabel(date.year, date.month, date.day);

    return (
      <Pressable onPress={() => handleDayPress(date)} style={[styles.dayContainer, isSelected && { backgroundColor: accentColor }]}>
        <Text style={[styles.dayNumber, { color: isSelected ? '#fff' : isDisabled ? theme.tabIconDefault : theme.text }]}>{date.day}</Text>
        <Text style={[styles.lunarText, { color: isSelected ? '#fff' : theme.tabIconDefault }]}>{lunarDay}</Text>
      </Pressable>
    );
  };

  const displayTime = tempDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        </Animated.View>

        <Animated.View style={[styles.bottomModal, { backgroundColor: theme.card }, animatedContentStyle]}>
          {showTimePicker ? (
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerHeader}>
                <Text style={[styles.timePickerTitle, { color: theme.text }]}>设置时间</Text>
                <Pressable onPress={() => setShowTimePicker(false)} style={[styles.backToDateBtn, { backgroundColor: theme.background }]}>
                  <Text style={[styles.backToDateText, { color: theme.tabIconDefault }]}>返回日期</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                themeVariant="light"
                accentColor={accentColor}
                style={{ height: 216, width: '100%' }}
              />
              <View style={{ height: 40 }} />
            </View>
          ) : showMonthYearPicker ? (
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerHeader}>
                <View style={styles.yearSelector}>
                  <Pressable onPress={() => setPickerYear((p) => p - 1)} style={styles.navBtn}>
                    <ChevronLeft size={22} color={theme.text} />
                  </Pressable>
                  <Text style={[styles.timePickerTitle, { color: theme.text }]}>{pickerYear}年</Text>
                  <Pressable onPress={() => setPickerYear((p) => p + 1)} style={styles.navBtn}>
                    <ChevronRight size={22} color={theme.text} />
                  </Pressable>
                </View>
                <Pressable onPress={() => setShowMonthYearPicker(false)} style={[styles.backToDateBtn, { backgroundColor: theme.background }]}>
                  <Text style={[styles.backToDateText, { color: theme.tabIconDefault }]}>取消</Text>
                </Pressable>
              </View>

              <View style={styles.monthGrid}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const isCurrent = parseInt(currentMonth.split('-')[1]) === m && parseInt(currentMonth.split('-')[0]) === pickerYear;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => {
                        const newMonth = `${pickerYear}-${String(m).padStart(2, '0')}`;
                        setCurrentMonth(newMonth);
                        setCalendarKey(Date.now());
                        setShowMonthYearPicker(false);
                      }}
                      style={[styles.monthGridItem, isCurrent && { backgroundColor: accentColor }]}
                    >
                      <Text style={[styles.monthGridText, { color: isCurrent ? '#fff' : theme.text }]}>{m}月</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ height: 20 }} />
            </View>
          ) : (
            <>
              {/* Custom Header */}
              <View style={styles.calendarHeader}>
                <Pressable
                  onPress={() => {
                    setPickerYear(parseInt(currentMonth.split('-')[0]));
                    setShowMonthYearPicker(true);
                  }}
                  style={styles.headerLeft}
                >
                  <Text style={[styles.monthLabel, { color: theme.text }]}>
                    {currentMonth.split('-')[0]}年{parseInt(currentMonth.split('-')[1])}月
                  </Text>
                  <ChevronRightSmall size={14} color={theme.text} style={{ transform: [{ rotate: '90deg' }] }} />
                </Pressable>
                <View style={styles.headerRight}>
                  <View style={styles.navGroup}>
                    <Pressable
                      style={styles.navBtn}
                      onPress={() => {
                        const d = parseYearMonthToLocalDate(currentMonth);
                        d.setMonth(d.getMonth() - 1);
                        setCurrentMonth(getLocalDateString(d).slice(0, 7));
                        setCalendarKey(Date.now());
                      }}
                    >
                      <ChevronLeft size={22} color={theme.text} />
                    </Pressable>
                    <Pressable
                      style={styles.navBtn}
                      onPress={() => {
                        const d = parseYearMonthToLocalDate(currentMonth);
                        d.setMonth(d.getMonth() + 1);
                        setCurrentMonth(getLocalDateString(d).slice(0, 7));
                        setCalendarKey(Date.now());
                      }}
                    >
                      <ChevronRight size={22} color={theme.text} />
                    </Pressable>
                  </View>
                  <Pressable onPress={handleSetToday} style={styles.todayIconContainer}>
                    <View style={styles.calendarIconWrapper}>
                      <CalendarIcon size={24} color={theme.text} />
                      <Text style={[styles.todayChar, { color: theme.text }]}>今</Text>
                    </View>
                  </Pressable>
                </View>
              </View>

              <View style={styles.calendarWrapper}>
                {/* Fixed Weekday Header */}
                <View style={styles.weekdayHeader}>
                  {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                    <Text
                      key={day}
                      style={[
                        styles.weekdayText,
                        (index === 0 || index === 6) && { color: accentColor }, // Orange for weekends
                      ]}
                    >
                      {day}
                    </Text>
                  ))}
                </View>

                <CalendarList
                  key={calendarKey}
                  current={currentMonth + '-01'}
                  horizontal={true}
                  pagingEnabled={true}
                  calendarWidth={width - 48}
                  pastScrollRange={24}
                  futureScrollRange={24}
                  scrollEnabled={true}
                  showScrollIndicator={false}
                  staticHeader={true}
                  calendarStyle={{ paddingLeft: 0, paddingRight: 0 }}
                  onMonthChange={(m) => setCurrentMonth(m.dateString.slice(0, 7))}
                  dayComponent={renderDay}
                  hideArrows={true}
                  hideDayNames={true} // Hide internal days to allow for the fixed header
                  renderHeader={() => null}
                  style={{ paddingLeft: 0, paddingRight: 0 }}
                  theme={{
                    calendarBackground: 'transparent',
                    textSectionTitleColor: accentColor,
                    textDayHeaderFontSize: Typography.size.caption,
                    textDayHeaderFontWeight: '600',
                    // @ts-ignore
                    'stylesheet.calendar.main': {
                      week: {
                        marginTop: 0,
                        marginBottom: 0,
                        flexDirection: 'row',
                        justifyContent: 'space-around',
                      },
                    },
                  }}
                />
              </View>
            </>
          )}

          {/* New Footer */}
          <View style={styles.modalFooter}>
            <Pressable style={[styles.timeBtn, { backgroundColor: theme.background }]} onPress={() => setShowTimePicker(!showTimePicker)}>
              <Text style={[styles.timeBtnText, { color: theme.tabIconDefault }]}>{!showTimePicker ? `时间 ${displayTime}` : '修改日期'}</Text>
              <ChevronRightSmall size={14} color={theme.tabIconDefault} style={showTimePicker && { transform: [{ rotate: '180deg' }] }} />
            </Pressable>

            <Pressable onPress={onConfirm}>
              <Text style={[styles.confirmBtnText, { color: accentColor }]}>确定</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  bottomModal: {
    width: '100%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    paddingBottom: 30,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthLabel: { fontSize: Typography.size.body, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  navGroup: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  navBtn: { padding: 4 },
  todayIconContainer: { position: 'relative', padding: 4 },
  calendarIconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayChar: {
    position: 'absolute',
    bottom: 2,
    fontSize: Typography.size.micro,
    fontWeight: '900',
  },
  calendarWrapper: {
    height: 300,
    overflow: 'hidden',
  },
  dayContainer: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  dayNumber: { fontSize: Typography.size.body, fontWeight: '600', marginBottom: 2 },
  lunarText: { fontSize: Typography.size.tiny },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 16,
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  timeBtnText: { fontSize: Typography.size.body, fontWeight: '500' },
  confirmBtnText: { fontSize: Typography.size.body, fontWeight: '700' },
  weekdayHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.size.caption,
    fontWeight: '700',
    color: '#999',
  },
  timePickerContainer: {
    height: 334, // Matches calendarWrapper (300) + header (约34)
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  timePickerTitle: {
    fontSize: Typography.size.body,
    fontWeight: '700',
  },
  backToDateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  backToDateText: {
    fontSize: Typography.size.body,
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  monthGridItem: {
    width: (SCREEN_WIDTH - 48 - 60) / 3, // 3 columns
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  monthGridText: {
    fontSize: Typography.size.body,
    fontWeight: '600',
  },
});
