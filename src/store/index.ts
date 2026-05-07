import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LastRecordCategorySelection = {
  categoryId: number;
  subCategoryId: number | null;
};

interface AppState {
  activeLedgerId: number;
  setActiveLedgerId: (id: number) => void;
  nickname: string;
  setNickname: (name: string) => void;
  selectedDateContext: string | null;
  setSelectedDateContext: (date: string | null) => void;
  lastTab: string;
  setLastTab: (tab: string) => void;
  dataVersion: number;
  bumpDataVersion: () => void;
  isHomeLaunchOverlayVisible: boolean;
  setHomeLaunchOverlayVisible: (visible: boolean) => void;
  lastRecordCategorySelections: Record<string, LastRecordCategorySelection>;
  setLastRecordCategorySelection: (
    ledgerId: number,
    type: 'expense' | 'income',
    selection: LastRecordCategorySelection,
  ) => void;
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
      dataVersion: 0,
      bumpDataVersion: () => set((state) => ({ dataVersion: state.dataVersion + 1 })),
      isHomeLaunchOverlayVisible: true,
      setHomeLaunchOverlayVisible: (visible) => set({ isHomeLaunchOverlayVisible: visible }),
      lastRecordCategorySelections: {},
      setLastRecordCategorySelection: (ledgerId, type, selection) =>
        set((state) => ({
          lastRecordCategorySelections: {
            ...state.lastRecordCategorySelections,
            [`${ledgerId}-${type}`]: selection,
          },
        })),
    }),
    {
      name: 'minty-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeLedgerId: state.activeLedgerId,
        nickname: state.nickname,
        lastRecordCategorySelections: state.lastRecordCategorySelections,
      }),
    }
  )
);
