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
  compact?: boolean;
  variant?: 'card' | 'flat';
  showDivider?: boolean;
}

export function RecordListItem({
  item,
  onPress,
  showTime = false,
  showDateBadge = false,
  reserveDateBadgeSpace = false,
  compact = false,
  variant = 'card',
  showDivider = false,
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
  const isFlat = variant === 'flat';
  const amountBackgroundColor = isFlat ? 'transparent' : isExpense ? '#FFF0E7' : '#EDF7EE';
  const amountColor = isExpense ? theme.expense : theme.income;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.recordItem,
        compact && styles.recordItemCompact,
        isFlat && styles.recordItemFlat,
        {
          backgroundColor: isFlat ? (pressed ? 'rgba(110, 125, 66, 0.04)' : 'transparent') : theme.homeSurface,
          borderColor: compact || isFlat ? 'transparent' : 'rgba(110, 125, 66, 0.08)',
        },
      ]}
      onPress={() => onPress(item)}
    >
      {(showDateBadge || reserveDateBadgeSpace) && (
        <View
          style={[
            styles.dateBadge,
            isFlat && styles.dateBadgeFlat,
            showDateBadge && {
              backgroundColor: isFlat ? 'rgba(110, 125, 66, 0.07)' : theme.homeSection,
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
        <View style={[styles.iconWrapper, isFlat && styles.iconWrapperFlat, { backgroundColor: iconBackgroundColor }]}>
          <Icon size={20} color={iconColor} />
        </View>
      </View>
      <View style={styles.recordLeft}>
        <View style={[styles.categoryInfo, !(showTime || item.note) && { marginBottom: 0 }]}>
          <Text style={[styles.categoryText, isFlat && styles.categoryTextFlat, { color: theme.text }]} numberOfLines={1}>
            {item.category}
            {item.sub_category ? ` - ${item.sub_category}` : ''}
          </Text>
        </View>
        {showMeta && (
          <Text
            style={[styles.noteText, isFlat && styles.noteTextFlat, { color: isFlat ? theme.homeMuted : theme.tabIconDefault }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {showTime ? `${time} ` : ''}
            {showTime && item.note ? `· ${item.note}` : item.note}
          </Text>
        )}
      </View>
      <View style={styles.recordRight}>
        <View style={[styles.amountPill, isFlat && styles.amountPillFlat, { backgroundColor: amountBackgroundColor }]}>
          <Text style={[styles.amountText, isFlat && styles.amountTextFlat, { color: amountColor }]}>
            {isExpense ? '-' : '+'}
            {item.amount.toFixed(2)}
          </Text>
        </View>
      </View>
      {showDivider && <View style={[styles.divider, { backgroundColor: 'rgba(110, 125, 66, 0.08)' }]} />}
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
  recordItemCompact: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 0,
    borderRadius: 20,
    borderWidth: 0,
    marginBottom: 8,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  recordItemFlat: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
    borderWidth: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: 'hidden',
  },
  dateBadge: {
    width: 42,
    minHeight: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dateBadgeFlat: {
    width: 38,
    minHeight: 40,
    borderRadius: 14,
    marginRight: 12,
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
  iconWrapperFlat: {
    width: 40,
    height: 40,
    borderRadius: 16,
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
  categoryTextFlat: {
    fontWeight: '700',
  },
  noteText: {
    fontSize: Typography.size.caption,
    paddingRight: 12,
  },
  noteTextFlat: {
    fontSize: Typography.size.label,
    lineHeight: Typography.lineHeight.label,
    paddingRight: 16,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  amountPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  amountPillFlat: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    minWidth: 86,
  },
  amountText: {
    fontSize: Typography.size.body,
    fontWeight: '800',
  },
  amountTextFlat: {
    fontSize: Typography.size.bodyLg,
    lineHeight: Typography.lineHeight.bodyLg,
    textAlign: 'right',
  },
  divider: {
    position: 'absolute',
    left: 72,
    right: 16,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});
