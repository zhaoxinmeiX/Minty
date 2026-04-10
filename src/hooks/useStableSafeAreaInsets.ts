import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

const fallbackInsets = initialWindowMetrics?.insets;

export function useStableSafeAreaInsets() {
  const insets = useSafeAreaInsets();

  return {
    top: Math.max(insets.top, fallbackInsets?.top ?? 0),
    right: Math.max(insets.right, fallbackInsets?.right ?? 0),
    bottom: Math.max(insets.bottom, fallbackInsets?.bottom ?? 0),
    left: Math.max(insets.left, fallbackInsets?.left ?? 0),
  };
}
