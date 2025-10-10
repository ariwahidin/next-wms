import { queryDB } from "./db";

export async function getInbound(startDate: string, endDate: string) {
  const sql = `
    SELECT 
      ROW_NUMBER() OVER (ORDER BY ih.inbound_date DESC) AS [NO],
      ih.inbound_no AS [RECEIVED ID],
      ih.inbound_date AS [REC DATE],
      id.whs_code AS [WH CODE],
      ih.bl_no AS [BL NO],
      ih.no_truck AS [TRUCK NO],
      ih.container AS [CONTAINER NO],
      ih.receipt_id AS [INVOICE NO],
      s.supplier_name AS SUPPLIER,
      id.item_code AS [ITEM CODE],
      id.quantity AS QUANTITY,
      p.cbm AS [M3 PCS],
      p.cbm * id.quantity AS [TOTAL M3],
      ih.koli AS KOLI,
      id.remarks AS REMARK
    FROM inbound_details id
    INNER JOIN inbound_headers ih ON id.inbound_no = ih.inbound_no
    LEFT JOIN products p ON p.item_code = id.item_code
    LEFT JOIN suppliers s ON s.supplier_code = ih.supplier
    WHERE ih.inbound_date >= '${startDate}' AND ih.inbound_date <= '${endDate}'
    ORDER BY ih.inbound_date DESC
  `;
  return queryDB(sql);
}

export async function getOutbound(startDate: string, endDate: string) {
  const sql = `
    SELECT 
      ROW_NUMBER() OVER (ORDER BY oh.outbound_date DESC) AS [NO],
      od.whs_code AS [WH CODE],
      oht.truck_no AS [TRUCK NO],
      oh.rcv_do_date AS [PRINT DO DATE],
	    oh.rcv_do_time AS [PRINT DO TIME],
      oh.outbound_date AS [OUT DATE],
      oh.shipment_id AS [DO NO],
      cd.customer_name AS [DELIVERY NAME],
      cd.cust_city AS CITY,
      cd.cust_addr1 AS [DELIVERY ADD],
      od.item_code AS [ITEM CODE],
      od.quantity AS QTY,
      p.cbm AS [M3 PCS],
      p.cbm * od.quantity AS [M3 TOTAL],
      odt.qty_koli AS KOLI,
      tr.transporter_name AS TRUCKER,
      od.vas_name AS [REMARK DETAIL],
      oh.remarks AS [REMARK HEADER],
      odt.order_no AS [SPK NO],
      oht.remarks AS [REMARK SPK]
    FROM outbound_details od
    INNER JOIN outbound_headers oh ON od.outbound_no = oh.outbound_no
    INNER JOIN customers cd ON oh.deliv_to = cd.customer_code
    INNER JOIN products p ON od.item_id = p.id
    LEFT JOIN order_details odt ON oh.outbound_no = odt.outbound_no
    LEFT JOIN order_headers oht ON odt.order_no = oht.order_no
    LEFT JOIN transporters tr ON oh.transporter_code = tr.transporter_code
    WHERE
    oht.order_no IS NOT NULL AND 
    oh.outbound_date >= '${startDate}' AND oh.outbound_date <= '${endDate}'
    ORDER BY oh.outbound_date DESC
  `;
  return queryDB(sql);
}

export async function getHandlingOutboundDetail(startDate: string, endDate: string) {
  const sql = `SELECT
  ROW_NUMBER() OVER (ORDER BY oh.outbound_date DESC) AS [no],
  oh.outbound_date AS tgl_keluar,
  oh.shipment_id AS no_do,
  cd.customer_name AS dealer,
  od.item_code,
  od.quantity as qty,
  od.vas_name as jenis_pekerjaan,
  '-' as koli
  FROM
  outbound_details od
  inner join outbound_headers oh ON od.outbound_no = oh.outbound_no
  left join customers cd ON oh.deliv_to = cd.customer_code
  WHERE od.vas_name <> 'NO'
  AND oh.outbound_date >= '${startDate}' AND oh.outbound_date <= '${endDate}'`;
  return queryDB(sql);
}

export async function getOutboundHandlingSummary(startDate: string, endDate: string) {
  const sql = `SELECT 
    main_vas_name AS jenis_pekerjaan,
    case when is_koli = 0 then qty_item else qty_koli end AS qty,
    default_price as idr,
    total_price as total_idr
    FROM 
    outbound_vas ov
    WHERE ov.outbound_date >= '${startDate}' AND ov.outbound_date <= '${endDate}'`;
  return queryDB(sql);
}

export async function getStockSummary() {
  const sql = `SELECT 
    GMC,
    [ITEM CODE],
    [ITEM NAME],
    ISNULL([CKY], 0)   AS [CKY],
    ISNULL([NGY], 0)   AS [NGY],
    ISNULL([CDY], 0)   AS [CDY],
    ISNULL([HADIAH], 0) AS [HADIAH],
    ISNULL([PROPERTY_GATSU], 0)   AS [PROPERTY_GATSU],
    ISNULL([PROMO], 0)   AS [PROMO],
    ISNULL([EX_ASURANSI], 0)   AS [EX_ASURANSI],
    ISNULL([FREE_COVER], 0)   AS [FREE_COVER],
    ISNULL([TGY], 0)   AS [TGY],
    -- TOTAL STOCK = semua gudang dijumlahkan
    ISNULL([CKY], 0) 
    + ISNULL([NGY], 0) 
    + ISNULL([CDY], 0) 
    + ISNULL([HADIAH], 0)
    + ISNULL([PROPERTY_GATSU], 0)
    + ISNULL([PROMO], 0)
  	+ ISNULL([EX_ASURANSI], 0)
    + ISNULL([FREE_COVER], 0) 
	  + ISNULL([TGY], 0)
    AS [TOTAL STOCK]
FROM (
    SELECT 
        inv.barcode       AS GMC,
        inv.item_code     AS [ITEM CODE],
        p.item_name       AS [ITEM NAME],
        inv.whs_code,
        inv.qty_onhand
    FROM inventories inv
    INNER JOIN products p ON inv.item_id = p.id
) AS src
PIVOT (
    SUM(qty_onhand) 
    FOR whs_code IN (
        [CKY], [CDY], [NGY], [PROMO],
        [EX_ASURANSI], [HADIAH],
        [FREE_COVER], [PROPERTY_GATSU], [TGY]
    )
) AS pvt
ORDER BY GMC DESC;
  `;
  return queryDB(sql);
}

