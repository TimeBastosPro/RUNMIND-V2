import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ViewState {
  viewAsAthleteId: string | null;
  isCoachView: boolean;
  athleteName: string | null;
  enterCoachView: (athleteId: string, athleteName?: string | null) => void;
  exitCoachView: () => void;
}

const STORAGE_KEY = 'runmind.viewState';

async function persistState(state: Partial<ViewState>) {
  try {
    const prev = await AsyncStorage.getItem(STORAGE_KEY);
    const merged = { ...(prev ? JSON.parse(prev) : {}), ...state };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {}
}

export const useViewStore = create<ViewState>((set) => ({
  viewAsAthleteId: null,
  isCoachView: false,
  athleteName: null,
  enterCoachView: (athleteId: string, athleteName?: string | null) => {
    persistState({ viewAsAthleteId: athleteId, isCoachView: true, athleteName: athleteName || null });
    set({ viewAsAthleteId: athleteId, isCoachView: true, athleteName: athleteName || null });
  },
  exitCoachView: () => {
    persistState({ viewAsAthleteId: null, isCoachView: false, athleteName: null });
    set({ viewAsAthleteId: null, isCoachView: false, athleteName: null });
  },
}));

// Hidratar ao carregar o app
(async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      useViewStore.setState({
        viewAsAthleteId: parsed.viewAsAthleteId ?? null,
        isCoachView: !!parsed.isCoachView,
        athleteName: parsed.athleteName ?? null,
      });
    }
  } catch {}
})();