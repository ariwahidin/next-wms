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
  // const sql = `
  //   SELECT 
  //     ROW_NUMBER() OVER (ORDER BY oh.outbound_date DESC) AS [NO],
  //     od.whs_code AS [WH CODE],
  //     oht.truck_no AS [TRUCK NO],
  //     oh.rcv_do_date AS [PRINT DO DATE],
	//     oh.rcv_do_time AS [PRINT DO TIME],
  //     oh.outbound_date AS [OUT DATE],
  //     oh.shipment_id AS [DO NO],
  //     cd.customer_name AS [DELIVERY NAME],
  //     cd.cust_city AS CITY,
  //     cd.cust_addr1 AS [DELIVERY ADD],
  //     od.item_code AS [ITEM CODE],
  //     od.quantity AS QTY,
  //     p.cbm AS [M3 PCS],
  //     p.cbm * od.quantity AS [M3 TOTAL],
  //     odt.qty_koli AS KOLI,
  //     tr.transporter_name AS TRUCKER,
  //     od.vas_name AS [REMARK DETAIL],
  //     oh.remarks AS [REMARK HEADER],
  //     odt.order_no AS [SPK NO],
  //     oht.remarks AS [REMARK SPK]
  //   FROM outbound_details od
  //   INNER JOIN outbound_headers oh ON od.outbound_no = oh.outbound_no
  //   INNER JOIN customers cd ON oh.deliv_to = cd.customer_code
  //   INNER JOIN products p ON od.item_id = p.id
  //   LEFT JOIN order_details odt ON oh.outbound_no = odt.outbound_no
  //   LEFT JOIN order_headers oht ON odt.order_no = oht.order_no
  //   LEFT JOIN transporters tr ON oh.transporter_code = tr.transporter_code
  //   WHERE
  //   oht.order_no IS NOT NULL AND 
  //   oh.outbound_date >= '${startDate}' AND oh.outbound_date <= '${endDate}'
  //   ORDER BY oh.outbound_date DESC
  // `;

  const sql = `SELECT 
      ROW_NUMBER() OVER (ORDER BY oh.outbound_date DESC) AS [NO],
      od.whs_code AS [WH CODE],
      oht.truck_no AS [TRUCK NO],
      oh.rcv_do_date AS [PRINT DO DATE],
	    oh.rcv_do_time AS [PRINT DO TIME],
	    ohd.load_date AS [OUT DATE],
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
	  LEFT JOIN order_headers ohd ON ohd.order_no = oht.order_no
    LEFT JOIN transporters tr ON oh.transporter_code = tr.transporter_code
    WHERE
    oht.order_no IS NOT NULL AND 
    oh.outbound_date >= '${startDate}' AND oh.outbound_date <= '${endDate}'
    ORDER BY oh.outbound_date DESC`;
  return queryDB(sql);
}

export async function getHandlingOutboundDetail(startDate: string, endDate: string) {
  const sql = `SELECT
  ROW_NUMBER() OVER (ORDER BY oh.outbound_date DESC) AS [no],
  oh.outbound_date AS tgl_keluar,
  odt.order_no AS spk_no,
  oh.shipment_id AS no_do,
  cd.customer_name AS dealer,
  od.item_code,
  od.quantity as qty,
  od.vas_name as jenis_pekerjaan,
  odt.vas_koli
  FROM
  outbound_details od
  inner join outbound_headers oh ON od.outbound_no = oh.outbound_no
  left join order_details odt ON oh.shipment_id = odt.shipment_id
  left join customers cd ON oh.deliv_to = cd.customer_code
  WHERE
  odt.order_no IS NOT NULL
  AND od.vas_name <> 'NO'
  AND oh.outbound_date >= '${startDate}' AND oh.outbound_date <= '${endDate}'`;
  return queryDB(sql);
}

