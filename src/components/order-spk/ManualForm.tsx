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
import { Transporter } from "@/types/transporter";
import { HeaderSPK, MuatanOrderSPK } from "@/types/order-spk";
import { Textarea } from "../ui/textarea";

export default function ManualForm() {
  const router = useRouter();
  const { order_no } = router.query;
  console.log("outbound_no", order_no);

  const [formData, setFormData] = useState<HeaderSPK>({
    ID: 0,
    order_no: order_no ? order_no.toString() : "Auto Generate",
    order_date: new Date().toISOString().split("T")[0],
  });

  const [muatan, setMuatan] = useState<MuatanOrderSPK[]>([]);
  const [transporter, setTransporter] = useState<Transporter[]>([]);
  const [transporterOptions, setTransporterOptions] = useState<ItemOptions[]>(
    []
  );
  const [ordertypeOptions, setOrdertypeOptions] = useState<ItemOptions[]>([
    { value: "TRIP", label: "TRIP" },
    { value: "MULTI DROP", label: "MULTI DROP" },
  ]);
  const [truckTypeOptions, setTruckTypeOptions] = useState<ItemOptions[]>([
    { value: "CDD", label: "CDD" },
    { value: "CDE", label: "CDE" },
  ]);

  const fetchData = async () => {
    try {
      const [transporters] = await Promise.all([api.get("/transporters")]);

      if (transporters.data.success) {
        setTransporter(transporters.data.data);
        setTransporterOptions(
          transporters.data.data.map((item: Transporter) => ({
            value: item.transporter_code,
            label: item.transporter_name,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSave = async () => {
    console.log("Data SPK yang akan disimpan:", formData, muatan);
    // return;
    if (formData.ID === 0) {
      try {
        const res = await api.post(
          "/order",
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
          // router.push("/wms/outbound/order-spk/data");
          router.push("/wms/outbound/data?tab=Order SPK");
        }
      } catch (error) {
        console.error("Error saving outbound:", error);
        alert("Error saving outbound");
      }
    } else {
      try {
        const res = await api.put(
          `/order/${formData.order_no}`,
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
          // router.push("/wms/outbound/data");
          router.push("/wms/outbound/data?tab=Order SPK");
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
    if (order_no) {
      const fetchOutbound = async () => {
        try {
          const res = await api.get(`/order/${order_no}`, {
            withCredentials: true,
          });
          if (res.data.success) {
            setFormData(res.data.data);
            setMuatan(
              res.data.data.items.map((item) => ({
                ...item,
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching order:", error);
        }
      };
      fetchOutbound();
    }
  }, [order_no]);

  return (
    <div className="p-4" style={{ fontSize: "12px" }}>
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-1">
          <Button
            variant="outline"
            className="bg-black-500 text-black hover:bg-gray-200"
            onClick={() => {
              // eventBus.emit("refreshData");
              router.push("/wms/outbound/data?tab=Order SPK");
              // router.back();
            }}
          >
            <ArrowBigLeftIcon className="mr-0" />
            Back
          </Button>
          {formData.status !== "complete" && (
            <>
              {/* <Button
                variant="outline"
                className="bg-green-500 text-white hover:bg-green-600"
              >
                <RefreshCcw className="mr-1" />
                Refresh
              </Button> */}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white-200 p-0 space-y-1">
          <div className="flex items-center gap-2">
            <Label
              className="w-24 text-left shrink-0"
              style={{ fontSize: "12px" }}
            >
              Order Date
            </Label>
            <span className="shrink-0">:</span>
            <div className="flex-1">
              <DatePicker
                selected={
                  formData.order_date ? parseISO(formData.order_date) : null
                }
                onChange={(date: Date | null) => {
                  if (date) {
                    setFormData({
                      ...formData,
                      order_date: format(date, "yyyy-MM-dd"), // simpan format ISO
                    });
                  }
                }}
                dateFormat="dd/MM/yyyy" // TAMPILAN Indonesia
                locale={id} // Bahasa Indonesia
                customInput={
                  <Input
                    id="OutboundDate"
                    style={{ width: "160px", fontSize: "12px" }}
                  />
                }
                placeholderText="Pilih tanggal"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label
              className="w-24 text-left shrink-0"
              style={{ fontSize: "12px" }}
            >
              Transporter
            </Label>
            <span className="shrink-0">:</span>
            <div className="flex-1">
              <Select
                value={transporterOptions.find(
                  (option) => option.value === formData.transporter_code
                )}
                className="w-80"
                options={transporterOptions}
                onChange={(selectedOption) => {
                  if (selectedOption) {
                    setFormData({
                      ...formData,
                      transporter_code: selectedOption.value,
                      transporter_name: transporter.find(
                        (item) => item.transporter_code === selectedOption.value
                      ).transporter_name,
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
              Driver
            </Label>
            <span className="shrink-0">:</span>
            <div className="flex-1">
              <Input
                id="Driver"
                style={{ fontSize: "12px" }}
                className="flex-1 w-64"
                value={formData.driver}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    driver: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label
              className="w-24 text-left shrink-0"
              style={{ fontSize: "12px" }}
            >
              Truck Size
            </Label>
            <span className="shrink-0">:</span>
            <div className="flex-1">
              <Input
                id="TruckSize"
                style={{ fontSize: "12px" }}
                className="flex-1 w-64"
                value={formData.truck_size}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    truck_size: e.target.value,
                  })
                }
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
            <div className="flex-1">
              <Input
                id="TruckNo"
                style={{ fontSize: "12px" }}
                className="flex-1 w-64"
                value={formData.truck_no}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    truck_no: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>
        <div className="bg-white-200 p-0 space-y-1">
          <div className="flex items-center gap-2">
            <Label
              className="w-32 text-left shrink-0"
              style={{ fontSize: "12px" }}
            >
              Truck Type
            </Label>
            <span className="shrink-0">:</span>
            <div className="flex-1">
              <Select
                className="w-40"
                value={truckTypeOptions.find(
                  (option) => option.value === formData.truck_type
                )}
                options={truckTypeOptions}
                onChange={(selectedOption) => {
                  if (selectedOption) {
                    setFormData({
                      ...formData,
                      truck_type: selectedOption.value,
                    });
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label
              className="w-32 text-left shrink-0"
              style={{ fontSize: "12px" }}
            >
              Order Type
            </Label>
            <span className="shrink-0">:</span>
            <div className="flex-1">
              <Select
                className="w-40"
                value={ordertypeOptions.find(
                  (option) => option.value === formData.order_type
                )}
                options={ordertypeOptions}
                onChange={(selectedOption) => {
                  if (selectedOption) {
                    setFormData({
                      ...formData,
                      order_type: selectedOption.value,
                    });
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label
              className="w-32 text-left shrink-0"
              style={{ fontSize: "12px" }}
            >
              Load Date
            </Label>
            <span className="shrink-0">:</span>
            <div className="flex">
              <DatePicker
                selected={
                  formData.load_date ? parseISO(formData.load_date) : null
                }
                onChange={(date: Date | null) => {
                  if (date) {
                    setFormData({
                      ...formData,
                      load_date: format(date, "yyyy-MM-dd"), // simpan format ISO
                    });
                  }
                }}
                dateFormat="dd/MM/yyyy" // TAMPILAN Indonesia
                locale={id} // Bahasa Indonesia
                customInput={
                  <Input
                    id="PlanPickupDate"
                    style={{ width: "160px", fontSize: "12px" }}
                  />
                }
                placeholderText="Choose date"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label
              className="w-32 text-left shrink-0"
              style={{ fontSize: "12px" }}
            >
              Start/Finish Load
            </Label>
            <span className="shrink-0">:</span>
            <div className="flex gap-2">
              <Input
                id="startTime"
                type="time"
                style={{ width: "160px", fontSize: "12px" }}
                value={formData.load_start_time}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    load_start_time: e.target.value,
                  })
                }
              />
              <Input
                id="endTime"
                type="time"
                style={{ width: "160px", fontSize: "12px" }}
                value={formData.load_end_time}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    load_end_time: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label
              className="w-32 text-left shrink-0"
              style={{ fontSize: "12px" }}
            >
              Remarks
            </Label>
            <span className="shrink-0">:</span>
            <div className="flex gap-2">
              <Textarea
                id="remarks"
                style={{ width: "325px", fontSize: "12px", height: "40px" }}
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    remarks: e.target.value,
                  })
                }
              /> 
              {/* <textarea
                id="remarks"
                style={{ width: "160px", fontSize: "12px", height: "40px" }}
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    remarks: e.target.value,
                  })
                }
              /> */}
            </div>
          </div>
          {/* <div className="flex items-center gap-2">
            <Label
              className="w-32 text-left shrink-0"
              style={{ fontSize: "12px" }}
            >
              Arrival Date
            </Label>
            <span className="shrink-0">:</span>
            <div className="flex">
              <DatePicker
                selected={
                  formData.load_date ? parseISO(formData.load_date) : null
                }
                onChange={(date: Date | null) => {
                  if (date) {
                    setFormData({
                      ...formData,
                      load_date: format(date, "yyyy-MM-dd"), // simpan format ISO
                    });
                  }
                }}
                dateFormat="dd/MM/yyyy" // TAMPILAN Indonesia
                locale={id} // Bahasa Indonesia
                customInput={
                  <Input
                    id="PlanPickupDate"
                    style={{ width: "160px", fontSize: "12px" }}
                  />
                }
                placeholderText="Choose date"
              />
            </div>
          </div> */}

          {/* <div className="flex items-center gap-2">
            <Label
              className="w-32 text-left shrink-0"
              style={{ fontSize: "12px" }}
            >
              In/Out From Customer
            </Label>
            <span className="shrink-0">:</span>
            <div className="flex gap-2">
              <Input
                id="startTime"
                type="time"
                style={{ width: "160px", fontSize: "12px" }}
                // value={formData.start_pick_time}
                // onChange={(e) =>
                //   setFormData({
                //     ...formData,
                //     start_pick_time: e.target.value,
                //   })
                // }
              />
              <Input
                id="endTime"
                type="time"
                style={{ width: "160px", fontSize: "12px" }}
                // value={formData.end_pick_time}
                // onChange={(e) =>
                //   setFormData({
                //     ...formData,
                //     end_pick_time: e.target.value,
                //   })
                // }
              />
            </div>
          </div> */}
        </div>
      </div>

      <form className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="hidden">
            <div className="flex items-center gap-4">
              <Label className="w-32 text-left shrink-0">Order ID</Label>
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
