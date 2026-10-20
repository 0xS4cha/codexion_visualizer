import { configureStore } from '@reduxjs/toolkit';
import settingsReducer, { SettingsState } from '@/store/features/settingsSlice';
import inputReducer, { InputState } from '@/store/features/inputSlice';
import viewReducer from '@/store/features/viewSlice';
import { loadPersistedState, savePersistedState } from '@/store/persistence';

const persisted = loadPersistedState();
const initialSettings = settingsReducer(undefined, { type: '@@init' });
const initialInput = inputReducer(undefined, { type: '@@init' });

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    user_input: inputReducer,
    view: viewReducer,
  },
  preloadedState: persisted
    ? {
        settings: { ...initialSettings, ...persisted.settings } as SettingsState,
        user_input: { ...initialInput, ...persisted.user_input } as InputState,
      }
    : undefined,
});

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastSettings = store.getState().settings;
let lastInput = store.getState().user_input;

store.subscribe(() => {
  const { settings, user_input } = store.getState();
  if (settings === lastSettings && user_input === lastInput) return;
  lastSettings = settings;
  lastInput = user_input;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => savePersistedState(store.getState()), 1000);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
