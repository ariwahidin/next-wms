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