import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  activeLedgerId: number;
  setActiveLedgerId: (id: number) => void;
  nickname: string;
  setNickname: (name: string) => void;
  selectedDateContext: string | null;
  setSelectedDateContext: (date: string | null) => void;
  lastTab: string;
  setLastTab: (tab: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      activeLedgerId: 1,
      setActiveLedgerId: (id) => set({ activeLedgerId: id }),
      nickname: 'Minty 用户',
      setNickname: (name) => set({ nickname: name }),
      selectedDateContext: null,
      setSelectedDateContext: (date) => set({ selectedDateContext: date }),
      lastTab: 'index',
      setLastTab: (tab) => set({ lastTab: tab }),
    }),
    {
      name: 'minty-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
