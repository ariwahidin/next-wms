export interface HeaderFormProps {
    ID: number;
    inbound_no?: string;
    inbound_date: string;
    supplier: string;
    po_number: string;
    status?: string;
    remarks?: string;
    mode?: "create" | "edit";
}

export interface ItemFormProps {
    ID: number;
    inbound_id: number;
    item_code: string;
    quantity: number;
    whs_code: string;
    uom: string;
    received_date?: string;
    remarks?: string;
    mode?: string;
}

export interface ItemFormTableProps {
  muatan: ItemFormProps[];
  setMuatan: React.Dispatch<React.SetStateAction<ItemFormProps[]>>;
}

export interface PropsHeader{
    headerForm: HeaderFormProps;
    setHeaderForm: React.Dispatch<React.SetStateAction<HeaderFormProps>>;
}

export interface CombinedInboundProps extends ItemFormTableProps, PropsHeader {}

export interface ItemOptions {
  value: string;
  label: string;
}