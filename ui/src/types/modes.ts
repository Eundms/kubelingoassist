export type KubelingoMode = 'translation' | 'review';

export const KUBELINGO_MODES = {
  TRANSLATION: 'translation' as const,
  REVIEW: 'review' as const,
} as const;