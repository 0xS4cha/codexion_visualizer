import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface InputState {
    command: string;
    output: string[];
}

const initialState: InputState = {
    command: "",
    output: []
}

export const inputSlice = createSlice({
  name: 'user_input',
  initialState,
  reducers: {
    setCommand: (state, action: PayloadAction<string>) => {
      state.command = action.payload;
    },
    setOutput: (state, action: PayloadAction<string[]>) => {
      state.output = action.payload;
    },
    appendOutput: (state, action: PayloadAction<string[]>) => {
      state.output.push(...action.payload);
    }
  },
});

export const { setCommand, setOutput, appendOutput } = inputSlice.actions;

export default inputSlice.reducer;
