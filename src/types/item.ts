export interface Product {
    ID: string;
    item_code: string;
    item_name: string;
    barcode: string;
    width: number;
    length: number;
    height: number;
    uom: string;
    has_serial?: string;
    group?: string;
    category?: string;
}