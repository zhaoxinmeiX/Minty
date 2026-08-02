import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

export function useNavigationGuard() {
  const isNavigatingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      isNavigatingRef.current = false;
    }, []),
  );

  return useCallback((navigate: () => void) => {
    if (isNavigatingRef.current) return;

    isNavigatingRef.current = true;
    try {
      navigate();
    } catch (error) {
      isNavigatingRef.current = false;
      throw error;
    }
  }, []);
}
