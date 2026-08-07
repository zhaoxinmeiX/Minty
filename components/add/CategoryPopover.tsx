import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getIconComponent } from '@/src/constants/icons';
import { getPopoverWidth, POPOVER_ITEM_WIDTH } from '@/src/hooks/useCategoryPopover';
import { CategoryPopoverProps } from '@/src/types';
import { LayoutGrid } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Popover, { PopoverMode, PopoverPlacement, Rect } from 'react-native-popover-view';

export const CategoryPopover: React.FC<CategoryPopoverProps> = ({ visible, subs, targetRect, selectedSub, onSelect, onClose }) => {
  const theme = Colors.light;
  const accentColor = theme.accent;
  const iconBackgroundColor = theme.homeSurfaceStrong;
  const totalItems = subs.length + 1;
  const shouldScroll = totalItems > 12;
  const popWidth = getPopoverWidth(totalItems);

  const fromRect = targetRect ? new Rect(targetRect.x, targetRect.y, targetRect.width, targetRect.height) : undefined;

  const bubbleContent = (
    <View style={styles.bubbleGrid}>
      <Pressable onPress={() => onSelect(null)} style={styles.bubbleItem}>
        <View style={[styles.bubbleIcon, { backgroundColor: iconBackgroundColor }]}>
          <LayoutGrid size={20} color={!selectedSub ? accentColor : theme.popoverText} />
        </View>
        <Text numberOfLines={1} style={[styles.bubbleText, { color: theme.popoverText }, !selectedSub && { color: accentColor, fontWeight: 'bold' }]}>全部</Text>
      </Pressable>
      {subs.map((sub) => {
        const SubIcon = getIconComponent(sub.icon);
        const isSubSel = selectedSub?.id === sub.id;
        return (
          <Pressable key={sub.id} onPress={() => onSelect(sub)} style={styles.bubbleItem}>
            <View style={[styles.bubbleIcon, { backgroundColor: iconBackgroundColor }]}>
              <SubIcon size={20} color={isSubSel ? accentColor : theme.popoverText} />
            </View>
            <Text numberOfLines={1} style={[styles.bubbleText, { color: theme.popoverText }, isSubSel && { color: accentColor, fontWeight: 'bold' }]}>{sub.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <Popover
      isVisible={visible}
      from={fromRect}
      onRequestClose={onClose}
      placement={PopoverPlacement.BOTTOM}
      mode={PopoverMode.JS_MODAL}
      arrowSize={{ width: 16, height: 10 }}
      offset={4}
      popoverStyle={[
        styles.popoverBubble,
        {
          backgroundColor: theme.popoverBg,
          width: popWidth,
        },
      ]}
      backgroundStyle={styles.popoverBackground}
    >
      {shouldScroll ? (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.bubbleScroll} contentContainerStyle={styles.bubbleScrollContent}>
          {bubbleContent}
        </ScrollView>
      ) : (
        <View style={styles.bubbleStaticContent}>{bubbleContent}</View>
      )}
    </Popover>
  );
};

const styles = StyleSheet.create({
  popoverBackground: {
    backgroundColor: 'rgba(44,52,32,0.12)',
  },
  popoverBubble: {
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  bubbleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  bubbleItem: {
    width: POPOVER_ITEM_WIDTH,
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
