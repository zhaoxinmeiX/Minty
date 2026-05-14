import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getFrequencyLabel, RecurringFrequency, WEEKDAY_LABELS } from '@/src/utils/recurring';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface RecurringSettingsPanelProps {
  accentColor: string;
  startDate: Date;
  endDate: Date;
  frequency: RecurringFrequency;
  dayOfWeek: number;
  dayOfMonth: number;
  previewCount: number;
  totalAmount: number;
  onStartDatePress: () => void;
  onEndDatePress: () => void;
  onFrequencyChange: (f: RecurringFrequency) => void;
  onDayOfWeekChange: (d: number) => void;
  onDayOfMonthChange: (d: number) => void;
}

const FREQUENCIES: RecurringFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly'];
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export const RecurringSettingsPanel: React.FC<RecurringSettingsPanelProps> = ({
  accentColor,
  startDate,
  endDate,
  frequency,
  dayOfWeek,
  dayOfMonth,
  previewCount,
  totalAmount,
  onStartDatePress,
  onEndDatePress,
  onFrequencyChange,
  onDayOfWeekChange,
  onDayOfMonthChange,
}) => {
  const theme = Colors.light;

  const formatDateShort = (d: Date) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>周期设置</Text>

      {/* 日期范围 */}
      <View style={styles.dateRow}>
        <Pressable onPress={onStartDatePress} style={[styles.datePill, { backgroundColor: accentColor + '12' }]}>
          <Text style={[styles.datePillLabel, { color: theme.homeMuted }]}>开始</Text>
          <Text style={[styles.datePillValue, { color: accentColor }]}>{formatDateShort(startDate)}</Text>
        </Pressable>
        <Text style={[styles.dateArrow, { color: theme.homeMuted }]}>→</Text>
        <Pressable onPress={onEndDatePress} style={[styles.datePill, { backgroundColor: accentColor + '12' }]}>
          <Text style={[styles.datePillLabel, { color: theme.homeMuted }]}>结束</Text>
          <Text style={[styles.datePillValue, { color: accentColor }]}>{formatDateShort(endDate)}</Text>
        </Pressable>
      </View>

      {/* 频率选择 */}
      <View style={[styles.freqRow, { backgroundColor: theme.homeSurfaceStrong }]}>
        {FREQUENCIES.map((f) => (
          <Pressable
            key={f}
            onPress={() => onFrequencyChange(f)}
            style={[styles.freqBtn, frequency === f && { backgroundColor: accentColor }]}
          >
            <Text style={[styles.freqText, { color: frequency === f ? '#FFF' : theme.homeMuted }]}>
              {getFrequencyLabel(f)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 具体日选择 (周/双周) */}
      {(frequency === 'weekly' || frequency === 'biweekly') && (
        <View style={styles.dayPickerRow}>
          {WEEKDAY_LABELS.map((label, index) => (
            <Pressable
              key={index}
              onPress={() => onDayOfWeekChange(index)}
              style={[styles.dayBtn, { backgroundColor: dayOfWeek === index ? accentColor : theme.homeSurfaceStrong }]}
            >
              <Text style={[styles.dayBtnText, { color: dayOfWeek === index ? '#FFF' : theme.homeMuted }]}>
                {label.replace('周', '')}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* 具体日选择 (月) */}
      {frequency === 'monthly' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthDayScroll}>
          {MONTH_DAYS.map((day) => (
            <Pressable
              key={day}
              onPress={() => onDayOfMonthChange(day)}
              style={[styles.monthDayBtn, { backgroundColor: dayOfMonth === day ? accentColor : theme.homeSurfaceStrong }]}
            >
              <Text style={[styles.monthDayText, { color: dayOfMonth === day ? '#FFF' : theme.homeMuted }]}>
                {day}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* 预览条数 */}
      <View style={[styles.previewBar, { backgroundColor: accentColor + '08' }]}>
        <Text style={[styles.previewText, { color: accentColor }]}>
          将生成 <Text style={styles.previewCountText}>{previewCount}</Text> 条记录
          {totalAmount > 0 && <Text style={{ color: theme.homeMuted, fontWeight: 'normal' }}> (合计 {totalAmount.toFixed(2)})</Text>}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: Typography.size.body,
    fontWeight: '800',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  datePill: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  datePillLabel: {
    fontSize: Typography.size.micro,
    fontWeight: '600',
    marginBottom: 2,
  },
  datePillValue: {
    fontSize: Typography.size.label,
    fontWeight: '800',
  },
  dateArrow: {
    fontSize: Typography.size.body,
    fontWeight: '600',
  },
  freqRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    marginBottom: 12,
  },
  freqBtn: {
    flex: 1,
    height: 32,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  freqText: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
  },
  dayPickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  dayBtn: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBtnText: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
  },
  monthDayScroll: {
    gap: 6,
    paddingBottom: 12,
  },
  monthDayBtn: {
    width: 36,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthDayText: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
  },
  previewBar: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  previewText: {
    fontSize: Typography.size.caption,
    fontWeight: '700',
  },
  previewCountText: {
    fontSize: Typography.size.body,
    fontWeight: '900',
  },
});
