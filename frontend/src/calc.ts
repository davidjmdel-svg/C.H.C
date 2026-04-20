export const GRAMS_PER_RATION = 10;
export const MAX_RATIONS = 8;

export function totalCarbs(weight: number, carbsPer100g: number): number {
  if (!weight || !carbsPer100g) return 0;
  return (weight / 100) * carbsPer100g;
}

export function maxRations(weight: number, carbsPer100g: number): number {
  return totalCarbs(weight, carbsPer100g) / GRAMS_PER_RATION;
}

export function gramsNeededForRations(
  rations: number,
  carbsPer100g: number
): number {
  if (!carbsPer100g) return 0;
  return (rations * GRAMS_PER_RATION * 100) / carbsPer100g;
}

export function cookedGrams(dryGrams: number, factor: number): number {
  if (!dryGrams || !factor) return 0;
  return dryGrams * factor;
}

export function fmt(n: number, decimals = 1): string {
  if (!isFinite(n)) return "0";
  const v = Number(n.toFixed(decimals));
  return v.toLocaleString("es-ES", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}
