import type { Profile } from '../../types/profile';

export type RecommendationTier = 'high' | 'relevant' | 'similar';

export type RecommendationReasonKind =
  | 'can-help'
  | 'interest'
  | 'shared-challenge'
  | 'professional-overlap'
  | 'keyword-overlap'
  | 'same-city';

export interface RecommendationReason {
  kind: RecommendationReasonKind;
  label: string;
  evidence: string[];
  points: number;
}

export interface Recommendation {
  profileId: string;
  score: number;
  tier: RecommendationTier;
  reasons: RecommendationReason[];
}

export interface RecommendationInput {
  selectedSelf: Profile;
  candidates: Profile[];
  selectedInterests?: string[];
  selectedChallenges?: string[];
  limit?: number;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/giu, ' ').replace(/\s+/g, ' ').trim();
}

function tokens(value: string): Set<string> {
  const stop = new Set(['который', 'которая', 'которые', 'сейчас', 'могу', 'может', 'помочь', 'работаю', 'работает', 'очень', 'также', 'через', 'будет', 'чтобы', 'свой', 'свои']);
  return new Set(normalize(value).split(' ').filter((item) => item.length >= 4 && !stop.has(item)));
}

function intersection(a: string[], b: string[]): string[] {
  const normalizedB = new Map(b.map((item) => [normalize(item), item]));
  return [...new Set(a.map((item) => normalizedB.get(normalize(item))).filter((item): item is string => Boolean(item)))];
}

function textOverlap(a: string, b: string, limit = 3): string[] {
  const bTokens = tokens(b);
  return [...tokens(a)].filter((token) => bTokens.has(token)).slice(0, limit);
}

function candidateHelpText(profile: Profile): string {
  return [profile.canHelpWith, profile.occupation, ...profile.domains, ...profile.searchKeywords].filter(Boolean).join(' ');
}

function userNeedText(profile: Profile, selectedChallenges: string[]): string {
  return [profile.currentChallenge, profile.currentPriority, profile.goal90Days, ...selectedChallenges].filter(Boolean).join(' ');
}

function tier(score: number): RecommendationTier {
  if (score >= 10) return 'high';
  if (score >= 6) return 'relevant';
  return 'similar';
}

export function recommendProfiles(input: RecommendationInput): Recommendation[] {
  const { selectedSelf, candidates, selectedInterests = [], selectedChallenges = [], limit = 20 } = input;
  const results: Recommendation[] = [];
  const selfNeeds = userNeedText(selectedSelf, selectedChallenges);

  for (const candidate of candidates) {
    if (candidate.id === selectedSelf.id) continue;

    const reasons: RecommendationReason[] = [];
    let score = 0;

    const helpOverlap = textOverlap(selfNeeds, candidateHelpText(candidate), 3);
    if (helpOverlap.length > 0) {
      const points = 5 + Math.min(2, helpOverlap.length - 1);
      score += points;
      reasons.push({ kind: 'can-help', label: 'Может помочь с твоей задачей', evidence: helpOverlap, points });
    }

    const interestMatches = intersection(selectedInterests, candidate.domains);
    if (interestMatches.length > 0) {
      const points = 4 + Math.min(2, interestMatches.length - 1);
      score += points;
      reasons.push({ kind: 'interest', label: `Сфера: ${interestMatches.join(', ')}`, evidence: interestMatches, points });
    }

    const challengeMatches = intersection(
      [...selectedSelf.challenges, ...selectedChallenges],
      candidate.challenges,
    );
    if (challengeMatches.length > 0) {
      const points = 3 + Math.min(2, challengeMatches.length - 1);
      score += points;
      reasons.push({ kind: 'shared-challenge', label: `Похожий вызов: ${challengeMatches.join(', ')}`, evidence: challengeMatches, points });
    }

    const domainMatches = intersection(selectedSelf.domains, candidate.domains).filter((item) => item !== 'Другое');
    if (domainMatches.length > 0) {
      const points = 2 + Math.min(1, domainMatches.length - 1);
      score += points;
      reasons.push({ kind: 'professional-overlap', label: `Профессиональное пересечение: ${domainMatches.join(', ')}`, evidence: domainMatches, points });
    }

    const keywordMatches = textOverlap(
      [selectedSelf.occupation, selectedSelf.canHelpWith, selectedSelf.goal90Days].filter(Boolean).join(' '),
      [candidate.occupation, candidate.canHelpWith].filter(Boolean).join(' '),
      3,
    );
    if (keywordMatches.length > 0) {
      const points = 2;
      score += points;
      reasons.push({ kind: 'keyword-overlap', label: 'Есть общее профессиональное поле', evidence: keywordMatches, points });
    }

    if (selectedSelf.city && candidate.city && normalize(selectedSelf.city) === normalize(candidate.city)) {
      score += 1;
      reasons.push({ kind: 'same-city', label: `Один город: ${candidate.city}`, evidence: [candidate.city], points: 1 });
    }

    if (score > 0) results.push({ profileId: candidate.id, score, tier: tier(score), reasons });
  }

  return results
    .sort((a, b) => b.score - a.score || a.profileId.localeCompare(b.profileId))
    .slice(0, limit);
}
