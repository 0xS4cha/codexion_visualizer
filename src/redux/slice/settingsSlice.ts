import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface State {
    instantActionPadding: number;
}

const initialState: State = {
    instantActionPadding: 0,
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setInstantAction: (state, action: PayloadAction<number>) => {
      state.instantActionPadding = action.payload;
    },
  },
});

export const { setInstantAction } = settingsSlice.actions;

export default settingsSlice.reducer;