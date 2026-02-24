import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface State {
  instantActionPadding: number;
  dongleCooldown: number;
}

const initialState: State = {
  instantActionPadding: 0,
  dongleCooldown: 0,
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
  },
});

export const { setInstantAction, setDongleCooldown } = settingsSlice.actions;

export default settingsSlice.reducer;