// types/index.ts

export type UOM = "pcs" | "dus" | "pallet";

export interface Product {
  id: string;
  name: string;
  uoms: {
    uom: UOM;
    conversion: number;
    is_base: boolean;
  }[];
}

export interface InboundItem {
  id: string;
  productId: string;
  qty: number;
  uom: UOM;
}

export interface InboundOrder {
  id: string;
  date: string;
  supplier: string;
  status: string;
  items: InboundItem[];
}

export interface Putaway {
  id: string;
  inboundItemId: string;
  location: string;
  qty_in_base: number;
}

export interface StockRecord {
  productId: string;
  location: string;
  qty_in_base: number;
}

export type PutawayItem = {
  id: string;
  productId: string;
  qtyBaseUnit: number; // qty sudah dikonversi ke base unit
  location: string;
};

export type PutawayRecord = {
  id: string;
  inboundOrderId: string;
  date: string; // tanggal putaway
  items: PutawayItem[];
};


export type OutboundItem = {
  productId: string;
  qty: number;
  uom: string;
};
