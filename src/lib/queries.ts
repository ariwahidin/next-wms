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
      odt.remarks AS [REMARK SPK]
    FROM outbound_details od
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
    ISNULL([CDY], 0)   AS [CDY],
    ISNULL([NGY], 0)   AS [NGY],
    ISNULL([PROMO], 0)   AS [PROMO],
    ISNULL([CKN], 0)   AS [CKN],
    ISNULL([KYC], 0)   AS [KYC],
    ISNULL([EX_ASURANSI], 0)   AS [EX_ASURANSI],
    ISNULL([HADIAH], 0) AS [HADIAH],
    ISNULL([EX_BRAGA], 0)   AS [EX_BRAGA],
    ISNULL([FREE_STRING], 0)   AS [FREE_STRING],
    ISNULL([FREE_COVER], 0)   AS [FREE_COVER],
    ISNULL([PROPERTY_GATSU], 0)   AS [PROPERTY_GATSU],
    ISNULL([SAMPLE], 0)   AS [SAMPLE],
    ISNULL([CKB], 0)   AS [CKB],
    ISNULL([NGB], 0)   AS [NGB],
    -- TOTAL STOCK = semua gudang dijumlahkan
    ISNULL([CKY], 0) + ISNULL([CDY], 0) + ISNULL([NGY], 0) + ISNULL([PROMO], 0)
    + ISNULL([CKN], 0) + ISNULL([KYC], 0) + ISNULL([EX_ASURANSI], 0)
    + ISNULL([HADIAH], 0) + ISNULL([EX_BRAGA], 0) + ISNULL([FREE_STRING], 0)
    + ISNULL([FREE_COVER], 0) + ISNULL([PROPERTY_GATSU], 0)
    + ISNULL([SAMPLE], 0) + ISNULL([CKB], 0) + ISNULL([NGB], 0)
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
        [CKY], [CDY], [NGY], [PROMO], [CKN], [KYC],
        [EX_ASURANSI], [HADIAH], [EX_BRAGA], [FREE_STRING],
        [FREE_COVER], [PROPERTY_GATSU], [SAMPLE], [CKB], [NGB]
    )
) AS pvt
ORDER BY GMC DESC;
  `;
  return queryDB(sql);
}