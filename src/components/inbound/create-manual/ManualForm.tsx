/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ItemFormTable from "./ItemFormTable";
import { Button } from "@/components/ui/button";
import { ArrowBigLeft, Plus, RefreshCcw, Save, Trash2 } from "lucide-react";
import {
  HeaderFormProps,
  InboundReference,
  ItemFormProps,
  ItemOptions,
  ItemReceived,
} from "@/types/inbound";
import { Supplier } from "@/types/supplier";
import api from "@/lib/api";
import Select from "react-select";
import eventBus from "@/utils/eventBus";
import { useRouter } from "next/router";
import ItemScannedTable from "./ItemScannedTable";
import { Transporter } from "@/types/transporter";

import DatePicker from "react-datepicker";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { parse } from "path";

export default function ManualForm() {
  const router = useRouter();
  const { no } = router.query;
  console.log("inbound_no", no);

  const [formData, setFormData] = useState<HeaderFormProps>({
    ID: 0,
    inbound_no: no ? no.toString() : "Auto Generate",
    inbound_date: new Date().toISOString().split("T")[0],
    receipt_id: "",
    supplier: "",
    po_number: "",
    invoice: "",
    transporter: "",
    no_truck: "",
    driver: "",
    container: "",
    owner_code: "",
    whs_code: "",
    type: "NORMAL",
    mode: "create",
    origin: "",
    po_date: "",
    arrival_time: "",
    start_unloading: "",
    end_unloading: "",
    truck_size: "",
    bl_no: "",
    koli: 0,
  });

  const [muatan, setMuatan] = useState<ItemFormProps[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<ItemOptions[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [transporterOptions, setTransporterOptions] = useState<ItemOptions[]>(
    []
  );
  const [itemsReceived, setItemsReceived] = useState<ItemReceived[]>([]);
  const [inboundTypeOptions, setInboundTypeOptions] = useState<ItemOptions[]>([
    { value: "NORMAL", label: "NORMAL" },
    { value: "RETURN", label: "RETURN" },
  ]);
  const [originOptions, setOriginOptions] = useState<ItemOptions[]>([
    { value: "INDONESIA", label: "INDONESIA" },
    { value: "JAPAN", label: "JAPAN" },
  ]);
  const [ownerOptions, setOwnerOptions] = useState<ItemOptions[]>([]);
  const [whsCodeOptions, setWhsCodeOptions] = useState<ItemOptions[]>([]);
  const [divisionOptions, setDivisionOptions] = useState<ItemOptions[]>([
    { value: "REGULAR", label: "REGULAR" },
    { value: "SALES", label: "SALES" },
    { value: "ECOM", label: "ECOM" },
    { value: "PROJECT", label: "PROJECT" },
  ]);

  const [references, setReferences] = useState<InboundReference[]>([
    {
      ID: Date.now(),
      inbound_id: 0,
      ref_no: "",
    },
  ]);

  const handleAddInvoice = () => {
    setReferences([
      ...references,
      {
        ID: Date.now(),
        inbound_id: 0,
        ref_no: "",
      },
    ]);
  };

  const handleRemoveInvoice = (index: number) => {
    const newReferences = [...references];
    newReferences.splice(index, 1);
    setReferences(newReferences);
  };

  const handleInvoiceChange = (index: number, value: string) => {
    const newReferences = [...references];
    newReferences[index].ref_no = value;
    console.log("newReferences", newReferences);
    setReferences(newReferences);
    setMuatan((prev) =>
      prev.map((m) => (m.ref_id === index ? { ...m, ref_no: value } : m))
    );
  };

  const fetchData = async () => {
    try {
      const [suppliers, transporters, warehouses, owners] = await Promise.all([
        api.get("/suppliers"),
        api.get("/transporters"),
        api.get("/warehouses"),
        api.get("/owners"),
      ]);

      if (suppliers.data.success) {
        setSuppliers(suppliers.data.data);
        setSupplierOptions(
          suppliers.data.data.map((item: Supplier) => ({
            value: item.supplier_code,
            label: item.supplier_name,
          }))
        );

        if (transporters.data.success) {
          setTransporters(transporters.data.data);
          setTransporterOptions(
            transporters.data.data.map((item: Transporter) => ({
              value: item.transporter_code,
              label: item.transporter_code + " - " + item.transporter_name,
            }))
          );
        }

        if (warehouses.data.success) {
          setWhsCodeOptions(
            warehouses.data.data.map((item: any) => ({
              value: item.code,
              label: item.code,
            }))
          );
        }

        if (owners.data.success) {
          setOwnerOptions(
            owners.data.data.map((item: any) => ({
              value: item.code,
              label: item.name,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSave = async () => {
    const newMuatan = muatan.map((m) => ({
      ...m,
      ref_no: references.find((ref) => ref.ID === m.ref_id)?.ref_no,
    }));

    console.log("Data yang disimpan:", formData, references, newMuatan);
    // return;

    if (muatan.length === 0) {
      eventBus.emit("showAlert", {
        title: "Error!",
        description: "Please add at least one item",
        type: "error",
      });
      return;
    }

    if (formData.ID === 0) {
      try {
        const res = await api.post("/inbound", {
          ...formData,
          references,
          items: newMuatan,
        });
        if (res.data.success) {
          eventBus.emit("showAlert", {
            title: "Success!",
            description: res.data.message,
            type: "success",
          });
          router.push("/wms/inbound/data");
        }
      } catch (error) {
        console.error("Error saving inbound:", error);
        alert("Error saving inbound");
      }
    } else {
      try {
        const res = await api.put(
          `/inbound/${formData.inbound_no}`,
          {
            ...formData,
            items: muatan,
          },
          {
            withCredentials: true,
          }
        );
        if (res.data.success) {
          eventBus.emit("showAlert", {
            title: "Success!",
            description: res.data.message,
            type: "success",
          });
          router.push("/wms/inbound/data");
        }
      } catch (error) {
        console.error("Error updating inbound:", error);
        alert("Error updating inbound");
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!no) return;

    const fetchInbound = async () => {
      eventBus.emit("loading", true);
      try {
        const res = await api.get(`/inbound/${no}`, {
          withCredentials: true,
        });
        if (res.data.success) {
          setFormData(res.data.data);
          setReferences(res.data.data.references);
          setMuatan(res.data.data.details);
          setItemsReceived(res.data.data.received);
          eventBus.emit("loading", false);
        }
      } catch (error) {
        console.error("Error fetching inbound:", error);
      }
    };

    // Panggil saat komponen mount / no berubah
    fetchInbound();

    // Dengarkan event `refreshData`
    const handleRefresh = () => {
      fetchInbound();
    };
    eventBus.on("refreshData", handleRefresh);

    // Cleanup
    return () => {
      eventBus.off("refreshData", handleRefresh);
    };
  }, [no]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault(); // cegah browser save
        console.log("Trigger tombol save manual");

        // Misalnya trigger fungsi handleSave()
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [muatan, formData, references]);

  return (
    <div className="p-4" style={{ fontSize: "12px" }}>
      <div className="flex justify-between items-center mb-4">
        {/* <div className="grid grid-cols-1 sm:grid-cols-1 gap-4"> */}
        {/* <div className="flex items-center gap-4">
            <Label className="w-32 text-left shrink-0">Date</Label>
            <span className="shrink-0">:</span>

            <DatePicker
              selected={
                formData.inbound_date ? parseISO(formData.inbound_date) : null
              }
              onChange={(date: Date | null) => {
                if (date) {
                  setFormData({
                    ...formData,
                    inbound_date: format(date, "yyyy-MM-dd"), // simpan format ISO
                  });
                }
              }}
              dateFormat="dd/MM/yyyy" // TAMPILAN Indonesia
              locale={id} // Bahasa Indonesia
              customInput={
                <Input
                  id="InboundDate"
                  style={{ width: "160px", fontSize: "12px" }}
                />
              }
              placeholderText="Pilih tanggal"
            />
          </div> */}
        {/* </div> */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-black-500 text-black hover:bg-gray-200"
            onClick={() => {
              // eventBus.emit("refreshData");
              router.push("/wms/inbound/data");
            }}
          >
            <ArrowBigLeft className="mr-0" />
            Back
          </Button>
          <Button
            variant="outline"
            className="bg-green-500 text-white hover:bg-green-600"
            onClick={() => {
              eventBus.emit("refreshData");
            }}
          >
            <RefreshCcw className="mr-1" />
            Refresh
          </Button>
          {formData.status !== "complete" && (
            <Button
              variant="outline"
              className="bg-blue-500 text-white hover:bg-blue-600"
              onClick={handleSave}
            >
              <Save className="mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>
      {/* <hr className="my-4" /> */}

      <div className="grid grid-cols-2 gap-4">
        {/* Column 1 */}
        <div className="bg-white-200 p-0 space-y-1">
          <div className="grid grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Receive Date
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <DatePicker
                    selected={
                      formData.inbound_date
                        ? parseISO(formData.inbound_date)
                        : null
                    }
                    onChange={(date: Date | null) => {
                      if (date) {
                        setFormData({
                          ...formData,
                          inbound_date: format(date, "yyyy-MM-dd"), // simpan format ISO
                        });
                      }
                    }}
                    dateFormat="dd/MM/yyyy" // TAMPILAN Indonesia
                    locale={id} // Bahasa Indonesia
                    customInput={
                      <Input
                        id="InboundDate"
                        style={{ width: "160px", fontSize: "12px" }}
                      />
                    }
                    placeholderText="Choose date"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Receipt ID
                </Label>
                <span className="shrink-0">:</span>
                <Input
                  id="ReceiptID"
                  style={{ fontSize: "12px" }}
                  className="flex-1"
                  value={formData.receipt_id}
                  onChange={(e) =>
                    setFormData({ ...formData, receipt_id: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Owner
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <Select
                    options={ownerOptions}
                    defaultValue={ownerOptions.find(
                      (option) => option.value === "YMID"
                    )}
                    value={ownerOptions.find(
                      (option) => option.value === formData.owner_code
                    )}
                    onChange={(selectedOption) => {
                      if (selectedOption) {
                        setFormData({
                          ...formData,
                          owner_code: selectedOption.value,
                        });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Supplier
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <Select
                    value={supplierOptions.find(
                      (option) => option.value === formData.supplier
                    )}
                    options={supplierOptions}
                    onChange={(selectedOption) => {
                      if (selectedOption) {
                        setFormData({
                          ...formData,
                          supplier: selectedOption.value,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  IB Type
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <Select
                    id="InboundType"
                    options={inboundTypeOptions}
                    defaultValue={inboundTypeOptions.find(
                      (option) => option.value === "NORMAL"
                    )}
                    value={inboundTypeOptions.find(
                      (option) => option.value === formData.type
                    )}
                    onChange={(selectedOption) => {
                      if (selectedOption) {
                        setFormData({
                          ...formData,
                          type: selectedOption.value,
                        });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Whs Code
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <Select
                    options={whsCodeOptions}
                    defaultValue={whsCodeOptions.find(
                      (option) => option.value === "NGK"
                    )}
                    value={whsCodeOptions.find(
                      (option) => option.value === formData.whs_code
                    )}
                    onChange={(selectedOption) => {
                      if (selectedOption) {
                        setFormData({
                          ...formData,
                          whs_code: selectedOption.value,
                        });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Origin
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <Select
                    options={originOptions}
                    // defaultValue={originOptions.find(
                    //   (option) => option.value === "INDONESIA"
                    // )}
                    value={originOptions.find(
                      (option) => option.value === formData.origin
                    )}
                    onChange={(selectedOption) => {
                      if (selectedOption) {
                        setFormData({
                          ...formData,
                          origin: selectedOption.value,
                        });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  PO Date
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <DatePicker
                    selected={
                      formData.po_date
                        ? parseISO(formData.po_date)
                        : null
                    }
                    onChange={(date: Date | null) => {
                      if (date) {
                        setFormData({
                          ...formData,
                          po_date: format(date, "yyyy-MM-dd"), // simpan format ISO
                        });
                      }
                    }}
                    dateFormat="dd/MM/yyyy" // TAMPILAN Indonesia
                    locale={id} // Bahasa Indonesia
                    customInput={
                      <Input
                        id="PoDate"
                        style={{ width: "160px", fontSize: "12px" }}
                      />
                    }
                    placeholderText="Choose date"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Remarks - Full Width */}
          <div className="flex items-center gap-2 mt-2">
            <Label
              className="w-24 text-left shrink-0 pt-2"
              style={{ fontSize: "12px" }}
              htmlFor="RemarksHeader"
            >
              Remarks
            </Label>
            <span className="shrink-0 pt-2">:</span>
            <textarea
              style={{ fontSize: "12px" }}
              id="RemarksHeader"
              className="flex-1 border border-input bg-background rounded-md px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              rows={2}
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
            />
          </div>
        </div>

        {/* Column 2 */}
        <div className="bg-white-200 p-0 space-y-1">
          <div className="grid grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Trucker
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex flex-1 items-center">
                  <Select
                    className="w-full"
                    value={transporterOptions.find(
                      (option) => option.value === formData.transporter
                    )}
                    options={transporterOptions}
                    onChange={(selectedOption) => {
                      if (selectedOption) {
                        setFormData({
                          ...formData,
                          transporter: selectedOption.value,
                        });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Truck No.
                </Label>
                <span className="shrink-0">:</span>
                <Input
                  style={{ fontSize: "12px" }}
                  className="flex-1 form-control-sm"
                  value={formData.no_truck}
                  onChange={(e) =>
                    setFormData({ ...formData, no_truck: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Arrival Time
                </Label>
                <span className="shrink-0">:</span>
                <Input
                  style={{ fontSize: "12px" }}
                  className="flex-1 form-control-sm"
                  type="time"
                  value={formData.arrival_time}
                  onChange={(e) =>
                    setFormData({ ...formData, arrival_time: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Start Unloading
                </Label>
                <span className="shrink-0">:</span>
                <Input
                  style={{ fontSize: "12px" }}
                  className="flex-1 form-control-sm"
                  type="time"
                  value={formData.start_unloading}
                  onChange={(e) =>
                    setFormData({ ...formData, start_unloading: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Finish Unloading
                </Label>
                <span className="shrink-0">:</span>
                <Input
                  style={{ fontSize: "12px" }}
                  className="flex-1 form-control-sm"
                  type="time"
                  value={formData.end_unloading}
                  onChange={(e) =>
                    setFormData({ ...formData, end_unloading: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Driver
                </Label>
                <span className="shrink-0">:</span>
                <Input
                  style={{ fontSize: "12px" }}
                  className="flex-1"
                  value={formData.driver}
                  onChange={(e) =>
                    setFormData({ ...formData, driver: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Container No.
                </Label>
                <span className="shrink-0">:</span>
                <Input
                  style={{ fontSize: "12px" }}
                  className="flex-1"
                  value={formData.container}
                  onChange={(e) =>
                    setFormData({ ...formData, container: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Truck Size
                </Label>
                <span className="shrink-0">:</span>
                <Input
                  style={{ fontSize: "12px" }}
                  className="flex-1"
                  value={formData.truck_size}
                  onChange={(e) =>
                    setFormData({ ...formData, truck_size: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  BL No.
                </Label>
                <span className="shrink-0">:</span>
                <Input
                  style={{ fontSize: "12px" }}
                  className="flex-1"
                  value={formData.bl_no}
                  onChange={(e) =>
                    setFormData({ ...formData, bl_no: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Koli
                </Label>
                <span className="shrink-0">:</span>
                <Input
                  style={{ fontSize: "12px" }}
                  className="flex-1"
                  type="number"
                  min="0"
                  value={formData.koli}
                  onChange={(e) =>
                    setFormData({ ...formData, koli : parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <hr className="my-4" /> */}

      <div
        className="flex justify-between items-center mb-4"
        style={{ display: "none" }}
      >
        {/* <h2 className="text-lg font-semibold">Detail Items</h2> */}
        <div className="space-x-2">
          <Button
            className="item-end"
            variant="default"
            onClick={() => handleAddInvoice()}
          >
            <Plus className="mr-2" />
            Add Invoice
          </Button>
        </div>
      </div>

      {references.map((item, index) => (
        <>
          <div
            key={index}
            className="flex justify-between items-center mb-4 mt-2"
          >
            <div className="flex items-center gap-2">
              <Label
                className="w-24 text-left shrink-0"
                style={{ fontSize: "12px" }}
              >
                Invoice
              </Label>
              <span className="shrink-0">:</span>
              <Input
                style={{ fontSize: "12px" }}
                value={references[index].ref_no}
                onChange={(e) => handleInvoiceChange(index, e.target.value)}
              />

              {references?.length > 1 && (
                <div className="flex-1">
                  <Button
                    variant="outline"
                    className="bg-red-500 text-white hover:bg-red-600"
                    onClick={() => handleRemoveInvoice(index)}
                  >
                    <Trash2 className="mr-2" />
                    Remove
                  </Button>
                </div>
              )}
            </div>
            {index !== references?.length - 1 && <hr className="my-4" />}
          </div>
          <div
            key={item.ID}
            className="rounded-2xl shadow-md border border-gray-200 p-6 mb-6 bg-white"
          >
            {/* <hr className="my-6" /> */}
            <ItemFormTable
              muatan={muatan}
              setMuatan={setMuatan}
              headerForm={formData}
              setHeaderForm={setFormData}
              inboundReferences={references[index]}
              setInboundReferences={setReferences[index]}
            />
            {/* <hr className="my-6 mb-4" /> */}
          </div>
        </>
      ))}
      {itemsReceived?.length > 0 && (
        <ItemScannedTable itemsReceived={itemsReceived} />
      )}
    </div>
  );
}
