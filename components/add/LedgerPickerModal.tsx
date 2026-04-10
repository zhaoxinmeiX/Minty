import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Ledger } from '@/src/db/schema';
import { Check } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface LedgerPickerModalProps {
  visible: boolean;
  ledgers: Ledger[];
  activeLedgerId: number;
  onSelect: (id: number) => void;
  onClose: () => void;
}

export const LedgerPickerModal: React.FC<LedgerPickerModalProps> = ({ visible, ledgers, activeLedgerId, onSelect, onClose }) => {
  const theme = Colors.light;
  const { height } = useWindowDimensions();

  // Animation values
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

  if (!visible && opacity.value === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.bottomModal, { backgroundColor: theme.card }, animatedContentStyle]}>
          <Text style={[styles.manageTitle, { color: theme.text, marginBottom: 16 }]}>选择账本</Text>
          {ledgers.map((l) => (
            <Pressable key={l.id} onPress={() => onSelect(l.id)} style={styles.ledgerSelectRow}>
              <Text style={{ color: theme.text, fontSize: Typography.size.body, fontWeight: '500' }}>{l.name}</Text>
              {activeLedgerId === l.id && <Check size={20} color={theme.tint} />}
            </Pressable>
          ))}
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
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
  },
  ledgerSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  manageTitle: { fontSize: Typography.size.title, fontWeight: 'bold' },
});
