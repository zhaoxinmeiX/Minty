import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getIconComponent } from '@/src/constants/icons';
import { RecordItem } from '@/src/db/schema';
import { parseDate } from '@/src/utils/date';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface RecordListItemProps {
  item: RecordItem;
  onPress: (item: RecordItem) => void;
  showTime?: boolean;
  showDateBadge?: boolean;
  reserveDateBadgeSpace?: boolean;
}

export function RecordListItem({
  item,
  onPress,
  showTime = false,
  showDateBadge = false,
  reserveDateBadgeSpace = false,
}: RecordListItemProps) {
  const theme = Colors.light;
  const [datePart, timePart] = item.created_at.split(' ');
  const time = timePart?.slice(0, 5) || '';
  const parsedDate = datePart ? parseDate(datePart) : null;
  const dayText = parsedDate ? String(parsedDate[2]) : '';
  const monthText = parsedDate ? `${parsedDate[1]}月` : '';
  const showMeta = showTime || !!item.note;
  const Icon = getIconComponent(item.icon);
  const isExpense = item.type === 'expense';
  const iconBackgroundColor = isExpense ? '#FCE8DB' : '#E5F2E6';
  const iconColor = isExpense ? theme.homeAccent : theme.income;
  const amountBackgroundColor = isExpense ? '#FFF0E7' : '#EDF7EE';
  const amountColor = isExpense ? theme.expense : theme.income;

  return (
    <Pressable
      style={[
        styles.recordItem,
        {
          backgroundColor: theme.homeSurface,
          borderColor: 'rgba(110, 125, 66, 0.08)',
        },
      ]}
      onPress={() => onPress(item)}
    >
      {(showDateBadge || reserveDateBadgeSpace) && (
        <View
          style={[
            styles.dateBadge,
            showDateBadge && {
              backgroundColor: theme.homeSection,
            },
          ]}
        >
          {showDateBadge && (
            <>
              <Text style={[styles.dateDay, { color: theme.homeOlive }]}>{dayText}</Text>
              <Text style={[styles.dateMonth, { color: theme.homeMuted }]}>{monthText}</Text>
            </>
          )}
        </View>
      )}
      <View style={styles.iconContainer}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBackgroundColor }]}>
          <Icon size={20} color={iconColor} />
        </View>
      </View>
      <View style={styles.recordLeft}>
        <View style={[styles.categoryInfo, !(showTime || item.note) && { marginBottom: 0 }]}>
          <Text style={[styles.categoryText, { color: theme.text }]}>
            {item.category}
            {item.sub_category ? ` - ${item.sub_category}` : ''}
          </Text>
        </View>
        {showMeta && (
          <Text style={[styles.noteText, { color: theme.tabIconDefault }]} numberOfLines={1} ellipsizeMode="tail">
            {showTime ? `${time} ` : ''}
            {showTime && item.note ? `· ${item.note}` : item.note}
          </Text>
        )}
      </View>
      <View style={styles.recordRight}>
        <View style={[styles.amountPill, { backgroundColor: amountBackgroundColor }]}>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {isExpense ? '-' : '+'}
            {item.amount.toFixed(2)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 13,
    marginHorizontal: 16,
    borderRadius: 24,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#A9B66D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  dateBadge: {
    width: 42,
    minHeight: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dateDay: {
    fontSize: Typography.size.body,
    lineHeight: Typography.lineHeight.body,
    fontWeight: '700',
  },
  dateMonth: {
    fontSize: Typography.size.tiny,
    lineHeight: Typography.lineHeight.tiny,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    marginRight: 14,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordLeft: {
    flex: 1,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: Typography.size.body,
    fontWeight: '600',
  },
  noteText: {
    fontSize: Typography.size.caption,
    paddingRight: 12,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  amountPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  amountText: {
    fontSize: Typography.size.body,
    fontWeight: '800',
  },
});
