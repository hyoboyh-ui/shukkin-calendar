export const formatYen = (amount: number): string => `¥${Math.round(amount).toLocaleString('ja-JP')}`;
