// lib/convert.ts

import { Product, UOM } from "@/types/example/index";

// Konversi ke satuan dasar (base unit)
export function convertToBase(product: Product, qty: number, uom: UOM): number {
  const match = product.uoms.find((u) => u.uom === uom);
  if (!match) throw new Error(`UOM ${uom} not found for product ${product.name}`);
  return qty * match.conversion;
}




