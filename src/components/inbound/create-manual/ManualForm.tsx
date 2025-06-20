/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ItemFormTable from "./ItemFormTable";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw, Save, Trash2 } from "lucide-react";
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
import { time } from "console";
import { Textarea } from "@/components/ui/textarea";
import { AgInputTextArea } from "ag-grid-community";
import { Transporter } from "@/types/transporter";

export default function ManualForm() {
  const router = useRouter();
  const { no } = router.query;
  console.log("inbound_no", no);

  const [formData, setFormData] = useState<HeaderFormProps>({
    ID: 0,
    inbound_no: no ? no.toString() : "Auto Generate",
    inbound_date: new Date().toISOString().split("T")[0],
    supplier: "",
    po_number: "",
    invoice: "",
    transporter: "",
    no_truck: "",
    driver: "",
    container: "",
    type: "normal",
    mode: "create",
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
    { value: "normal", label: "Normal" },
    { value: "return", label: "Return" },
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
      const [suppliers, transporters] = await Promise.all([
        api.get("/suppliers", { withCredentials: true }),
        api.get("/transporters", { withCredentials: true }),
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
              label: item.transporter_name,
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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {formData.mode === "create" ? "Create" : "Update"} Inbound
        </h2>
        <div className="space-x-2">
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
      <hr className="my-4" />

      <form className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Inbound No */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-left shrink-0">No. / Type</Label>
            <span className="shrink-0">:</span>
            <Input
              readOnly
              id="InboundNo"
              className="flex-1"
              value={formData.inbound_no}
              onChange={(e) =>
                setFormData({ ...formData, inbound_no: e.target.value })
              }
            />
            <Select
              id="InboundType"
              options={inboundTypeOptions}
              defaultValue={inboundTypeOptions.find(
                (option) => option.value === "normal"
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

          {/* Inbound Date */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-left shrink-0">Date</Label>
            <span className="shrink-0">:</span>
            <Input
              type="date"
              id="InboundDate"
              className="flex-1"
              value={formData.inbound_date}
              onChange={(e) =>
                setFormData({ ...formData, inbound_date: e.target.value })
              }
            />
          </div>

          {/* Supplier */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-left shrink-0">Supplier</Label>
            <span className="shrink-0">:</span>
            <div className="flex-1 ">
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
          {/* Transporter */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-left shrink-0">
              Trucker / No Truck
            </Label>
            <span className="shrink-0">:</span>
            <div className="flex flex-1 items-center gap-4">
              <Select
                className="w-60"
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
              <Input
                className="flex-1"
                value={formData.no_truck}
                onChange={(e) =>
                  setFormData({ ...formData, no_truck: e.target.value })
                }
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="flex items-start gap-4">
            <Label
              className="w-32 text-left shrink-0 pt-2"
              htmlFor="RemarksHeader"
            >
              Remarks
            </Label>
            <span className="shrink-0 pt-2">:</span>
            <textarea
              id="RemarksHeader"
              className="flex-1 border border-input bg-background rounded-md px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              rows={2}
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
            />
          </div>

          {/* Driver / Container */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-left shrink-0">
              Driver / Container
            </Label>
            <span className="shrink-0">:</span>
            <div className="flex flex-1 items-center gap-4">
              <Input
                className="flex-1"
                value={formData.driver}
                onChange={(e) =>
                  setFormData({ ...formData, driver: e.target.value })
                }
              />
              <Input
                className="flex-1"
                value={formData.container}
                onChange={(e) =>
                  setFormData({ ...formData, container: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </form>

      <hr className="my-4" />

      <div className="flex justify-between items-center mb-4">
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
        <div
          key={item.ID}
          className="rounded-2xl shadow-md border border-gray-200 p-6 mb-6 bg-white"
        >
          <div key={index} className="flex justify-between items-center mb-4">
            <Label className="w-32 text-left shrink-0">Invoice</Label>
            <span className="shrink-0">:</span>
            <Input
              className="flex-1 ml-2 mr-2 w-1/3"
              value={references[index].ref_no}
              onChange={(e) => handleInvoiceChange(index, e.target.value)}
            />

            {references.length > 1 && (
              <div className="space-x-2">
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
            {index !== references.length - 1 && <hr className="my-4" />}
          </div>

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
      ))}
      {itemsReceived.length > 0 && (
        <ItemScannedTable itemsReceived={itemsReceived} />
      )}
    </div>
  );
}
