// types/itemPackaging.ts

export interface ItemPackaging {
  id: number;
  item_id: number;
  item_code: string;
  uom: string;
  ean: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  net_weight_kg: number;
  gross_weight_kg: number;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_by: number;
  updated_at: string;
}

export interface ItemCodeOption {
  item_code: string;
  ean: string;
  uom: string;
}