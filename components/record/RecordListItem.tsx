import { Colors } from '@/constants/Colors';
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

export function RecordListItem({ item, onPress, showTime = false, showDateBadge = false, reserveDateBadgeSpace = false }: RecordListItemProps) {
  const theme = Colors.light;
  const [datePart, timePart] = item.created_at.split(' ');
  const time = timePart?.slice(0, 5) || '';
  const parsedDate = datePart ? parseDate(datePart) : null;
  const dayText = parsedDate ? String(parsedDate[2]) : '';
  const monthText = parsedDate ? `${parsedDate[1]}月` : '';
  const showMeta = showTime || !!item.note;
  const Icon = getIconComponent(item.icon);

  return (
    <Pressable style={[styles.recordItem, { backgroundColor: theme.card }]} onPress={() => onPress(item)}>
      {(showDateBadge || reserveDateBadgeSpace) && (
        <View style={styles.dateBadge}>
          {showDateBadge && (
            <>
              <Text style={[styles.dateDay, { color: theme.tabIconDefault }]}>{dayText}</Text>
              <Text style={[styles.dateMonth, { color: theme.tabIconDefault }]}>{monthText}</Text>
            </>
          )}
        </View>
      )}
      <View style={styles.iconContainer}>
        <View style={[styles.iconWrapper, { backgroundColor: '#F3F4F6' }]}>
          <Icon size={20} color="#4B5563" />
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
        <Text style={[styles.amountText, { color: item.type === 'expense' ? theme.expense : theme.income }]}>
          {item.type === 'expense' ? '-' : '+'}
          {item.amount.toFixed(2)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  dateBadge: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  dateDay: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  dateMonth: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 12,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 11,
    paddingRight: 12,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
