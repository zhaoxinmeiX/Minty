import { Colors } from '@/constants/Colors';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface MonthPickerModalProps {
  visible: boolean;
  currentMonth: string; // YYYY-MM
  onSelect: (month: string) => void;
  onClose: () => void;
  accentColor: string;
}

export const MonthPickerModal: React.FC<MonthPickerModalProps> = ({ visible, currentMonth, onSelect, onClose, accentColor }) => {
  const theme = Colors.light;
  const { height: SCREEN_HEIGHT } = useWindowDimensions();

  const [year, setYear] = useState(parseInt(currentMonth.split('-')[0]));
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setYear(parseInt(currentMonth.split('-')[0]));
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, currentMonth]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const animatedContentStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.content, { backgroundColor: theme.card }, animatedContentStyle]}>
          <View style={styles.header}>
            <Pressable onPress={() => setYear((y) => y - 1)} style={styles.yearNav}>
              <ChevronLeft size={20} color={theme.text} />
            </Pressable>
            <Text style={[styles.yearLabel, { color: theme.text }]}>{year}年</Text>
            <Pressable onPress={() => setYear((y) => y + 1)} style={styles.yearNav}>
              <ChevronRight size={20} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.monthGrid}>
            {months.map((m) => {
              const monthStr = `${year}-${String(m).padStart(2, '0')}`;
              const isSelected = currentMonth === monthStr;
              return (
                <Pressable key={m} onPress={() => onSelect(monthStr)} style={[styles.monthBtn, isSelected && { backgroundColor: accentColor }]}>
                  <Text style={[styles.monthText, { color: isSelected ? '#000' : theme.text }]}>{m}月</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={[styles.cancelBtn, { borderTopColor: theme.border }]} onPress={onClose}>
            <Text style={[styles.cancelText, { color: theme.tabIconDefault }]}>取消</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  content: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginBottom: 20,
  },
  yearNav: { padding: 8 },
  yearLabel: { fontSize: 14, fontWeight: 'bold' },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  monthBtn: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  monthText: { fontSize: 13, fontWeight: '600' },
  cancelBtn: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  cancelText: { fontSize: 13, fontWeight: '500' },
});
