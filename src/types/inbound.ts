export interface HeaderFormProps {
  ID: number;
  inbound_no?: string;
  inbound_date: string;
  supplier: string;
  receipt_id: string;
  transporter?: string;
  no_truck?: string;
  driver?: string;
  container?: string;
  po_number: string;
  invoice?: string;
  type?: string;
  status?: string;
  owner_code?: string;
  whs_code?: string;
  remarks?: string;
  origin?: string;
  po_date?: string;
  arrival_time?: string;
  start_unloading?: string;
  end_unloading?: string;
  truck_size?: string;
  bl_no?: string;
  intergration?: boolean;
  koli?: number;
  mode?: "create" | "edit";
}

export interface ItemFormProps {
  ID: number;
  item_id?: number;
  inbound_id: number;
  item_code: string;
  quantity: number;
  location?: string;
  division?: string;
  uom: string;
  is_serial?: string;
  rec_date?: string;
  prod_date?: string;
  exp_date?: string;
  lot_number?: string;
  remarks?: string;
  mode?: string;
  index?: number;
  ref_id?: number;
  ref_no?: string;
  group?: string;
  category?: string;
  qa_status?: string;
}

export interface InboundReference {
  ID: number;
  inbound_id: number;
  ref_no: string;
  owner?: string;
  division?: string;
}

export interface ItemReceived {
  ID: number;
  item_code: string;
  barcode: string;
  serial_number: string;
  location: string;
  whs_code: string;
  status: string;
  qa_status: string;
  quantity: number;
  created_at: string;
  uom?: string;
  product?: {
    item_name?: string;
    has_serial?: string;
  }
  exp_date?: string;
  prod_date?: string;
  lot_number?: string;
}

export interface ItemFormTableProps {
  muatan: ItemFormProps[];
  setMuatan: React.Dispatch<React.SetStateAction<ItemFormProps[]>>;
}

export interface PropsHeader {
  headerForm: HeaderFormProps;
  setHeaderForm: React.Dispatch<React.SetStateAction<HeaderFormProps>>;
}

export interface InboundReferenceProps {
  inboundReferences: InboundReference;
  setInboundReferences: React.Dispatch<React.SetStateAction<InboundReference>>;
}

export type InboundDetails = {
  id: number;
  item_code: string;
  barcode: string;
  item_name: string;
  quantity: number;
  qty_scan: number;
  qa_status: boolean;
  uom?: string;
  rec_date?: string;
  exp_date?: string;
  prod_date?: string;
  lot_number?: string;
}

export interface CombinedInboundProps extends ItemFormTableProps, PropsHeader, InboundReferenceProps, InboundDetailsProps { }

export interface ItemOptions {
  value: string;
  label: string;
}

export type InboundItem = {
  id: number;
  inbound_no: string;
  supplier_name: string;
  receipt_id: string;
  receive_status: string;
  req_qty: number;
  qty_stock: number;
  scan_qty: number;
  status: "fully received" | "partially received" | "open" | "checking";
  require_putaway_scan?: boolean;
};

export interface InboundDetailsProps {
  inboundDetails: InboundDetails[];
  setInboundDetails: React.Dispatch<React.SetStateAction<InboundDetails[]>>;
}


export interface InboundBarcodeTask {
  ID : number;
  inbound_id : number;
  item_code : string;
  barcode : string;
  rec_date : string;
  exp_date : string;
  prod_date : string;
  lot_number : string;
  uom : string;
  quantity : number;
  location : string;
  putaway_location : string;
  putaway_qty : number;
}

