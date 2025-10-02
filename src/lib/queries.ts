import { queryDB } from "./db";

export async function getInbound(startDate: string, endDate: string) {
  const sql = `
    SELECT 
      ROW_NUMBER() OVER (ORDER BY ih.inbound_date DESC) AS [NO],
      ih.inbound_no AS RECEIVED_ID,
      ih.inbound_date AS REC_DATE,
      id.whs_code AS WH_CODE,
      ih.bl_no AS BL_NO,
      ih.no_truck AS TRUCK_NO,
      ih.container AS CONTAINER_NO,
      ih.receipt_id AS INVOICE_NO,
      s.supplier_name AS SUPPLIER,
      id.item_code AS ITEM_CODE,
      id.quantity AS QUANTITY,
      p.cbm AS M3_PCS,
      p.cbm * id.quantity AS TOTAL_M3,
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
      od.whs_code AS WH_CODE,
      oht.truck_no AS TRUCK_NO,
      oh.outbound_date AS OUT_DATE,
      oh.shipment_id AS DO_NO,
      cd.customer_name AS DELIVERY_NAME,
      cd.cust_city AS CITY,
      cd.cust_addr1 AS DELIVERY_ADD,
      od.item_code AS ITEM_CODE,
      od.quantity AS QTY,
      p.cbm AS M3_PCS,
      p.cbm * od.quantity AS M3_TOTAL,
      odt.qty_koli AS KOLI,
      tr.transporter_name AS TRUCKER,
      od.vas_name AS VAS,
      oh.remarks AS REMARK_HEADER,
      odt.order_no AS SPK_NO,
      odt.remarks AS REMARKS_SPK
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