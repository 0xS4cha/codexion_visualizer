import type { SettingsState } from '@/store/features/settingsSlice';
import type { InputState } from '@/store/features/inputSlice';

const STORAGE_KEY = 'codexion:state:v1';
const MAX_PERSISTED_CHARS = 2_000_000;

export interface PersistedState {
  settings?: Partial<SettingsState>;
  user_input?: Partial<InputState>;
}

export function loadPersistedState(): PersistedState | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PersistedState;
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    const result: PersistedState = {};
    if (parsed.settings && typeof parsed.settings === 'object') result.settings = parsed.settings;
    if (parsed.user_input && typeof parsed.user_input === 'object') {
      const { command, output } = parsed.user_input;
      result.user_input = {
        command: typeof command === 'string' ? command : '',
        output: Array.isArray(output) ? output.filter((l): l is string => typeof l === 'string') : [],
      };
    }
    return result;
  } catch {
    return undefined;
  }
}

export function savePersistedState(state: { settings: SettingsState; user_input: InputState }) {
  try {
    let payload = JSON.stringify({ settings: state.settings, user_input: state.user_input });
    if (payload.length > MAX_PERSISTED_CHARS) {
      payload = JSON.stringify({ settings: state.settings, user_input: { command: state.user_input.command, output: [] } });
    }
    localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    return;
  }
}
