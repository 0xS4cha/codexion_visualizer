import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type VisualizerTab = 'timeline' | 'table' | 'analysis' | 'compare';

export const PLAYBACK_SPEEDS = [0.1, 0.25, 0.5, 1, 2, 5, 10];

export interface ViewState {
  activeTab: VisualizerTab;
  cursor: number;
  playing: boolean;
  speed: number;
  focusSeq: number;
  focusCoderId: number | null;
}

const initialState: ViewState = {
  activeTab: 'timeline',
  cursor: 0,
  playing: false,
  speed: 1,
  focusSeq: 0,
  focusCoderId: null,
};

export const viewSlice = createSlice({
  name: 'view',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<VisualizerTab>) => {
      state.activeTab = action.payload;
    },
    setCursor: (state, action: PayloadAction<number>) => {
      state.cursor = action.payload;
    },
    setPlaying: (state, action: PayloadAction<boolean>) => {
      state.playing = action.payload;
    },
    setSpeed: (state, action: PayloadAction<number>) => {
      state.speed = action.payload;
    },
    focusAt: (state, action: PayloadAction<{ time: number; tab?: VisualizerTab; coderId?: number }>) => {
      state.cursor = action.payload.time;
      state.focusCoderId = action.payload.coderId ?? null;
      state.playing = false;
      if (action.payload.tab) state.activeTab = action.payload.tab;
      state.focusSeq += 1;
    },
  },
});

export const { setActiveTab, setCursor, setPlaying, setSpeed, focusAt } = viewSlice.actions;

export default viewSlice.reducer;
