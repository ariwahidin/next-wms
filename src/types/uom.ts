export interface Uom {
    code: string
    name: string
}

export interface UomConversion {
    ID: number;
    item_code: string;
    from_uom: string;
    to_uom: string;
    conversion_rate: number;
    is_base: boolean;
};