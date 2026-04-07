import { Colors } from '@/constants/Colors';
import { getIconComponent } from '@/src/constants/icons';
import { RecordItem } from '@/src/db/schema';
import { parseISODate } from '@/src/utils/date';
import { Book, Copy, Edit, Trash2, X } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RecordDetailSheetProps {
  visible: boolean;
  record: RecordItem | null;
  ledgerName?: string;
  onClose: () => void;
  onEdit: (record: RecordItem) => void;
  onCopy: (record: RecordItem) => void;
  onDelete: (id: number) => void;
}

export const RecordDetailSheet: React.FC<RecordDetailSheetProps> = ({ visible, record, ledgerName, onClose, onEdit, onCopy, onDelete }) => {
  const theme = Colors.light;
  const { height } = useWindowDimensions();

  // Animation values (same pattern as DateTimePickerModal)
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(height, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, height]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!record) return null;

  const Icon = getIconComponent(record.category_id ? record.category : 'Question'); // Fallback logic
  const isExpense = record.type === 'expense';
  const amountColor = isExpense ? theme.expense : theme.income;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { backgroundColor: theme.card }, animatedContentStyle]}>
          <SafeAreaView edges={['bottom']}>
            {/* Header / Main Info */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                <Icon size={32} color={theme.text} />
              </View>
              <View style={styles.mainInfo}>
                <Text style={[styles.categoryName, { color: theme.text }]}>
                  {record.category}
                  {record.sub_category ? ` · ${record.sub_category}` : ''}
                </Text>
                <Text style={[styles.amount, { color: amountColor }]}>
                  {isExpense ? '-' : '+'}
                  {record.amount.toFixed(2)}
                </Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <X size={24} color={theme.tabIconDefault} />
              </Pressable>
            </View>

            {/* Note Section */}
            {record.note && (
              <View style={[styles.noteContainer, { backgroundColor: theme.background }]}>
                <Text style={[styles.noteText, { color: theme.tabIconDefault }]}>{record.note}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.tabIconDefault }]}>时间</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {(parseISODate(record.created_at) ?? new Date(record.created_at)).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  weekday: 'long',
                })}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.tabIconDefault }]}>账本</Text>
              <View style={styles.ledgerRow}>
                <View style={[styles.ledgerIconContainer, { backgroundColor: theme.accent + '20' }]}>
                  <Book size={14} color={theme.accent} />
                </View>
                <Text style={[styles.detailValue, { color: theme.text }]}>{ledgerName || '默认账本'}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Actions */}
            <View style={styles.actionsRow}>
              <Pressable style={styles.actionBtn} onPress={() => onEdit(record)}>
                <View style={[styles.actionIcon, { backgroundColor: theme.background }]}>
                  <Edit size={22} color={theme.accent} />
                </View>
                <Text style={[styles.actionText, { color: theme.tabIconDefault }]}>编辑</Text>
              </Pressable>

              <Pressable style={styles.actionBtn} onPress={() => onDelete(record.id)}>
                <View style={[styles.actionIcon, { backgroundColor: theme.background }]}>
                  <Trash2 size={22} color={theme.expense} />
                </View>
                <Text style={[styles.actionText, { color: theme.tabIconDefault }]}>删除</Text>
              </Pressable>

              <Pressable style={styles.actionBtn} onPress={() => onCopy(record)}>
                <View style={[styles.actionIcon, { backgroundColor: theme.background }]}>
                  <Copy size={22} color={theme.tint} />
                </View>
                <Text style={[styles.actionText, { color: theme.tabIconDefault }]}>复制</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mainInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  noteContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  noteText: {
    fontSize: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ledgerIconContainer: {
    padding: 4,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    marginTop: 8,
    marginBottom: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
