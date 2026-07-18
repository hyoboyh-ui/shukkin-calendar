export interface MessageTier {
  min: number;
  label: string;
  message: string;
}

export const TAX_RATE = 0.1;

export const MESSAGE_TIERS: MessageTier[] = [
  { min: 0, label: '0〜60万円', message: '今月もぼちぼち頑張ろか、目標まであと少しやで' },
  { min: 600_000, label: '60〜70万円', message: 'まだまだいけるやん！せやけど無理したらあかんで' },
  { min: 700_000, label: '70〜90万円', message: '運ちゃん星やんか！才能のかたまりやで' },
  { min: 900_000, label: '90〜100万円', message: 'もはや伝説やん…！その調子で体も大事にしいや' },
  { min: 1_000_000, label: '100万円〜', message: '殿堂入りやで！ほんまお疲れさん、ゆっくり休みや' },
];

export const messageForTotal = (total: number): MessageTier => {
  let tier = MESSAGE_TIERS[0];
  for (const t of MESSAGE_TIERS) {
    if (total >= t.min) tier = t;
  }
  return tier;
};

export const afterTax = (amount: number): number => Math.round(amount * (1 - TAX_RATE));
