import type { Product } from '../types/domain';

/** Productos del mismo grupo de escaneo o con el mismo nombre en el ticket. */
export function getRelatedProducts(product: Product, allProducts: Product[]): Product[] {
  if (product.lineGroupId) {
    return allProducts.filter((item) => item.lineGroupId === product.lineGroupId);
  }
  return allProducts.filter((item) => item.name === product.name);
}

export function countRelatedProducts(product: Product, allProducts: Product[]): number {
  return getRelatedProducts(product, allProducts).length;
}

export type ProductUpdateScope = 'single' | 'group';
