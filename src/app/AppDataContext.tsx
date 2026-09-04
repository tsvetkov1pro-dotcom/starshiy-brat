import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { Profile } from '../types/profile';
import {
  getFavoriteProfileIds,
  getProfiles,
  getSelectedChallenges,
  getSelectedInterests,
  getSelectedSelfId,
  importTelegramFile,
  setFavoriteProfileIds,
  setSelectedChallenges,
  setSelectedInterests,
  setSelectedSelfId,
  type ImportTelegramResult,
} from '../lib/storage';

interface AppDataValue {
  profiles: Profile[];
  ready: boolean;
  selectedSelfId?: string;
  selectedInterests: string[];
  selectedChallenges: string[];
  favoriteProfileIds: string[];
  refresh: () => Promise<void>;
  selectSelf: (profileId?: string) => void;
  toggleFavorite: (profileId: string) => void;
  toggleInterest: (value: string) => void;
  toggleChallenge: (value: string) => void;
  importFile: (file: File) => Promise<ImportTelegramResult>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

function toggle(items: string[], value: string): string[] {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

export function AppDataProvider({ children }: PropsWithChildren) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [ready, setReady] = useState(false);
  const [selectedSelfId, setSelectedSelfIdState] = useState<string | undefined>(() => getSelectedSelfId());
  const [selectedInterests, setSelectedInterestsState] = useState<string[]>(() => getSelectedInterests());
  const [selectedChallenges, setSelectedChallengesState] = useState<string[]>(() => getSelectedChallenges());
  const [favoriteProfileIds, setFavoriteProfileIdsState] = useState<string[]>(() => getFavoriteProfileIds());

  const refresh = useCallback(async () => {
    setProfiles(await getProfiles());
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectSelf = useCallback((profileId?: string) => {
    setSelectedSelfId(profileId);
    setSelectedSelfIdState(profileId);
  }, []);

  const toggleFavorite = useCallback((profileId: string) => {
    setFavoriteProfileIdsState((current) => {
      const next = toggle(current, profileId);
      setFavoriteProfileIds(next);
      return next;
    });
  }, []);

  const toggleInterest = useCallback((value: string) => {
    setSelectedInterestsState((current) => {
      const next = toggle(current, value);
      setSelectedInterests(next);
      return next;
    });
  }, []);

  const toggleChallenge = useCallback((value: string) => {
    setSelectedChallengesState((current) => {
      const next = toggle(current, value);
      setSelectedChallenges(next);
      return next;
    });
  }, []);

  const importFile = useCallback(async (file: File) => {
    const result = await importTelegramFile(file);
    await refresh();
    return result;
  }, [refresh]);

  const value = useMemo<AppDataValue>(() => ({
    profiles,
    ready,
    selectedSelfId,
    selectedInterests,
    selectedChallenges,
    favoriteProfileIds,
    refresh,
    selectSelf,
    toggleFavorite,
    toggleInterest,
    toggleChallenge,
    importFile,
  }), [profiles, ready, selectedSelfId, selectedInterests, selectedChallenges, favoriteProfileIds, refresh, selectSelf, toggleFavorite, toggleInterest, toggleChallenge, importFile]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const value = useContext(AppDataContext);
  if (!value) throw new Error('useAppData must be used inside AppDataProvider');
  return value;
}
