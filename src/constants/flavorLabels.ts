export const FLAVOR_LABELS = {
  f1_hanayaka: '華やか',
  f2_houjun: '芳醇',
  f3_juukou: '重厚',
  f4_odayaka: '穏やか',
  f5_dry: 'ドライ',
  f6_keiikai: '軽快'
} as const;

export const PLACEHOLDER_TAGS = [
  { id: 1, tag: '日本酒' },
  { id: 2, tag: 'おすすめ' }
];

export const DEFAULT_FLAVOR_CHART = {
  f1_hanayaka: 0,
  f2_houjun: 0,
  f3_juukou: 0,
  f4_odayaka: 0,
  f5_dry: 0,
  f6_keiikai: 0,
};