export async function getOutboundHandlingSummary(startDate: string, endDate: string) {
  // const sql = `WITH summary AS
  // (
  // SELECT 
  //   ov.outbound_no,
  //   oh.shipment_id,
  //   odt.order_no,
  //     main_vas_name AS jenis_pekerjaan,
  //     case when is_koli = 0 then ov.qty_item else ov.qty_koli end AS qty,
  //     default_price as idr,
  //     total_price as total_idr
  //     FROM outbound_vas ov
  //   INNER JOIN outbound_headers oh ON ov.outbound_id = oh.id
  //   LEFT JOIN order_details odt ON ov.outbound_id = odt.outbound_id
  //     WHERE 
  //   oh.outbound_date >= '${startDate}' AND oh.outbound_date <= '${endDate}'
  //   AND ov.main_vas_name <> 'NO'
  // )
  // SELECT 
  // jenis_pekerjaan, 
  // SUM(qty) as qty, 
  // idr, 
  // SUM(qty) * idr as total_idr 
  // FROM summary
  // group by jenis_pekerjaan, idr
  // order by jenis_pekerjaan ASC`;

  const sql = `
    WITH rd AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY oh.outbound_date DESC) AS [no],
      oh.outbound_date AS tgl_keluar,
      odt.order_no AS spk_no,
      oh.shipment_id AS no_do,
      cd.customer_name AS dealer,
      od.item_code,
      od.quantity as qty,
      od.vas_name as jenis_pekerjaan,
      odt.vas_koli
      FROM
      outbound_details od
      inner join outbound_headers oh ON od.outbound_no = oh.outbound_no
      left join order_details odt ON oh.shipment_id = odt.shipment_id
      left join customers cd ON oh.deliv_to = cd.customer_code
      WHERE
      odt.order_no IS NOT NULL
      AND od.vas_name <> 'NO'
      AND oh.outbound_date >= '${startDate}' AND oh.outbound_date <= '${endDate}'
      ),
    sum1 AS (
      select
      rd.no_do,
      sum(rd.qty) as total_qty,
      v.id as vas_id, 
      v.[name] as vas_name
      from rd 
      left join vas v ON rd.jenis_pekerjaan = v.name
      group by rd.no_do, v.id, v.[name]
    ),
    sum2 AS (
      select 
      sum1.no_do,
      sum1.total_qty,
      odt.vas_koli,
      sum1.vas_id,
      sum1.vas_name
      from sum1
      inner join order_details odt on sum1.no_do = odt.shipment_id
    ),
    sum3 AS (
      select 
      SUM(sum2.total_qty) as tot_qty,
      SUM(sum2.vas_koli) as tot_koli,
      sum2.vas_id,
      vas_name,
      vd.main_vas_id,
      m.[name] as main_vas_name,
      m.is_koli,
      m.default_price
      from sum2
      inner join vas_detail vd on sum2.vas_id = vd.vas_id 
      inner join main_vas m on m.id = vd.main_vas_id
      group by 
      sum2.vas_id,
      vas_name,
      vd.main_vas_id,
      m.[name],
      m.is_koli,
      m.default_price),
    sum4 AS (
      select 
      SUM(tot_qty) as tot_qty,
      SUM(tot_koli) as tot_koli,
      main_vas_name,
      is_koli,
      default_price
      from sum3
      group by 
      main_vas_name,
      is_koli,
      default_price
      ),
    sum5 AS (
      select
      main_vas_name as jenis_pekerjaan,
      case when is_koli = 1 then tot_koli else tot_qty end as qty,
      default_price as idr
      from sum4
      )
    select 
    jenis_pekerjaan,
    qty,
    idr,
    qty * idr as total_idr
    from sum5
  `;
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
      ih.arrival_time AS [ARRIVAL TIME],
	    ih.start_unloading AS [START UNLOADING],
	    ih.end_unloading AS [FINSIH UNLOADING],
	    ih.truck_size AS [TRUCK SIZE],
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


export async function getOutboundReport(startDate: string, endDate: string, status: string, viewBy: string) {

  let sql = ` WITH v AS
              (SELECT
                  oh.[status] AS [STATUS],
                    oh.whs_code AS [WH CODE],
                    oht.truck_no AS [TRUCK NO],
                    oht.driver AS [DRIVER],
                    oht.order_no AS [SPK NO],
                    oh.rcv_do_date AS [PRINT DO DATE],
                  oh.rcv_do_time AS [PRINT DO TIME],
                    oh.outbound_date AS [OUT DATE],
                    oh.shipment_id AS [DO NO],
                    tr.transporter_name AS [TRUCKER],
                    c.customer_name AS [CUSTOMER],
                    c.cust_addr1 AS [ADDRESS],
                    c.cust_city AS CITY,
                    od.item_code AS [ITEM CODE],
                  od.barcode AS [GMC CODE],
                    CASE WHEN oh.[status] = 'open' OR oh.[status] = 'picking' THEN od.quantity ELSE ob.quantity END AS QTY,
                  oh.picker_name AS [PICKER],
	                us.name AS [SCAN BY],
                  ob.serial_number AS [SERIAL NUMBER],
                    p.cbm AS [M3 PCS],
                    p.cbm * (CASE WHEN oh.[status] = 'open' OR oh.[status] = 'picking' THEN od.quantity ELSE ob.quantity END) AS [M3 TOTAL]
                  FROM outbound_headers oh
                  LEFT JOIN outbound_details od ON od.outbound_no = oh.outbound_no
                LEFT JOIN products p ON od.item_id = p.id
                LEFT JOIN transporters tr ON oh.transporter_code = tr.transporter_code
                LEFT JOIN customers c ON oh.customer_code = c.customer_code
                LEFT JOIN outbound_barcodes ob ON ob.outbound_detail_id = od.id
                LEFT JOIN order_details odt ON oh.outbound_no = odt.outbound_no
                LEFT JOIN order_headers oht ON odt.order_no = oht.order_no
                LEFT JOIN users us ON us.id = ob.created_by
                  WHERE 
                oh.outbound_date >= '${startDate}' 
                AND oh.outbound_date <= '${endDate}'
              )
              SELECT
              ROW_NUMBER() OVER (ORDER BY [OUT DATE] DESC) AS [NO],
              * 
              FROM v WHERE 1 = 1`;

  if (status === "open") sql += ` AND [STATUS] = 'open'`;
  if (status === "picking") sql += ` AND [STATUS] = 'picking'`;
  if (status === "complete") sql += ` AND [STATUS] = 'complete'`;
  if (status === "cancel") sql += ` AND [STATUS] = 'cancel'`;
  sql += ` ORDER BY [OUT DATE] DESC`;

  if (viewBy === "item") {
    sql = ` WITH v AS
            (SELECT
                oh.[status] AS [STATUS],
                  oh.whs_code AS [WH CODE],
                  oht.truck_no AS [TRUCK NO],
                  oht.order_no AS [SPK NO],
                  oh.rcv_do_date AS [PRINT DO DATE],
                  oh.rcv_do_time AS [PRINT DO TIME],
                  oh.outbound_date AS [OUT DATE],
                  oh.shipment_id AS [DO NO],
                  tr.transporter_name AS [TRUCKER],
                  c.customer_name AS [CUSTOMER],
                  c.cust_addr1 AS [ADDRESS],
                  c.cust_city AS CITY,
                  od.item_code AS [ITEM CODE],
                od.barcode AS [GMC CODE],
                od.quantity AS [QTY],
                  p.cbm AS [M3 PCS],
                  p.cbm * od.quantity AS [M3 TOTAL]
                FROM outbound_headers oh
                LEFT JOIN outbound_details od ON od.outbound_no = oh.outbound_no
              LEFT JOIN products p ON od.item_id = p.id
              LEFT JOIN transporters tr ON oh.transporter_code = tr.transporter_code
              LEFT JOIN customers c ON oh.customer_code = c.customer_code
              LEFT JOIN order_details odt ON oh.outbound_no = odt.outbound_no
              LEFT JOIN order_headers oht ON odt.order_no = oht.order_no
                WHERE 
              oh.outbound_date >= '${startDate}' 
              AND oh.outbound_date <= '${endDate}'
            )
            SELECT
            ROW_NUMBER() OVER (ORDER BY [OUT DATE] DESC) AS [NO],
            * 
            FROM v WHERE 1 = 1`;

    if (status === "open") sql += ` AND [STATUS] = 'open'`;
    if (status === "picking") sql += ` AND [STATUS] = 'picking'`;
    if (status === "complete") sql += ` AND [STATUS] = 'complete'`;
    if (status === "cancel") sql += ` AND [STATUS] = 'cancel'`;
    sql += ` ORDER BY [OUT DATE] DESC`;
  }

  // const sql = `
  //   SELECT 
  //     ROW_NUMBER() OVER (ORDER BY oh.outbound_date DESC) AS [NO],
  //     oh.whs_code AS [WH CODE],
  //     oht.truck_no AS [TRUCK NO],
  //     oh.rcv_do_date AS [PRINT DO DATE],
  //     oh.rcv_do_time AS [PRINT DO TIME],
  //     oh.outbound_date AS [OUT DATE],
  //     oh.shipment_id AS [DO NO],
  //     tr.transporter_name AS [TRUCKER],
  //     cd.customer_name AS [DELIVERY NAME],
  //     cd.cust_city AS CITY,
  //     cd.cust_addr1 AS [DELIVERY ADD],
  //     od.item_code AS [ITEM CODE],
  //   od.barcode AS [GMC CODE],
  //     od.quantity AS QTY,
  //   od.serial_number AS [SERIAL NUMBER],
  //     p.cbm AS [M3 PCS],
  //     p.cbm * od.quantity AS [M3 TOTAL]
  //     --odt.qty_koli AS KOLI,
  //     --tr.transporter_name AS TRUCKER,
  //     --od.vas_name AS [REMARK DETAIL],
  //     --oh.remarks AS [REMARK HEADER],
  //     --odt.order_no AS [SPK NO],
  //     --oht.remarks AS [REMARK SPK]
  //   FROM outbound_barcodes od
  //   INNER JOIN outbound_headers oh ON od.outbound_no = oh.outbound_no
  //   INNER JOIN customers cd ON oh.deliv_to = cd.customer_code
  //   INNER JOIN products p ON od.item_id = p.id
  //   LEFT JOIN order_details odt ON oh.outbound_no = odt.outbound_no
  //   LEFT JOIN order_headers oht ON odt.order_no = oht.order_no
  //   LEFT JOIN transporters tr ON oh.transporter_code = tr.transporter_code
  //   WHERE oh.outbound_date >= '${startDate}' AND oh.outbound_date <= '${endDate}'
  //   ORDER BY oh.outbound_date DESC
  // `;
  return queryDB(sql);
}
export async function getStockReport(viewBy: string) {

  let sql = `SELECT 
  iv.item_code AS [ITEM CODE],
  iv.barcode AS [GMC CODE],
  p.item_name AS [ITEM NAME],
  iv.rec_date AS [RCV DATE],
  iv.[location] AS [LOCATION],
  iv.whs_code AS [WH CODE],
  iv.qa_status AS [QA],
  SUM(iv.qty_onhand) AS [ON HAND],
  SUM(iv.qty_allocated) AS [ALLOCATED],
  SUM(iv.qty_available) AS [AVAILABLE],
  p.cbm [CBM],
  (SUM(iv.qty_available)) * p.cbm AS [TOTAL CBM]
  FROM inventories iv
  left join products p ON iv.item_code = p.item_code
  where iv.qty_onhand <> 0
  group by
  iv.item_code,
  iv.barcode,
  p.item_name,
  iv.rec_date,
  iv.[location],
  iv.whs_code,
  iv.qa_status,
  p.cbm
  ORDER BY iv.item_code ASC`;

  if (viewBy === "item") {
    sql = `SELECT 
    iv.item_code AS [ITEM CODE],
    iv.barcode AS [GMC CODE],
    p.item_name AS [ITEM NAME],
    -- iv.rec_date AS [RCV DATE],
    -- iv.[location] AS [LOCATION],
    iv.whs_code AS [WH CODE],
    iv.qa_status AS [QA],
    SUM(iv.qty_onhand) AS [ON HAND],
    SUM(iv.qty_allocated) AS [ALLOCATED],
    SUM(iv.qty_available) AS [AVAILABLE]
    -- p.cbm [CBM],
    -- (SUM(iv.qty_available)) * p.cbm AS [TOTAL CBM]
    FROM inventories iv
    left join products p ON iv.item_code = p.item_code
    where iv.qty_onhand <> 0
    group by
    iv.item_code,
    iv.barcode,
    p.item_name,
    -- iv.rec_date,
    -- iv.[location],
    iv.whs_code,
    iv.qa_status
    -- p.cbm
    ORDER BY iv.item_code ASC`;
  }

  return queryDB(sql);
}

export async function getMasterItem() {

  const sql = `SELECT 
  ROW_NUMBER() OVER (ORDER BY id ASC) AS [No],
  item_code AS [Item Code],
  barcode AS [GMC Code],
  item_name AS [Item Name],
  width AS Width,
  [length] AS [Length],
  height AS Height,
  uom AS UOM,
  cbm AS [CBM (M3)],
  net_weight AS [Net Weight],
  [group] AS [Group],
  category AS [Category]
  FROM products
  WHERE deleted_at is null
  AND owner_code = 'YMID'
  ORDER BY item_code ASC`;

  return queryDB(sql);
}


