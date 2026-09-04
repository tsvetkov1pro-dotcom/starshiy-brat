export interface UiPreferences {
  density?: 'comfortable' | 'compact';
  reducedMotion?: boolean;
}

export interface OnboardingState {
  completed?: boolean;
}

export interface UserStateSnapshot {
  selectedSelfId?: string;
  favoriteProfileIds: string[];
  selectedInterests: string[];
  selectedChallenges: string[];
  uiPreferences: UiPreferences;
  onboardingState: OnboardingState;
}

const KEYS = {
  selectedSelfId: 'sb:selectedSelfId',
  favoriteProfileIds: 'sb:favoriteProfileIds',
  selectedInterests: 'sb:selectedInterests',
  selectedChallenges: 'sb:selectedChallenges',
  uiPreferences: 'sb:uiPreferences',
  onboardingState: 'sb:onboardingState',
} as const;

function getStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function readJson<T>(key: string, fallback: T): T {
  const storage = getStorage();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function readStringArray(key: string): string[] {
  const value = readJson<unknown>(key, []);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function getSelectedSelfId(): string | undefined {
  const storage = getStorage();
  if (!storage) return undefined;
  try {
    return storage.getItem(KEYS.selectedSelfId) ?? undefined;
  } catch {
    return undefined;
  }
}

export function setSelectedSelfId(profileId?: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    if (profileId) storage.setItem(KEYS.selectedSelfId, profileId);
    else storage.removeItem(KEYS.selectedSelfId);
    return true;
  } catch {
    return false;
  }
}

export const getFavoriteProfileIds = () => readStringArray(KEYS.favoriteProfileIds);
export const setFavoriteProfileIds = (ids: string[]) => writeJson(KEYS.favoriteProfileIds, [...new Set(ids)]);
export const getSelectedInterests = () => readStringArray(KEYS.selectedInterests);
export const setSelectedInterests = (values: string[]) => writeJson(KEYS.selectedInterests, [...new Set(values)]);
export const getSelectedChallenges = () => readStringArray(KEYS.selectedChallenges);
export const setSelectedChallenges = (values: string[]) => writeJson(KEYS.selectedChallenges, [...new Set(values)]);
export const getUiPreferences = () => readJson<UiPreferences>(KEYS.uiPreferences, {});
export const setUiPreferences = (value: UiPreferences) => writeJson(KEYS.uiPreferences, value);
export const getOnboardingState = () => readJson<OnboardingState>(KEYS.onboardingState, {});
export const setOnboardingState = (value: OnboardingState) => writeJson(KEYS.onboardingState, value);

export function getUserStateSnapshot(): UserStateSnapshot {
  return {
    selectedSelfId: getSelectedSelfId(),
    favoriteProfileIds: getFavoriteProfileIds(),
    selectedInterests: getSelectedInterests(),
    selectedChallenges: getSelectedChallenges(),
    uiPreferences: getUiPreferences(),
    onboardingState: getOnboardingState(),
  };
}

export function clearUserState(): void {
  const storage = getStorage();
  if (!storage) return;
  for (const key of Object.values(KEYS)) {
    try {
      storage.removeItem(key);
    } catch {
      return;
    }
  }
}

export const userStateKeys = KEYS;
