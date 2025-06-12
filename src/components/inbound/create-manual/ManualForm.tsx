/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ItemFormTable from "./ItemFormTable";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Save } from "lucide-react";
import {
  HeaderFormProps,
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
    mode: "create",
  });

  const [muatan, setMuatan] = useState<ItemFormProps[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<ItemOptions[]>([]);
  const [itemsReceived, setItemsReceived] = useState<ItemReceived[]>([]);

  const fetchData = async () => {
    try {
      const [suppliers] = await Promise.all([
        api.get("/suppliers", { withCredentials: true }),
      ]);

      if (suppliers.data.success) {
        setSuppliers(suppliers.data.data);
        setSupplierOptions(
          suppliers.data.data.map((item: Supplier) => ({
            value: item.supplier_code,
            label: item.supplier_code,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSave = async () => {
    console.log("Data yang disimpan:", formData, muatan);
    // return;

    if (formData.ID === 0) {
      try {
        const res = await api.post(
          "/inbound",
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

  // useEffect(() => {
  //   if (no) {
  //     const fetchInbound = async () => {
  //       try {
  //         const res = await api.get(`/inbound/${no}`, {
  //           withCredentials: true,
  //         });
  //         if (res.data.success) {
  //           setFormData(res.data.data);
  //           setMuatan(res.data.data.items);
  //           setItemsReceived(res.data.data.received_items);
  //         }
  //       } catch (error) {
  //         console.error("Error fetching inbound:", error);
  //       }
  //     };
  //     fetchInbound();
  //   }
  // }, [no]);

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
          setMuatan(res.data.data.items);
          setItemsReceived(res.data.data.received_items);
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
    <div className="p-6">
      <div className="flex justify-between items-center">
        {/* <h2 className="text-lg font-semibold">Create Inbound</h2> */}
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
      <form className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div style={{ display: "none" }}>
            <Label htmlFor="InboundID">Inbound ID</Label>
            <Input
              id="InboundID"
              value={formData.ID}
              onChange={(e) =>
                setFormData({ ...formData, ID: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label htmlFor="InboundNo">Inbound No</Label>
            <Input
              readOnly
              id="InboundNo"
              value={formData.inbound_no}
              onChange={(e) =>
                setFormData({ ...formData, inbound_no: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="InboundDate">Inbound Date</Label>
            <Input
              type="date"
              id="InboundDate"
              value={formData.inbound_date}
              onChange={(e) =>
                setFormData({ ...formData, inbound_date: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="PONumber">PO Number</Label>
            <Input
              id="PONumber"
              value={formData.po_number}
              onChange={(e) =>
                setFormData({ ...formData, po_number: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="Supplier">Supplier</Label>
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
          <div style={{ display: "none" }}>
            <Label htmlFor="Mode">Mode</Label>
            <Input
              id="Mode"
              value={formData.mode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mode: e.target.value as "create" | "edit",
                })
              }
            />
          </div>
          {/* Tambahkan input header lainnya di sini */}
        </div>
      </form>

      <hr className="my-6" />
      <ItemFormTable
        muatan={muatan}
        setMuatan={setMuatan}
        headerForm={formData}
        setHeaderForm={setFormData}
      />
      <hr className="my-6 mb-4" />
      <ItemScannedTable itemsReceived={itemsReceived} />
    </div>
  );
}
