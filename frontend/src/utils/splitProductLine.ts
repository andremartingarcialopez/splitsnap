/** Precio unitario al dividir una línea del ticket en N productos iguales. */
export function unitPriceForSplit(lineTotal: number, quantity: number): number {
  if (quantity < 2 || lineTotal <= 0) {
    throw new Error('Cantidad inválida para dividir');
  }
  return Math.round((lineTotal / quantity) * 100) / 100;
}
