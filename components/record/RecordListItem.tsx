import { Colors } from '@/constants/Colors';
import { getIconComponent } from '@/src/constants/icons';
import { RecordItem } from '@/src/db/schema';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface RecordListItemProps {
  item: RecordItem;
  onPress: (item: RecordItem) => void;
  showTime?: boolean;
}

export function RecordListItem({ item, onPress, showTime = false }: RecordListItemProps) {
  const theme = Colors.light;
  const time = item.created_at.split(' ')[1]?.slice(0, 5) || '';
  const Icon = getIconComponent(item.icon);

  return (
    <Pressable
      style={[styles.recordItem, { backgroundColor: theme.card }]}
      onPress={() => onPress(item)}
    >
      <View style={styles.iconContainer}>
        <View style={[styles.iconWrapper, { backgroundColor: '#F3F4F6' }]}>
          <Icon size={20} color="#4B5563" />
        </View>
      </View>
      <View style={styles.recordLeft}>
        <View style={[styles.categoryInfo, !(showTime || item.note) && { marginBottom: 0 }]}>
          <Text style={[styles.categoryText, { color: theme.text }]}>
            {item.category}{item.sub_category ? ` - ${item.sub_category}` : ''}
          </Text>
        </View>
        {(showTime || !!item.note) && (
          <Text style={[styles.noteText, { color: theme.tabIconDefault }]}>
            {showTime ? `${time} ` : ''}
            {showTime && item.note ? `· ${item.note}` : item.note}
          </Text>
        )}
      </View>
      <View style={styles.recordRight}>
        <Text style={[styles.amountText, { color: item.type === 'expense' ? theme.expense : theme.income }]}>
          {item.type === 'expense' ? '-' : '+'}{item.amount.toFixed(2)}
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
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
