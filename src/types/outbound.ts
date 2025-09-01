export interface HeaderFormProps {
  ID: number;
  outbound_no?: string;
  outbound_date: string;
  customer_code: string;
  shipment_id: string;
  whs_code: string;
  owner_code: string;
  status?: string;
  remarks?: string;
  mode?: "create" | "edit";
  picker_name?: string;
  cust_address?: string;
  cust_city?: string;
  plan_pickup_date?: string;
  plan_pickup_time?: string;
  rcv_do_date?: string;
  rcv_do_time?: string;
  start_pick_time?: string;
  end_pick_time?: string;
  deliv_to?: string;
  deliv_address?: string;
  deliv_city?: string;
  driver?: string;
  qty_koli?: number;
  qty_koli_seal?: number;
  truck_size?: string;
  truck_no?: string;
}

export interface ItemFormProps {
  ID: number;
  outbound_id: number;
  item_code: string;
  item_name?: string;
  barcode? :string;
  quantity: number;
  uom: string;
  location: string;
  sn?: string;
  sn_check?: string;
  remarks?: string;
  mode?: string;
  // handling?: string | string[];
  handling?: string | string[] | { Handling: string }[];
}

export interface ItemFormTableProps {
  muatan: ItemFormProps[];
  setMuatan: React.Dispatch<React.SetStateAction<ItemFormProps[]>>;
}

export interface PropsHeader {
  headerForm: HeaderFormProps;
  setHeaderForm: React.Dispatch<React.SetStateAction<HeaderFormProps>>;
}

export interface CombinedOutboundProps extends ItemFormTableProps, PropsHeader { }

export interface ItemOptions {
  value: string;
  label: string;
}

export interface OutboundItem {
  id: number;
  outbound_no: string;
  customer_name: string;
  shipment_id: string;
  qty_req: number;
  qty_scan: number;
  qty_pack: number;
  status: "fully received" | "partial" | "open";
}

export interface KoliItem {
  ID : number
  item_code : string
  barcode : number
  serial_number : string
  qty : number
  created_at : string
}