import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from '@/store/features/settingsSlice';
import inputReducer from '@/store/features/inputSlice'

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    user_input: inputReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
