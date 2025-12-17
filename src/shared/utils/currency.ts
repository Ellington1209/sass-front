export const toBRL = (value: number | string): string => {
  const num = Number(value || 0).toFixed(2);
  return num
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const fromBRL = (value: string): number => {
  const onlyNumbers = value.replace(/[^\d]/g, '');
  return Number(onlyNumbers) / 100;
};

