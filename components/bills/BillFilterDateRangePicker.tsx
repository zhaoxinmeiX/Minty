import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { ArrowLeft, ChevronLeft, ChevronRight, CircleX } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CalendarList } from 'react-native-calendars';

import { isValidDate } from '@/src/utils/billsFilters';

import { styles as filterStyles } from './BillFilterModal.styles';

type Props = {
  startDateInput: string;
  endDateInput: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onCloseDateRangePicker: () => void;
  onClose: () => void;
};

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

const getInitialMonth = (startDate?: string, endDate?: string) => {
  const anchor = (endDate && isValidDate(endDate) ? endDate : undefined) || (startDate && isValidDate(startDate) ? startDate : undefined) || getLocalDateString(new Date());
  return anchor.slice(0, 7);
};

const buildMarkedDates = (startDate?: string, endDate?: string, accentColor?: string, rangeColor?: string, textColor?: string) => {
  const markedDates: Record<string, any> = {};

  if (startDate && isValidDate(startDate) && endDate && isValidDate(endDate)) {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    while (start <= end) {
      const dateString = getLocalDateString(start);
      const isStart = dateString === startDate;
      const isEnd = dateString === endDate;

      markedDates[dateString] = {
        startingDay: isStart,
        endingDay: isEnd,
        color: isStart || isEnd ? accentColor : rangeColor,
        textColor: isStart || isEnd ? '#FFFFFF' : textColor,
      };

      start.setDate(start.getDate() + 1);
    }

    return markedDates;
  }

  if (startDate && isValidDate(startDate)) {
    markedDates[startDate] = {
      startingDay: true,
      endingDay: true,
      color: accentColor,
      textColor: '#FFFFFF',
    };
  }

  if (endDate && isValidDate(endDate)) {
    markedDates[endDate] = {
      startingDay: true,
      endingDay: true,
      color: accentColor,
      textColor: '#FFFFFF',
    };
  }

  return markedDates;
};

export function BillFilterDateRangePicker({
  startDateInput,
  endDateInput,
  onStartDateChange,
  onEndDateChange,
  onCloseDateRangePicker,
  onClose,
}: Props) {
  const theme = Colors.light;
  const accentColor = theme.homeAccent;
  const rangeColor = 'rgba(252, 206, 180, 0.72)';
  const { width } = useWindowDimensions();

  const [currentMonth, setCurrentMonth] = useState(getInitialMonth(startDateInput, endDateInput));

  useEffect(() => {
    setCurrentMonth(getInitialMonth(startDateInput, endDateInput));
  }, [startDateInput, endDateInput]);

  const markedDates = useMemo(
    () => buildMarkedDates(startDateInput, endDateInput, accentColor, rangeColor, theme.text),
    [accentColor, endDateInput, rangeColor, startDateInput, theme.text],
  );

  const rangeSummary = startDateInput && endDateInput ? `${startDateInput} 至 ${endDateInput}` : startDateInput ? `${startDateInput} 起` : endDateInput ? `截止 ${endDateInput}` : '不限制';

  const handleDayPress = (day: any) => {
    const selectedDate = day.dateString;
    if (!isValidDate(selectedDate)) {
      return;
    }

    if (!startDateInput || (startDateInput && endDateInput)) {
      onStartDateChange(selectedDate);
      onEndDateChange('');
      return;
    }

    if (selectedDate < startDateInput) {
      onEndDateChange(startDateInput);
      onStartDateChange(selectedDate);
      return;
    }

    onEndDateChange(selectedDate);
  };

  const handleClear = () => {
    onStartDateChange('');
    onEndDateChange('');
  };

  return (
    <>
      <View style={filterStyles.filterHeaderCompact}>
        <Pressable style={filterStyles.headerIconBtnPlain} onPress={onCloseDateRangePicker} hitSlop={8}>
          <ArrowLeft size={20} color={theme.homeMuted} />
        </Pressable>
        <Text style={filterStyles.filterMainTitle}>账单时间</Text>
        <Pressable style={filterStyles.headerIconBtnPlain} onPress={onClose} hitSlop={8}>
          <CircleX size={22} color={theme.homeMuted} />
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <Text style={[styles.summaryValue, (startDateInput || endDateInput) && styles.summaryValueActive]} numberOfLines={1}>
          {rangeSummary}
        </Text>
      </View>

      <View style={styles.calendarHeader}>
        <Text style={styles.monthLabel}>
          {currentMonth.split('-')[0]}年{parseInt(currentMonth.split('-')[1] || '1', 10)}月
        </Text>
        <View style={styles.navGroup}>
          <Pressable
            style={styles.navBtn}
            onPress={() => {
              const next = parseYearMonthToLocalDate(currentMonth);
              next.setMonth(next.getMonth() - 1);
              setCurrentMonth(getLocalDateString(next).slice(0, 7));
            }}
          >
            <ChevronLeft size={20} color={theme.text} />
          </Pressable>
          <Pressable
            style={styles.navBtn}
            onPress={() => {
              const next = parseYearMonthToLocalDate(currentMonth);
              next.setMonth(next.getMonth() + 1);
              setCurrentMonth(getLocalDateString(next).slice(0, 7));
            }}
          >
            <ChevronRight size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.weekdayHeader}>
        {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
          <Text key={day} style={[styles.weekdayText, (index === 0 || index === 6) && styles.weekendText]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calendarWrapper}>
        <CalendarList
          current={`${currentMonth}-01`}
          horizontal
          pagingEnabled
          markingType="period"
          markedDates={markedDates}
          calendarWidth={width - 36}
          pastScrollRange={24}
          futureScrollRange={24}
          showScrollIndicator={false}
          staticHeader
          onDayPress={handleDayPress}
          onMonthChange={(month) => setCurrentMonth(month.dateString.slice(0, 7))}
          renderHeader={() => null}
          hideArrows
          hideDayNames
          theme={{
            calendarBackground: 'transparent',
            textDayFontSize: Typography.size.body,
            textDayFontWeight: '600',
            textMonthFontSize: Typography.size.body,
            textMonthFontWeight: '700',
            textDisabledColor: 'rgba(127, 134, 113, 0.4)',
            dayTextColor: theme.text,
            monthTextColor: theme.text,
            todayTextColor: accentColor,
            selectedDayBackgroundColor: accentColor,
          }}
        />
      </View>

      <View style={filterStyles.filterActions}>
        <Pressable style={filterStyles.resetBtn} onPress={handleClear}>
          <Text style={filterStyles.resetText}>清空</Text>
        </Pressable>
        <Pressable style={filterStyles.confirmBtn} onPress={onCloseDateRangePicker}>
          <Text style={filterStyles.confirmText}>完成</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderRadius: 18,
    backgroundColor: '#F6EDE4',
    borderWidth: 1,
    borderColor: 'rgba(110, 125, 66, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  summaryValue: {
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    color: '#7F8671',
    fontWeight: '700',
  },
  summaryValueActive: {
    color: '#2C3420',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  monthLabel: {
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    color: '#2C3420',
    fontWeight: '800',
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6EDE4',
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.size.caption,
    lineHeight: Typography.lineHeight.caption,
    fontWeight: '700',
    color: '#7F8671',
  },
  weekendText: {
    color: '#F98C58',
  },
  calendarWrapper: {
    height: 320,
    overflow: 'hidden',
  },
});
