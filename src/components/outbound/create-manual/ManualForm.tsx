/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ItemFormTable from "./ItemFormTable";
import { Button } from "@/components/ui/button";
import { ArrowBigLeftIcon, RefreshCcw, Save } from "lucide-react";
import { HeaderFormProps, ItemFormProps, ItemOptions } from "@/types/outbound";
import { Customer } from "@/types/customer";
import api from "@/lib/api";
import Select from "react-select";
import eventBus from "@/utils/eventBus";
import { useRouter } from "next/router";
import DatePicker from "react-datepicker";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

export default function ManualForm() {
  const router = useRouter();
  const { no } = router.query;
  console.log("outbound_no", no);

  const [formData, setFormData] = useState<HeaderFormProps>({
    ID: 0,
    outbound_no: no ? no.toString() : "Auto Generate",
    outbound_date: new Date().toISOString().split("T")[0],
    customer_code: "",
    shipment_id: "",
    whs_code: "",
    owner_code: "",
    mode: "create",
  });

  const [muatan, setMuatan] = useState<ItemFormProps[]>([]);
  const [customer, setCustomer] = useState<Customer[]>([]);
  const [customerOptions, setCustomerOptions] = useState<ItemOptions[]>([]);
  const [whsOptions, setWhsOptions] = useState<ItemOptions[]>([]);
  const [ownerOptions, setOwnerOptions] = useState<ItemOptions[]>([]);

  const fetchData = async () => {
    try {
      const [suppliers, warehouses, owners] = await Promise.all([
        api.get("/customers"),
        api.get("/warehouses"),
        api.get("/owners"),
      ]);

      if (
        suppliers.data.success &&
        warehouses.data.success &&
        owners.data.success
      ) {
        setCustomer(suppliers.data.data);
        setCustomerOptions(
          suppliers.data.data.map((item: Customer) => ({
            value: item.customer_code,
            label: item.customer_name,
          }))
        );
        setWhsOptions(
          warehouses.data.data.map((item: any) => ({
            value: item.code,
            label: item.code,
          }))
        );
        setOwnerOptions(
          owners.data.data.map((item: any) => ({
            value: item.code,
            label: item.name,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSave = async () => {
    console.log("Data outbound yang disimpan:", formData, muatan);
    // return;
    if (formData.ID === 0) {
      try {
        const res = await api.post(
          "/outbound",
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
          router.push("/wms/outbound/data");
        }
      } catch (error) {
        console.error("Error saving outbound:", error);
        alert("Error saving outbound");
      }
    } else {
      try {
        const res = await api.put(
          `/outbound/${formData.outbound_no}`,
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
          router.push("/wms/outbound/data");
        }
      } catch (error) {
        console.error("Error updating outbound:", error);
        alert("Error updating outbound");
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (no) {
      const fetchOutbound = async () => {
        try {
          const res = await api.get(`/outbound/${no}`, {
            withCredentials: true,
          });
          if (res.data.success) {
            setFormData(res.data.data);
            // setMuatan(res.data.data.items);
            setMuatan(
              res.data.data.items.map((item) => ({
                ...item,
                item_name: item.product?.item_name || "", // ambil item_name dari products
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching outbound:", error);
        }
      };
      fetchOutbound();
    }
  }, [no]);

  return (
    <div className="p-6" style={{ fontSize : "12px" }}>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Label className="text-left shrink-0" style={{ width: "135px" }}>
            Date
          </Label>
          <span className="shrink-0">:</span>
          <DatePicker
            selected={
              formData.outbound_date ? parseISO(formData.outbound_date) : null
            }
            onChange={(date: Date | null) => {
              if (date) {
                setFormData({
                  ...formData,
                  outbound_date: format(date, "yyyy-MM-dd"), // simpan format ISO
                });
              }
            }}
            dateFormat="dd/MM/yyyy" // TAMPILAN Indonesia
            locale={id} // Bahasa Indonesia
            customInput={
              <Input
                id="OutboundDate"
                className="ml-2"
                style={{ width: "160px", fontSize: "12px" }}
              />
            }
            placeholderText="Pilih tanggal"
          />
        </div>

        <div className="space-x-1">
          <Button
            variant="outline"
            className="bg-black-500 text-black hover:bg-gray-200"
            onClick={() => {
              // eventBus.emit("refreshData");
              router.push("/wms/outbound/data");
            }}
          >
            <ArrowBigLeftIcon className="mr-0" />
            Back
          </Button>
          {formData.status !== "complete" && (
            <>
              <Button
                variant="outline"
                className="bg-green-500 text-white hover:bg-green-600"
                // onClick={() => {
                //   eventBus.emit("refreshData");
                // }}
              >
                <RefreshCcw className="mr-1" />
                Refresh
              </Button>
              <Button
                variant="outline"
                className="bg-blue-500 text-white hover:bg-blue-600"
                onClick={handleSave}
              >
                <Save className="mr-2" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>
      <hr className="my-4" />

      <div className="grid grid-cols-2 gap-4" style={{ fontSize : "12px" }}>
        <div className="bg-white-200 p-0 space-y-1">
          <div className="flex items-center gap-4">
            <Label className="w-32 text-left shrink-0">Shipment ID</Label>
            <span className="shrink-0">:</span>
            <Input
              id="ShipmentID"
              style={{ width: "100%", fontSize: "12px" }}
              value={formData.shipment_id}
              onChange={(e) =>
                setFormData({ ...formData, shipment_id: e.target.value })
              }
            />
          </div>

          <div className="flex items-center gap-4">
            <Label className="w-32 text-left shrink-0">Owner</Label>
            <span className="shrink-0">:</span>
            <div className="flex-1">
              <Select
                value={ownerOptions.find(
                  (option) => option.value === formData.owner_code
                )}
                options={ownerOptions}
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
            <Label className="w-32 text-left shrink-0">WhsCode</Label>
            <span className="shrink-0">:</span>
            <div className="flex-1">
              <Select
                value={whsOptions.find(
                  (option) => option.value === formData.whs_code
                )}
                options={whsOptions}
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

          {/* Customer */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-left shrink-0">Customer</Label>
            <span className="shrink-0">:</span>
            <div className="flex-1">
              <Select
                value={customerOptions.find(
                  (option) => option.value === formData.customer_code
                )}
                options={customerOptions}
                onChange={(selectedOption) => {
                  if (selectedOption) {
                    setFormData({
                      ...formData,
                      customer_code: selectedOption.value,
                    });
                  }
                }}
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
              style={{ fontSize : "12px" }}
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
      </div>

      <form className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Outbound ID (hidden) */}
          <div className="hidden">
            <div className="flex items-center gap-4">
              <Label className="w-32 text-left shrink-0">Outbound ID</Label>
              <span className="shrink-0">:</span>
              <Input
                id="OutboundID"
                value={formData.ID}
                onChange={(e) =>
                  setFormData({ ...formData, ID: Number(e.target.value) })
                }
              />
            </div>
          </div>

          {/* Mode (hidden) */}
          <div className="hidden">
            <div className="flex items-center gap-4">
              <Label className="w-32 text-left shrink-0">Mode</Label>
              <span className="shrink-0">:</span>
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
          </div>
        </div>
      </form>

      <hr className="my-6" />
      <ItemFormTable
        muatan={muatan}
        setMuatan={setMuatan}
        headerForm={formData}
        setHeaderForm={setFormData}
      />
    </div>
  );
}
