import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getIconComponent } from '@/src/constants/icons';
import { CategoryPopoverProps } from '@/src/types';
import { LayoutGrid } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export const CategoryPopover: React.FC<CategoryPopoverProps> = ({ visible, subs, position, selectedSub, onSelect, onClose }) => {
  const theme = Colors.light;
  const accentColor = theme.accent;
  const iconBackgroundColor = theme.homeSurfaceStrong;
  const shouldScroll = subs.length + 1 > 12;

  const bubbleContent = (
    <View style={styles.bubbleGrid}>
      <Pressable onPress={() => onSelect(null)} style={styles.bubbleItem}>
        <View style={[styles.bubbleIcon, { backgroundColor: iconBackgroundColor }]}>
          <LayoutGrid size={20} color={!selectedSub ? accentColor : theme.popoverText} />
        </View>
        <Text style={[styles.bubbleText, { color: theme.popoverText }, !selectedSub && { color: accentColor, fontWeight: 'bold' }]}>全部</Text>
      </Pressable>
      {subs.map((sub) => {
        const SubIcon = getIconComponent(sub.icon);
        const isSubSel = selectedSub?.id === sub.id;
        return (
          <Pressable key={sub.id} onPress={() => onSelect(sub)} style={styles.bubbleItem}>
            <View style={[styles.bubbleIcon, { backgroundColor: iconBackgroundColor }]}>
              <SubIcon size={20} color={isSubSel ? accentColor : theme.popoverText} />
            </View>
            <Text style={[styles.bubbleText, { color: theme.popoverText }, isSubSel && { color: accentColor, fontWeight: 'bold' }]}>{sub.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlayCentered}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.popoverBubble, { backgroundColor: theme.popoverBg, position: 'absolute', top: position.top, left: position.left }]}>
          <View style={[styles.bubbleArrow, { left: position.arrowLeft, backgroundColor: theme.popoverBg }]} />
          {shouldScroll ? (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.bubbleScroll} contentContainerStyle={styles.bubbleScrollContent}>
              {bubbleContent}
            </ScrollView>
          ) : (
            <View style={styles.bubbleStaticContent}>{bubbleContent}</View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(44,52,32,0.12)',
  },
  popoverBubble: {
    width: '80%',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  bubbleArrow: {
    position: 'absolute',
    top: -10,
    width: 20,
    height: 20,
    transform: [{ rotate: '45deg' }],
  },
  bubbleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  bubbleItem: {
    width: '20%', // 100% / 5 columns
    alignItems: 'center',
    marginBottom: 12,
  },
  bubbleIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: Typography.size.footnote,
    lineHeight: 16,
    textAlign: 'center',
    width: '100%',
  },
  bubbleScroll: {
    maxHeight: 280,
  },
  bubbleScrollContent: {
    paddingBottom: 2,
  },
  bubbleStaticContent: {
    paddingBottom: 0,
  },
});
