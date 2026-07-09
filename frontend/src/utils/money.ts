export function formatMoney(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
