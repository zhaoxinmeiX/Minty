import { Category } from '@/src/db/schema';
import { PopoverPosition } from '@/src/types';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';

const { width } = Dimensions.get('window');

export function useCategoryPopover() {
  const [isVisible, setIsVisible] = useState(false);
  const [subs, setSubs] = useState<Category[]>([]);
  const [position, setPosition] = useState<PopoverPosition>({ top: 0, left: 0, arrowLeft: 0 });
  const categoryRefs = useRef<Map<number, View>>(new Map());

  const open = useCallback((cat: Category, subCategories: Category[]) => {
    const ref = categoryRefs.current.get(cat.id);
    if (!ref || subCategories.length === 0) {
      setIsVisible(false);
      return;
    }

    ref.measureInWindow((x, y, w, h) => {
      const popWidth = width * 0.9;
      const targetCenterX = x + w / 2;

      const popLeft = Math.max(10, Math.min(targetCenterX - popWidth / 2, width - popWidth - 10));
      const arrowX = targetCenterX - popLeft - 10;

      setPosition({
        top: y + h + 20,
        left: popLeft,
        arrowLeft: arrowX,
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
    position,
    categoryRefs,
    open,
    close,
  };
}
