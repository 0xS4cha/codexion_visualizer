import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const DEFAULT_LIVE_URL = 'ws://127.0.0.1:8080';

export interface SettingsState {
  instantActionPadding: number;
  dongleCooldown: number;
  liveUrl: string;
}

const initialState: SettingsState = {
  instantActionPadding: 0,
  dongleCooldown: 0,
  liveUrl: DEFAULT_LIVE_URL,
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setInstantAction: (state, action: PayloadAction<number>) => {
      state.instantActionPadding = action.payload;
    },
    setDongleCooldown: (state, action: PayloadAction<number>) => {
      state.dongleCooldown = action.payload;
    },
    setLiveUrl: (state, action: PayloadAction<string>) => {
      state.liveUrl = action.payload;
    },
  },
});

export const { setInstantAction, setDongleCooldown, setLiveUrl } = settingsSlice.actions;

export default settingsSlice.reducer;
