import { Category } from '@/src/db/schema';
import { PopoverPosition } from '@/src/types';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, Platform, StatusBar, View } from 'react-native';

const { width } = Dimensions.get('window');
export const POPOVER_ITEM_WIDTH = 60;
export const POPOVER_PADDING_H = 14;

export function getPopoverWidth(itemCount: number): number {
  const columns = Math.min(Math.max(itemCount, 1), 5);
  return columns * POPOVER_ITEM_WIDTH + POPOVER_PADDING_H * 2;
}

export interface PopoverRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useCategoryPopover() {
  const [isVisible, setIsVisible] = useState(false);
  const [subs, setSubs] = useState<Category[]>([]);
  const [targetRect, setTargetRect] = useState<PopoverRect | null>(null);
  const categoryRefs = useRef<Map<number, View>>(new Map());

  const open = useCallback((cat: Category, subCategories: Category[]) => {
    const ref = categoryRefs.current.get(cat.id);
    if (!ref || subCategories.length === 0) {
      setIsVisible(false);
      return;
    }

    ref.measureInWindow((x, y, w, h) => {
      const statusBarOffset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
      const targetY = y + statusBarOffset;

      setTargetRect({
        x,
        y: targetY,
        width: w,
        height: h,
      });
      setSubs(subCategories);
      setIsVisible(true);
    });
  }, []);

  const close = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    subs,
    targetRect,
    categoryRefs,
    open,
    close,
  };
}
