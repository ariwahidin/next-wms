export interface InventoryPolicy {
    ID: number;
    owner_code: string;
    use_lot_no: boolean;
    use_fifo: boolean;
    use_fefo: boolean;
    use_vas: boolean;
    use_production_date: boolean;
    use_receive_location: boolean;
    require_expiry_date: boolean;
    require_lot_number: boolean;
    show_rec_date: boolean;
    require_scan_pick_location: boolean;
}