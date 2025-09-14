export interface HeaderSPK {
  ID: number;
  order_no ?: string;
  order_date: string;
  transporter_code?: string;
  transporter_name?: string;
  order_type?: string;
  status?: string;
  mode?: "create" | "edit";
  driver?: string;
  truck_type?: string;
  truck_size?: string;
  truck_no?: string;
  load_date?: string;
  load_start_time?: string;
  load_end_time?: string;
  arrival_date?: string;
  arrival_start_time?: string;
  arrival_end_time?: string;
  remarks?: string;
}

export interface MuatanOrderSPK {
  ID: number;
  order_id?: number;
  order_no?: string;
  outbound_id : number;
  outbound_no : string;
  shipment_id? : string;
  deliv_to? : string;
  deliv_to_name? : string;
  deliv_address? : string;
  deliv_city? : string;
  total_item?: number;
  total_qty?: number;
  qty_koli?: number;
  total_cbm?: number;
  mode?: "create" | "edit";
}

export interface DetailItemFormPropsSPK {
  muatan: MuatanOrderSPK[];
  setMuatan: React.Dispatch<React.SetStateAction<MuatanOrderSPK[]>>;
}

export interface PropsHeaderSPK {
  headerForm: HeaderSPK;
  setHeaderForm: React.Dispatch<React.SetStateAction<HeaderSPK>>;
}

export interface CombinedSPKProps extends DetailItemFormPropsSPK, PropsHeaderSPK { }