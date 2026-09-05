export interface Profile {
  id: string;
  telegramDisplayName: string;
  telegramUsername?: string;
  name?: string;
  city?: string;
  age?: number;
  occupation?: string;
  currentChallenge?: string;
  currentPriority?: string;
  goal90Days?: string;
  canHelpWith?: string;
  domains: string[];
  challenges: string[];
  searchKeywords: string[];
  rawProfileText: string;
  sourceMessageId?: string;
  sourceDate?: string;
  realImageReference?: string;
  avatarSeed: string;
  parserVersion?: string;
}