export async function getCycleCountOutbound(startDate: string, endDate: string) {
  const sql = `With ob AS
  (SELECT 
  opi.inventory_id, 
  -- opi.outbound_id, oh.outbound_no, 
  -- oh.outbound_date,
  opi.location, opi.item_code, opi.barcode,
  p.item_name, opi.whs_code, 
  SUM(opi.quantity) as qty_out
  FROM 
  outbound_pickings opi
  inner join outbound_headers oh on oh.id = opi.outbound_id
  inner join products p on opi.item_id = p.id
  where oh.outbound_date >= '${startDate}' AND oh.outbound_date <= '${endDate}'
  group by 
  opi.inventory_id, -- opi.outbound_id, oh.outbound_no, 
  oh.outbound_date,
  opi.location, opi.item_code, opi.barcode,
  p.item_name, opi.whs_code)
  select 
  --ob.outbound_no,
  -- ob.outbound_date,
  ob.location, 
  ob.item_code, 
  ob.barcode, 
  ob.item_name,
  ob.whs_code,
  inv.qty_onhand, 
  inv.qty_allocated, 
  qty_available,
  '' AS qty_actual,
  sum(ob.qty_out) as qty_out
  from ob
  left join inventories inv on ob.inventory_id = inv.id
  group by
  -- ob.outbound_date,
  ob.location, 
  ob.item_code, 
  ob.barcode, 
  ob.item_name,
  ob.whs_code,
  inv.qty_onhand, 
  inv.qty_allocated, 
  qty_available
  order by ob.location asc, ob.item_code asc`;
  return queryDB(sql);
}

export async function getInboundReport(startDate: string, endDate: string) {
  const sql = `
    SELECT 
      ROW_NUMBER() OVER (ORDER BY ih.inbound_date DESC) AS [NO],
      ih.inbound_no AS [RECEIVED ID],
      ih.inbound_date AS [REC DATE],
      ib.whs_code AS [WH CODE],
      ih.bl_no AS [BL NO],
      ih.no_truck AS [TRUCK NO],
      ih.container AS [CONTAINER NO],
      ih.receipt_id AS [INVOICE NO],
      s.supplier_name AS SUPPLIER,
      ib.item_code AS [ITEM CODE],
	  ib.barcode AS [GMC CODE],
	  p.item_name AS [ITEM NAME],
      ib.quantity AS [QTY],
	  CASE WHEN p.has_serial = 'Y' then ib.serial_number else ib.barcode end AS [SERIAL NUMBER]
    FROM inbound_barcodes ib
    INNER JOIN inbound_headers ih ON ib.inbound_id = ih.id
    LEFT JOIN products p ON p.item_code = ib.item_code
    LEFT JOIN suppliers s ON s.supplier_code = ih.supplier
    WHERE ih.inbound_date >= '${startDate}' AND ih.inbound_date <= '${endDate}'
    ORDER BY ih.inbound_date DESC
  `;
  return queryDB(sql);
}


export async function getOutboundReport(startDate: string, endDate: string) {
  const sql = `
    SELECT 
      ROW_NUMBER() OVER (ORDER BY oh.outbound_date DESC) AS [NO],
      oh.whs_code AS [WH CODE],
      oht.truck_no AS [TRUCK NO],
      oh.rcv_do_date AS [PRINT DO DATE],
	    oh.rcv_do_time AS [PRINT DO TIME],
      oh.outbound_date AS [OUT DATE],
      oh.shipment_id AS [DO NO],
      tr.transporter_name AS [TRUCKER],
      cd.customer_name AS [DELIVERY NAME],
      cd.cust_city AS CITY,
      cd.cust_addr1 AS [DELIVERY ADD],
      od.item_code AS [ITEM CODE],
	  od.barcode AS [GMC CODE],
      od.quantity AS QTY,
	  od.serial_number AS [SERIAL NUMBER],
      p.cbm AS [M3 PCS],
      p.cbm * od.quantity AS [M3 TOTAL]
      --odt.qty_koli AS KOLI,
      --tr.transporter_name AS TRUCKER,
      --od.vas_name AS [REMARK DETAIL],
      --oh.remarks AS [REMARK HEADER],
      --odt.order_no AS [SPK NO],
      --oht.remarks AS [REMARK SPK]
    FROM outbound_barcodes od
    INNER JOIN outbound_headers oh ON od.outbound_no = oh.outbound_no
    INNER JOIN customers cd ON oh.deliv_to = cd.customer_code
    INNER JOIN products p ON od.item_id = p.id
    LEFT JOIN order_details odt ON oh.outbound_no = odt.outbound_no
    LEFT JOIN order_headers oht ON odt.order_no = oht.order_no
    LEFT JOIN transporters tr ON oh.transporter_code = tr.transporter_code
    WHERE oh.outbound_date >= '${startDate}' AND oh.outbound_date <= '${endDate}'
    ORDER BY oh.outbound_date DESC
  `;
  return queryDB(sql);
}