import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHARACTERS, CharacterId } from '../game/characters';

export interface PartyStoreState {
  slots: [CharacterId, CharacterId, CharacterId];
  leaderIndex: 0 | 1 | 2;
  /** 戦績（直近の結果） */
  lastResult: {
    won: boolean;
    stageReached: number;
    turns: number;
    aimHit: number;
    aimTry: number;
    totalDamage: number;
  } | null;
  setSlot: (index: 0 | 1 | 2, id: CharacterId) => void;
  swapSlots: (a: number, b: number) => void;
  setLeader: (index: 0 | 1 | 2) => void;
  setLastResult: (result: PartyStoreState['lastResult']) => void;
}

const DEFAULT_SLOTS: [CharacterId, CharacterId, CharacterId] = ['nobu', 'napo', 'himi'];

export const usePartyStore = create<PartyStoreState>()(
  persist(
    (set, get) => ({
      slots: DEFAULT_SLOTS,
      leaderIndex: 0,
      lastResult: null,
      setSlot: (index, id) => {
        const slots = [...get().slots] as [CharacterId, CharacterId, CharacterId];
        const existingAt = slots.indexOf(id);
        if (existingAt >= 0 && existingAt !== index) {
          // 既に配置済みのキャラを選んだ場合は入れ替える
          slots[existingAt] = slots[index];
        }
        slots[index] = id;
        set({ slots });
      },
      swapSlots: (a, b) => {
        const slots = [...get().slots] as [CharacterId, CharacterId, CharacterId];
        [slots[a], slots[b]] = [slots[b], slots[a]];
        set({ slots });
      },
      setLeader: (index) => set({ leaderIndex: index }),
      setLastResult: (lastResult) => set({ lastResult }),
    }),
    {
      name: 'nyanslo-party-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        slots: state.slots,
        leaderIndex: state.leaderIndex,
        lastResult: state.lastResult,
      }),
    },
  ),
);

export function getCharacterOptions() {
  return CHARACTERS;
}
