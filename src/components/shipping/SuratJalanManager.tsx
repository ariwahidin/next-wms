/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  RefreshCw,
  Search,
  FileText,
  Truck,
  Package,
  Printer,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import api from "@/lib/api";

// =====================================================
// TYPES
// =====================================================

type PackageRow = {
  ID: number;
  outbound_no: string;
  item_code: string;
  barcode: string;
  item_model: string;
  uom: string;
  quantity: number;
  package_type: string;
  package_qty: number;
  carton_code: string;
  pack_ctn_no: string;
  serial_number: string;
  customer_name?: string;
  Outbound?: {
    outbound_no: string;
    shipment_id: string;
    customer_name?: string;
    deliv_to_name?: string;
  } | null;
  product?: {
    item_name?: string;
  } | null;
};

type SPKDO = {
  ID: number;
  shipment_id: string;
  outbound_id: string;
  outbound_no: string;
  deliv_to: string;
  deliv_to_name: string;
  deliv_address: string;
  deliv_city: string;
};

type SJRow = {
  sj_no: string;
  sj_date: string;
  status: string;
  driver: string;
  truck_no: string;
};

type SPKHeader = {
  ID: number;
  order_no: string;
  driver: string;
  driver_phone: string;
  truck_type: string;
  truck_size: string;
  truck_no: string;
  transporter_name: string;
};

type CreateSJItem = {
  outbound_no: string;
  order_detail_id: string;
  package_ids: number[];
};

// =====================================================
// HELPERS
// =====================================================

const getLocalDate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getPackageCustomerName = (item: PackageRow, dos: SPKDO[] = []) => {
  const outboundNo = (item.outbound_no || item.Outbound?.outbound_no || "").trim().toUpperCase();
  const spkDO = dos.find(
    (deliveryOrder) =>
      deliveryOrder.outbound_no?.trim().toUpperCase() === outboundNo
  );

  return (
    item.customer_name ||
    item.Outbound?.customer_name ||
    item.Outbound?.deliv_to_name ||
    spkDO?.deliv_to_name ||
    "-"
  );
};

const getStatusClass = (status: string) => {
  switch (status?.toUpperCase()) {
    case "DRAFT":
      return "bg-gray-100 text-gray-700";

    case "RELEASED":
      return "bg-blue-100 text-blue-700";

    case "DELIVERED":
      return "bg-green-100 text-green-700";

    case "CANCELLED":
    case "CANCELED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-600";
  }
};

// =====================================================
// COMPONENT
// =====================================================

