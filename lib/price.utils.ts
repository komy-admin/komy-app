export const centsToEuros = (centimes: number): number => {
  return centimes / 100;
};

export const eurosToCents = (euros: number): number => {
  return Math.round(euros * 100);
};

export const formatPrice = (centimes: number, decimals: number = 2): string => {
  const euros = centsToEuros(centimes);
  return `${euros.toFixed(decimals).replace('.', ',')}€`;
};

export const formatPriceWithoutSymbol = (centimes: number, decimals: number = 2): string => {
  const euros = centsToEuros(centimes);
  return euros.toFixed(decimals).replace('.', ',');
};
