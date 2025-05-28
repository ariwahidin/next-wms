export interface HeaderFormProps {
  ID: number;
  outbound_no?: string;
  outbound_date: string;
  customer: string;
  delivery_no: string;
  status?: string;
  remarks?: string;
  mode?: "create" | "edit";
}

export interface ItemFormProps {
  ID: number;
  outbound_id: number;
  item_code: string;
  quantity: number;
  whs_code: string;
  uom: string;
  remarks?: string;
  mode?: string;
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
  delivery_no: string;
  qty_req: number;
  qty_scan: number;
  qty_pack: number;
  status: "fully received" | "partial" | "open";
}