export default function SuratJalanManager({
  orderNo,
}: {
  orderNo: string;
}) {
  const router = useRouter();

  // ---------------------------------------------------
  // STATES
  // ---------------------------------------------------

  const [spkHeader, setSpkHeader] = useState<SPKHeader | null>(null);

  const [dos, setDos] = useState<SPKDO[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [sjList, setSJList] = useState<SJRow[]>([]);

  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const [searchDO, setSearchDO] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [remarks, setRemarks] = useState("");
  const [notice, setNotice] = useState<{ title: string; message: string; tone?: "success" | "error" | "info" } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [editingSJ, setEditingSJ] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [editPackageRows, setEditPackageRows] = useState<PackageRow[]>([]);
  const [editSelected, setEditSelected] = useState<Record<number, boolean>>({});
  const [searchEditPackages, setSearchEditPackages] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const showNotice = (message: string, tone: "success" | "error" | "info" = "info", title = "Surat Jalan") => {
    setNotice({ title, message, tone });
  };

  // ---------------------------------------------------
  // LOAD DATA
  // ---------------------------------------------------

  const load = useCallback(async () => {
    if (!orderNo) return;

    setLoading(true);

    try {
      const [spkRes, packageRes, sjRes] = await Promise.all([
        api.get(`/order/detail/${orderNo}`, {
          withCredentials: true,
        }),

        api.get(
          `/order/${orderNo}/surat-jalan/available-packages`,
          {
            withCredentials: true,
          }
        ),

        api.get(`/order/${orderNo}/surat-jalan`, {
          withCredentials: true,
        }),
      ]);

      // Response SPK:
      // res.data.data = {
      //   ID,
      //   order_no,
      //   driver,
      //   truck_no,
      //   items: [...]
      // }

      const spkData = spkRes.data?.data.order ?? {};

      // Header SPK
      setSpkHeader({
        ID: spkData.ID ?? 0,
        order_no: spkData.order_no ?? "",
        driver: spkData.driver ?? "",
        driver_phone: spkData.driver_phone ?? "",
        truck_type: spkData.truck_type ?? "",
        truck_size: spkData.truck_size ?? "",
        truck_no: spkData.truck_no ?? "",
        transporter_name: spkData.transporter_name ?? "",
      });

      // Detail DO SPK
      setDos(
        Array.isArray(spkData.items)
          ? spkData.items
          : []
      );

      // Available packages
      const packageData = packageRes.data?.data;

      const availablePackages = Array.isArray(packageData)
        ? packageData
        : [];

      setPackages(availablePackages);

      // Surat Jalan list
      const sjData = sjRes.data?.data;

      setSJList(
        Array.isArray(sjData)
          ? sjData
          : []
      );

      // Bersihkan selection yang sudah tidak tersedia
      setSelected((previous) => {
        const next: Record<number, boolean> = {};

        availablePackages.forEach((item: PackageRow) => {
          if (previous[item.ID]) {
            next[item.ID] = true;
          }
        });

        return next;
      });
    } catch (error: any) {
      console.error("Failed to load Surat Jalan module:", error);

      showNotice(
        error?.response?.data?.message ||
        "Unable to load Surat Jalan data."
      );
    } finally {
      setLoading(false);
    }
  }, [orderNo]);

  useEffect(() => {
    void load();
  }, [load]);

  // ---------------------------------------------------
  // SEARCH PACKAGES
  // ---------------------------------------------------

  const filteredPackages = useMemo(() => {
    const keyword = searchDO.trim().toLowerCase();

    if (!keyword) return packages;

    return packages.filter((item) => {
      const shipmentId = item.Outbound?.shipment_id ?? "";

      return (
        shipmentId.toLowerCase().includes(keyword) ||
        getPackageCustomerName(item, dos).toLowerCase().includes(keyword) ||
        item.outbound_no?.toLowerCase().includes(keyword) ||
        item.item_code?.toLowerCase().includes(keyword) ||
        item.item_model?.toLowerCase().includes(keyword) ||
        item.product?.item_name?.toLowerCase().includes(keyword) ||
        item.carton_code?.toLowerCase().includes(keyword) ||
        item.pack_ctn_no?.toLowerCase().includes(keyword) ||
        item.barcode?.toLowerCase().includes(keyword) ||
        item.serial_number?.toLowerCase().includes(keyword) ||
        item.package_type?.toLowerCase().includes(keyword)
      );
    });
  }, [packages, searchDO, dos]);

  // Search khusus pada modal Edit Surat Jalan.
  // Select All hanya berlaku untuk hasil pencarian yang sedang terlihat.
  const filteredEditPackageRows = useMemo(() => {
    const keyword = searchEditPackages.trim().toLowerCase();

    if (!keyword) return editPackageRows;

    return editPackageRows.filter((item) => {
      const shipmentId = item.Outbound?.shipment_id ?? "";
      const customerName = getPackageCustomerName(item, dos);

      return (
        shipmentId.toLowerCase().includes(keyword) ||
        customerName.toLowerCase().includes(keyword)
      );
    });
  }, [editPackageRows, searchEditPackages, dos]);

  const toggleEditSelectAll = () => {
    const visibleIds = filteredEditPackageRows.map((item) => Number(item.ID));
    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => !!editSelected[id]);

    setEditSelected((previous) => {
      const next = { ...previous };
      visibleIds.forEach((id) => {
        next[id] = !allSelected;
      });
      return next;
    });
  };

  // ---------------------------------------------------
  // SELECTED PACKAGES
  // ---------------------------------------------------

  const selectedCount = useMemo(() => {
    return Object.values(selected).filter(Boolean).length;
  }, [selected]);

  const selectedPackages = useMemo(() => {
    return packages.filter((item) => selected[item.ID]);
  }, [packages, selected]);

  const toggle = (id: number) => {
    setSelected((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredPackages.map((item) => item.ID);

    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selected[id]);

    setSelected((previous) => {
      const next = { ...previous };

      visibleIds.forEach((id) => {
        next[id] = !allSelected;
      });

      return next;
    });
  };

  // ---------------------------------------------------
  // CREATE SURAT JALAN DRAFT
  // ---------------------------------------------------

  const createDraft = async () => {
    if (!selectedPackages.length) {
      showNotice("Select at least one package.");
      return;
    }

    if (!spkHeader?.driver) {
      showNotice("The driver is missing from the SPK.");
      return;
    }

    if (!spkHeader?.truck_no) {
      showNotice("The truck number is missing from the SPK.");
      return;
    }

    // Group packages berdasarkan outbound_no.
    // outbound_no tetap digunakan untuk relasi backend.
    const grouped = new Map<string, PackageRow[]>();

    for (const item of selectedPackages) {
      const outboundNo = item.outbound_no;

      if (!grouped.has(outboundNo)) {
        grouped.set(outboundNo, []);
      }

      grouped.get(outboundNo)!.push(item);
    }

    // Mapping ke detail SPK
    const items: CreateSJItem[] = Array.from(
      grouped.entries()
    ).map(([outboundNo, rows]) => {
      const doInfo = dos.find(
        (item) =>
          item.outbound_no?.trim().toUpperCase() ===
          outboundNo.trim().toUpperCase()
      );

      return {
        outbound_no: outboundNo,
        order_detail_id: String(doInfo?.ID ?? ""),
        package_ids: rows.map((item) => Number(item.ID)),
      };
    });

    // Validasi detail SPK
    if (items.some((item) => !item.order_detail_id)) {
      showNotice(
        "The SPK delivery order detail could not be found. Please verify the outbound_no mapping in the API response."
      );

      return;
    }

    setConfirmDialog({
      title: "Create Surat Jalan Draft",
      message: `Create a draft with ${selectedPackages.length} package(s) from ${items.length} delivery order(s)?`,
      onConfirm: () => { setConfirmDialog(null); void submitCreate(items); },
    });
  };

  const submitCreate = async (items: CreateSJItem[]) => {
    setSaving(true);

    try {
      const payload = {
        sj_date: getLocalDate(),

        // Mengikuti data SPK
        driver: spkHeader.driver,
        driver_phone: spkHeader.driver_phone,
        transporter_name: spkHeader.transporter_name,
        truck_type: spkHeader.truck_type,
        truck_size: spkHeader.truck_size,

        // Mempertahankan nama property dari implementasi sebelumnya.
        truck_no: spkHeader.truck_no,

        remarks,

        items,
      };

      const res = await api.post(
        `/order/${orderNo}/surat-jalan`,
        payload,
        {
          withCredentials: true,
        }
      );

      showNotice(res.data?.message || "Surat Jalan draft created successfully.");

      setSelected({});
      setSearchDO("");
      setRemarks("");

      await load();

      const sjNo = res.data?.data?.sj_no;

      if (sjNo) {
        router.push(
          `/wms/outbound/order-spk/edit/${spkHeader.order_no}?tab=surat-jalan`
        );
      }
    } catch (error: any) {
      console.error("Create Surat Jalan failed:", error);

      showNotice(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to create Surat Jalan."
      );
    } finally {
      setSaving(false);
    }
  };

  const openEdit = async (sjNo: string) => {
    setLoading(true);
    try {
      const [detailRes, availableRes] = await Promise.all([
        api.get(`/order/sj/${encodeURIComponent(sjNo)}`, { withCredentials: true }),
        api.get(`/order/${orderNo}/surat-jalan/available-packages?sj_no=${encodeURIComponent(sjNo)}`, { withCredentials: true }),
      ]);
      const data = detailRes.data?.data;
      const header = data?.header;
      if (!header || header.status !== "DRAFT") {
        showNotice("Only draft Surat Jalan documents can be edited.", "error");
        return;
      }
      const rows: PackageRow[] = Array.isArray(availableRes.data?.data) ? availableRes.data.data : [];
      const chosen: Record<number, boolean> = {};
      for (const group of (data.items || [])) for (const pkg of (group.packages || [])) chosen[Number(pkg.ID)] = true;
      // Include currently allocated packages in the edit list, even if excluded by another availability filter.
      const allRows = [...rows];
      for (const group of (data.items || [])) for (const pkg of (group.packages || [])) {
        if (!allRows.some((x) => Number(x.ID) === Number(pkg.ID))) allRows.push(pkg);
      }
      setEditingSJ(sjNo);
      setSearchEditPackages("");
      setEditPackageRows(allRows);
      setEditSelected(chosen);
      setEditForm({
        sj_date: String(header.sj_date || "").slice(0, 10),
        driver: header.driver || "", driver_phone: header.driver_phone || "",
        transporter_code: header.transporter_code || "", transporter_name: header.transporter_name || "",
        truck_type: header.truck_type || "", truck_size: header.truck_size || "", truck_no: header.truck_no || "",
        remarks: header.remarks || "",
      });
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Unable to load the Surat Jalan for editing.", "error");
    } finally { setLoading(false); }
  };

  const saveEdit = async () => {
    if (!editingSJ || !editForm) return;
    const chosen = editPackageRows.filter((p) => editSelected[Number(p.ID)]);
    if (!chosen.length) { showNotice("Select at least one package.", "error"); return; }
    const grouped = new Map<string, PackageRow[]>();
    chosen.forEach((p) => { const key = p.outbound_no; if (!grouped.has(key)) grouped.set(key, []); grouped.get(key)!.push(p); });
    const items: CreateSJItem[] = Array.from(grouped.entries()).map(([outboundNo, rows]) => {
      const doInfo = dos.find((d) => d.outbound_no?.trim().toUpperCase() === outboundNo.trim().toUpperCase());
      return { outbound_no: outboundNo, order_detail_id: String(doInfo?.ID ?? ""), package_ids: rows.map((p) => Number(p.ID)) };
    });
    if (items.some((x) => !x.order_detail_id)) { showNotice("A selected delivery order could not be matched to this SPK.", "error"); return; }
    setEditSaving(true);
    try {
      await api.put(`/order/sj/${encodeURIComponent(editingSJ)}`, { ...editForm, items }, { withCredentials: true });
      setEditingSJ(null); setEditForm(null); setEditSelected({});
      showNotice("Surat Jalan draft updated successfully.", "success");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Unable to update the Surat Jalan.", "error");
    } finally { setEditSaving(false); }
  };

  const deleteSJ = (sjNo: string) => setConfirmDialog({
    title: "Delete Surat Jalan",
    message: `Permanently delete draft ${sjNo}? This action cannot be undone.`,
    onConfirm: async () => {
      setConfirmDialog(null);
      try {
        await api.delete(`/order/sj/${encodeURIComponent(sjNo)}`, { withCredentials: true });
        showNotice("Surat Jalan draft permanently deleted.", "success");
        await load();
      } catch (error: any) { showNotice(error?.response?.data?.message || "Unable to delete the Surat Jalan.", "error"); }
    },
  });

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

  return (
    <div className="space-y-5 text-sm">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />

            <h2 className="text-lg font-semibold">
              Delivery Notes
            </h2>
          </div>

          <p className="mt-1 text-gray-500">
            SPK: {orderNo} · Each package is selected as an individual physical unit.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />

          Refresh
        </button>
      </div>

      {/* =================================================
          SPK INFORMATION
      ================================================= */}

      <section className="rounded-lg border bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Truck className="h-4 w-4 text-blue-600" />

          <h3 className="font-semibold">
            Vehicle Information from SPK
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">
              Driver
            </label>

            <input
              type="text"
              value={spkHeader?.driver ?? ""}
              readOnly
              className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-gray-700 outline-none"
              placeholder="-"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">
              Truck No
            </label>

            <input
              type="text"
              value={spkHeader?.truck_no ?? ""}
              readOnly
              className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-gray-700 outline-none"
              placeholder="-"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">
              Truck Type / Size
            </label>

            <input
              type="text"
              value={
                [
                  spkHeader?.truck_type,
                  spkHeader?.truck_size,
                ]
                  .filter(Boolean)
                  .join(" / ") || "-"
              }
              readOnly
              className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-gray-700 outline-none"
            />
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-400">
          Driver and vehicle details are inherited from the SPK. Changes must be made in the SPK form.
        </p>
      </section>

      {/* =================================================
          CREATE SJ
      ================================================= */}

      <section className="space-y-4 rounded-lg border bg-white p-4">
        {/* <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">
              Buat Surat Jalan Draft
            </h3>

            <p className="mt-1 text-xs text-gray-500"> 
              Pilih package yang akan dimasukkan ke Surat Jalan.
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
            {selectedCount} package dipilih
          </div>
        </div> */}

        {/* REMARKS */}

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Remarks
          </label>

          <textarea
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter notes if necessary..."
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* SEARCH */}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <Package className="h-4 w-4 text-blue-600" />

              Available Packages ({packages.length})
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Search by Shipment ID, Delivery To, outbound number, or item details.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={searchDO}
              onChange={(e) => setSearchDO(e.target.value)}
              placeholder="Search Shipment ID / Delivery To / Item ..."
              className="w-full rounded-lg border py-2 pl-9 pr-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* PACKAGE TABLE */}

        <div className="overflow-hidden rounded-lg border">
          <div className="max-h-[460px] overflow-auto">
            <table className="w-full min-w-[1000px] text-xs">
              <thead className="sticky top-0 z-10 bg-gray-100">
                <tr>
                  <th className="w-12 border-b p-3 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredPackages.length > 0 &&
                        filteredPackages.every(
                          (item) => selected[item.ID]
                        )
                      }
                      onChange={toggleSelectAll}
                      disabled={!filteredPackages.length}
                      title="Select all visible packages"
                    />
                  </th>

                  {[
                    "Shipment ID",
                    "Delivery To",
                    "Item Code",
                    "Item Name",
                    "Package",
                    "Qty Pcs",
                  ].map((column) => (
                    <th
                      key={column}
                      className="border-b p-3 text-left font-semibold text-gray-600"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-8 text-center text-gray-500"
                    >
                      Loading packages...
                    </td>
                  </tr>
                ) : filteredPackages.length > 0 ? (
                  filteredPackages.map((item) => {

                    const shipmentId = item.Outbound?.shipment_id || "-";

                    return (
                      <tr
                        key={item.ID}
                        className={`transition hover:bg-gray-50 ${selected[item.ID] ? "bg-blue-50" : ""
                          }`}
                      >
                        <td className="border-b p-3 text-center">
                          <input
                            type="checkbox"
                            checked={!!selected[item.ID]}
                            onChange={() => toggle(item.ID)}
                          />
                        </td>

                        <td className="border-b p-3 font-medium text-blue-700">
                          {shipmentId}
                        </td>

                        <td className="border-b p-3">
                          {getPackageCustomerName(item, dos)}
                        </td>

                        <td className="border-b p-3 font-medium">
                          {item.item_code || "-"}
                        </td>





                        <td className="border-b p-3">
                          {item.product?.item_name ||
                            item.item_model ||
                            "-"}
                        </td>

                        <td className="border-b p-3">
                          <span className="mr-2">{item.package_qty}</span>
                          {item.package_type || "-"}
                        </td>


                        <td className="border-b p-3 text-right">
                          <span className="font-medium">
                            {item.quantity ?? 0}
                          </span>

                          {item.package_qty ? (
                            <span className="ml-1 text-gray-400">
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-8 text-center text-gray-500"
                    >
                      {searchDO
                        ? "No packages match your search."
                        : "No packages are available. They may already be allocated to another delivery notes."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CREATE BUTTON */}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            {selectedPackages.length} package selected from{" "}
            {packages.length} available packages.
          </div>

          <button
            type="button"
            disabled={
              saving ||
              loading ||
              selectedCount === 0
            }
            onClick={createDraft}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />

            {saving ? "Saving..." : "Create Delivery Note"}
          </button>
        </div>
      </section>

      {/* =================================================
          SJ LIST
      ================================================= */}

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              Delivery Notes
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Delivery Notes Created for This Work Order
            </p>
          </div>

          <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
            {sjList.length} Delivery Notes
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[700px] text-xs">
            <thead className="bg-gray-100">
              <tr>
                {[
                  "Delivery Note Number",
                  "Date",
                  "Driver",
                  "Truck",
                  "Status",
                  "Action",
                ].map((column) => (
                  <th
                    key={column}
                    className="border-b p-3 text-left font-semibold text-gray-600"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sjList.length > 0 ? (
                sjList.map((item) => (
                  <tr
                    key={item.sj_no}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="border-b p-3 font-medium">
                      {item.sj_no}
                    </td>

                    <td className="border-b p-3">
                      {item.sj_date
                        ? String(item.sj_date).slice(0, 10)
                        : "-"}
                    </td>

                    <td className="border-b p-3">
                      {item.driver || "-"}
                    </td>

                    <td className="border-b p-3">
                      {item.truck_no || "-"}
                    </td>

                    <td className="border-b p-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status || "-"}
                      </span>
                    </td>

                    <td className="border-b p-3">
                      <div className="flex flex-wrap items-center gap-2">
                      {item.status?.toUpperCase() === "DRAFT" && <>
                        <button type="button" onClick={() => void openEdit(item.sj_no)} className="inline-flex items-center gap-1 rounded-md border border-amber-200 px-3 py-1.5 font-medium text-amber-700 hover:bg-amber-50"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                        <button type="button" onClick={() => deleteSJ(item.sj_no)} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                      </>}
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/wms/outbound/shipping/surat-jalan/${item.sj_no}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 px-3 py-1.5 font-medium text-blue-600 transition hover:bg-blue-50"
                      >
                        <Printer className="h-3.5 w-3.5" />

                        Detail / Print
                      </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-gray-500"
                  >
                    No Delivery Notes have been created for this Work Order yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingSJ && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4">
              <div><h3 className="font-semibold text-gray-900">Edit Delivery Note</h3><p className="text-xs text-gray-500">{editingSJ}</p></div>
              <button type="button" onClick={() => setEditingSJ(null)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {([["sj_date","SJ Date","date"],["driver","Driver","text"],["driver_phone","Driver Phone","text"],["transporter_name","Transporter","text"],["truck_type","Truck Type","text"],["truck_size","Truck Size","text"],["truck_no","Truck Number","text"]] as string[][]).map(([key,label,type]) => <label key={key} className="text-xs font-medium text-gray-600">{label}<input type={type} value={editForm[key] || ""} onChange={(e) => setEditForm((p: any) => ({...p,[key]:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-blue-500" /></label>)}
              </div>
              <label className="block text-xs font-medium text-gray-600">Remarks<textarea rows={2} value={editForm.remarks || ""} onChange={(e) => setEditForm((p: any) => ({...p,remarks:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-blue-500" /></label>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">Allocated Packages</h4>
                    <p className="mt-1 text-xs text-gray-500">
                      Search by Shipment ID or Delivery To. Select All applies to the filtered results.
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {editPackageRows.filter((p) => editSelected[Number(p.ID)]).length} of {editPackageRows.length} selected
                  </span>
                </div>

                <div className="relative w-full md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchEditPackages}
                    onChange={(e) => setSearchEditPackages(e.target.value)}
                    placeholder="Search Shipment ID / Delivery To..."
                    className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="max-h-72 overflow-auto rounded-lg border">
                  <table className="w-full min-w-[850px] text-xs">
                    <thead className="sticky top-0 bg-gray-100">
                      <tr>
                        <th className="w-12 p-2 text-center">
                          <input
                            type="checkbox"
                            checked={
                              filteredEditPackageRows.length > 0 &&
                              filteredEditPackageRows.every((p) => !!editSelected[Number(p.ID)])
                            }
                            onChange={toggleEditSelectAll}
                            disabled={!filteredEditPackageRows.length}
                            title="Select all filtered packages"
                          />
                        </th>
                        <th className="p-2 text-left">Shipment ID</th>
                        <th className="p-2 text-left">Delivery To</th>
                        <th className="p-2 text-left">Item Code</th>
                        <th className="p-2 text-left">Item Name</th>
                        <th className="p-2 text-left">Package</th>
                        <th className="p-2 text-right">Qty Pcs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEditPackageRows.length > 0 ? (
                        filteredEditPackageRows.map((p) => (
                          <tr key={p.ID} className="border-t hover:bg-gray-50">
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={!!editSelected[Number(p.ID)]}
                                onChange={(e) =>
                                  setEditSelected((old) => ({
                                    ...old,
                                    [Number(p.ID)]: e.target.checked,
                                  }))
                                }
                              />
                            </td>
                            <td className="p-2 font-medium text-blue-700">
                              {p.Outbound?.shipment_id || "-"}
                            </td>
                            <td className="p-2">{getPackageCustomerName(p, dos)}</td>
                            <td className="p-2">{p.item_code || "-"}</td>
                            <td className="p-2">{p.product?.item_name || p.item_model || "-"}</td>
                            <td className="p-2">{p.package_qty} {p.package_type}</td>
                            <td className="p-2 text-right">{p.quantity ?? 0}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-gray-500">
                            {searchEditPackages
                              ? "No allocated packages match your search."
                              : "No allocated packages found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-4"><button type="button" onClick={() => setEditingSJ(null)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button><button type="button" disabled={editSaving} onClick={() => void saveEdit()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{editSaving ? "Saving..." : "Save Changes"}</button></div>
          </div>
        </div>
      )}

      {(notice || confirmDialog) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="font-semibold text-gray-900">{confirmDialog?.title || notice?.title}</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-gray-600">{confirmDialog?.message || notice?.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              {confirmDialog ? <><button type="button" onClick={() => setConfirmDialog(null)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button><button type="button" onClick={() => confirmDialog.onConfirm()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Confirm</button></> : <button type="button" onClick={() => setNotice(null)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Close</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
