import { products } from '@/types/example/data/dummy';

export function convertToBaseUnit(productId: string, qty: number, uom: string): number {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    const uomData = product.uoms.find(u => u.uom === uom);
    if (!uomData) return 0;
    return qty * uomData.conversion;
}