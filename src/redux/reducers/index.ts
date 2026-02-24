import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from '@/redux/slice/settingsSlice';
import inputReducer from '@/redux/slice/inputSlice'

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    user_input: inputReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;