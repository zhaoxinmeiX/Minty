import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Ledger } from '@/src/db/schema';
import { Check } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export interface LedgerPickerAnchorFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LedgerPickerModalProps {
  visible: boolean;
  ledgers: Ledger[];
  activeLedgerId: number;
  anchorFrame?: LedgerPickerAnchorFrame | null;
  onSelect: (id: number) => void;
  onClose: () => void;
}

export const LedgerPickerModal: React.FC<LedgerPickerModalProps> = ({ visible, ledgers, activeLedgerId, anchorFrame, onSelect, onClose }) => {
  const theme = Colors.light;
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isMounted, setIsMounted] = useState(visible);

  const translateY = useSharedValue(-8);
  const scale = useSharedValue(0.98);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    const duration = 180;

    if (visible) {
      translateY.value = withTiming(0, { duration });
      scale.value = withTiming(1, { duration });
      opacity.value = withTiming(1, { duration });
    } else {
      translateY.value = withTiming(-8, { duration });
      scale.value = withTiming(0.98, { duration });
      opacity.value = withTiming(0, { duration }, (finished) => {
        if (finished) {
          runOnJS(setIsMounted)(false);
        }
      });
    }
  }, [visible, opacity, scale, translateY]);

  const popoverMetrics = useMemo(() => {
    const horizontalMargin = 16;
    const preferredWidth = Math.max(anchorFrame?.width ?? 188, 188);
    const popoverWidth = Math.min(preferredWidth, Math.min(280, width - horizontalMargin * 2));
    const left = anchorFrame ? Math.min(Math.max(anchorFrame.x, horizontalMargin), width - popoverWidth - horizontalMargin) : horizontalMargin;
    const top = Math.max(anchorFrame ? anchorFrame.y + anchorFrame.height + 10 : insets.top + 56, insets.top + 10);
    const maxHeight = Math.max(120, Math.min(320, height - top - insets.bottom - 24));

    return { left, top, width: popoverWidth, maxHeight };
  }, [anchorFrame, height, insets.bottom, insets.top, width]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!isMounted) return null;

  return (
    <Modal visible={isMounted} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.popover,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              left: popoverMetrics.left,
              top: popoverMetrics.top,
              width: popoverMetrics.width,
              maxHeight: popoverMetrics.maxHeight,
            },
            animatedContentStyle,
          ]}
        >
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {ledgers.map((l) => (
              <Pressable
                key={l.id}
                onPress={() => onSelect(l.id)}
                style={[styles.ledgerSelectRow, activeLedgerId === l.id && { backgroundColor: theme.homeAccentSoft }]}
              >
                <Text style={[styles.ledgerSelectText, { color: theme.text }]}>{l.name}</Text>
                {activeLedgerId === l.id && <Check size={20} color={theme.homeAccent} />}
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(44,52,32,0.05)' },
  popover: {
    position: 'absolute',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 8,
    shadowColor: '#6E7D42',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  list: { flexGrow: 0 },
  listContent: { paddingBottom: 2 },
  ledgerSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
  },
  ledgerSelectText: {
    flex: 1,
    fontSize: Typography.size.body,
    fontWeight: '700',
  },
});
