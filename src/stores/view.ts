import { create } from 'zustand';

interface ViewState {
  viewAsAthleteId: string | null;
  isCoachView: boolean;
  athleteName: string | null;
  enterCoachView: (athleteId: string, athleteName?: string | null) => void;
  exitCoachView: () => void;
}

export const useViewStore = create<ViewState>((set) => ({
  viewAsAthleteId: null,
  isCoachView: false,
  athleteName: null,
  enterCoachView: (athleteId: string, athleteName?: string | null) => set({ viewAsAthleteId: athleteId, isCoachView: true, athleteName: athleteName || null }),
  exitCoachView: () => set({ viewAsAthleteId: null, isCoachView: false, athleteName: null }),
}));