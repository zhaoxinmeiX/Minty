import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getIconComponent } from '@/src/constants/icons';
import { RecordItem } from '@/src/db/schema';
import { parseISODate } from '@/src/utils/date';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type BillListRowProps = {
  item: RecordItem;
  ledgerName: string;
  showDate: boolean;
  showDivider: boolean;
  onPress: (item: RecordItem) => void;
};

export const formatRecordAmount = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const getRecordDayKey = (createdAt: string) => {
  const date = parseISODate(createdAt);
  return date ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : '';
};

export function BillListRow({ item, ledgerName, showDate, showDivider, onPress }: BillListRowProps) {
  const theme = Colors.light;
  const Icon = getIconComponent(item.icon);
  const date = parseISODate(item.created_at);
  const [, timePart = ''] = item.created_at.split(' ');
  const timeText = timePart.slice(0, 5);
  const dayText = date ? String(date.getDate()) : '--';
  const monthText = date ? `${date.getMonth() + 1}月` : '';
  const title = item.sub_category ? `${item.category}·${item.sub_category}` : item.category;
  const metaText = [timeText, ledgerName].filter(Boolean).join(' · ');
  const detailText = item.note?.trim() || `${item.type === 'expense' ? '支出' : '收入'} ${formatRecordAmount(item.amount)}`;
  const isExpense = item.type === 'expense';
  const accentColor = isExpense ? theme.expense : theme.income;
  const iconBackgroundColor = isExpense ? 'rgba(249, 140, 88, 0.12)' : 'rgba(100, 138, 92, 0.12)';

  return (
    <Pressable style={({ pressed }) => [styles.recordRow, pressed && styles.recordRowPressed]} onPress={() => onPress(item)}>
      <View style={styles.recordDate}>
        {showDate ? (
          <>
            <Text style={[styles.recordDay, { color: theme.homeMuted }]}>{dayText}</Text>
            <Text style={[styles.recordMonth, { color: theme.homeMuted }]}>{monthText}</Text>
          </>
        ) : null}
      </View>

      <View style={[styles.recordIconWrap, { backgroundColor: iconBackgroundColor }]}>
        <Icon size={16} color={accentColor} />
      </View>

      <View style={styles.recordMain}>
        <Text style={[styles.recordTitle, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.recordMeta, { color: theme.homeMuted }]} numberOfLines={1}>
          {metaText}
        </Text>
        <Text style={[styles.recordNote, { color: theme.tabIconDefault }]} numberOfLines={1}>
          {detailText}
        </Text>
      </View>

      <View style={styles.recordRight}>
        <Text style={[styles.recordAmount, { color: accentColor }]}>
          {isExpense ? '-' : '+'}
          {formatRecordAmount(item.amount)}
        </Text>
      </View>

      {showDivider && <View style={styles.recordDivider} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  recordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 11,
    position: 'relative',
  },
  recordRowPressed: {
    backgroundColor: 'rgba(110, 125, 66, 0.04)',
  },
  recordDate: {
    width: 28,
    alignItems: 'center',
    marginRight: 4,
  },
  recordDay: {
    fontSize: Typography.size.bodyLg,
    lineHeight: 16,
    fontWeight: '800',
  },
  recordMonth: {
    fontSize: Typography.size.micro,
    lineHeight: Typography.lineHeight.micro,
    fontWeight: '700',
    marginTop: 2,
  },
  recordIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  recordMain: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  recordTitle: {
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    fontWeight: '800',
    marginBottom: 2,
  },
  recordMeta: {
    fontSize: Typography.size.footnote,
    lineHeight: Typography.lineHeight.footnote,
    fontWeight: '600',
    marginBottom: 2,
  },
  recordNote: {
    fontSize: Typography.size.footnote,
    lineHeight: Typography.lineHeight.footnote,
    fontWeight: '500',
  },
  recordRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    minHeight: 28,
    paddingTop: 2,
  },
  recordAmount: {
    fontSize: Typography.size.label,
    lineHeight: Typography.lineHeight.label,
    fontWeight: '800',
  },
  recordDivider: {
    position: 'absolute',
    left: 64,
    right: 12,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(110, 125, 66, 0.12)',
  },
});
