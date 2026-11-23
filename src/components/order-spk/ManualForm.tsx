/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ItemFormTable from "./ItemFormTable";
import { Button } from "@/components/ui/button";
import { ArrowBigLeftIcon, FileText, PrinterIcon, Save, TruckIcon } from "lucide-react";
import { ItemOptions } from "@/types/outbound";
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
import { Truck } from "@/types/truck";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import SPKSuratJalanSection from "../shipping/SPKSuratJalanSection";

export default function ManualForm() {
  const router = useRouter();
  // const { order_no } = router.query;
  const { order_no, tab } = router.query;

  const [formData, setFormData] = useState<HeaderSPK>({
    ID: 0,
    order_no: order_no ? order_no.toString() : "Auto Generate",
    order_date: new Date().toISOString().split("T")[0],
  });

  const [muatan, setMuatan] = useState<MuatanOrderSPK[]>([]);
  const [transporter, setTransporter] = useState<Transporter[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [driverPhone, setDriverPhone] = useState<string>(""); // State untuk menyimpan nomor telepon driver
  const [transporterOptions, setTransporterOptions] = useState<ItemOptions[]>([]);

  // ── Order Type Options (diperluas) ──────────────────────────────────────────
  const ordertypeOptions: ItemOptions[] = [
    { value: "TRIP", label: "TRIP" },
    { value: "MULTI DROP", label: "MULTI DROP" },
  ];

  const [truckTypeOptions, setTruckTypeOptions] = useState<ItemOptions[]>([
    { value: "CDD", label: "CDD" },
    { value: "CDE", label: "CDE" },
    { value: "WINGBOX", label: "WINGBOX" },
    { value: "MOTOCYCLE", label: "MOTOCYCLE" },
    { value: "NON-SIZE", label: "NON-SIZE" },
  ]);

  const { can } = usePermission()

  const fetchData = async () => {
    try {
      const [transporters, trucksRes] = await Promise.all([
        api.get("/transporters"),
        api.get("/trucks"),
      ]);

      if (transporters.data.success && trucksRes.data.success) {
        setTransporter(transporters.data.data);
        setTransporterOptions(
          transporters.data.data.map((item: Transporter) => ({
            value: item.transporter_code,
            label: item.transporter_name,
          }))
        );
        setTrucks(trucksRes.data.data);
        setTruckTypeOptions(
          trucksRes.data.data.map((item: Truck) => ({
            value: item.name,
            label: item.name,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };


  const HandlePreviewPDF = (item: MuatanOrderSPK) => {
    window.open(`/wms/outbound/order-spk/spk-sheet/${formData.order_no}`, "_blank");
  };

  const handleSave = async () => {
    if (
      !formData.truck_no ||
      !formData.driver ||
      !formData.load_date ||
      !formData.load_start_time ||
      !formData.load_end_time
    ) {
      eventBus.emit("showAlert", {
        title: "Error!",
        description:
          "Please fill in all required fields: Truck No., Driver, Load Date, Start Load Time, and End Load Time.",
        type: "error",
      });
      return;
    }

    const endpoint =
      formData.ID === 0 ? "/order" : `/order/${formData.order_no}`;

    const method = formData.ID === 0 ? "post" : "put";

    eventBus.emit("loading", true);

    try {
      const res = await api[method](
        endpoint,
        { ...formData, items: muatan },
        { withCredentials: true }
      );

      if (res.data.success) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: res.data.message,
          type: "success",
        });

        // router.push("/wms/outbound/shipping/data");
        router.push("/wms/outbound/order-spk/edit/" + res.data?.data.order_no)
      } else {
        eventBus.emit("showAlert", {
          title: "Error!",
          description: res.data.message || "Failed to save order.",
          type: "error",
        });
      }
    } catch (error: any) {
      console.error("Error saving order:", error);

      eventBus.emit("showAlert", {
        title: "Error!",
        description:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Error saving order.",
        type: "error",
      });
    } finally {
      eventBus.emit("loading", false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (order_no) {
      const fetchOrder = async () => {
        try {
          const res = await api.get(`/order/${order_no}`, { withCredentials: true });
          if (res.data.success) {
            setFormData(res.data.data);
            setMuatan(res.data.data.items.map((item: any) => ({ ...item })));
          }
        } catch (error) {
          console.error("Error fetching order:", error);
        }
      };
      fetchOrder();
    }
  }, [order_no]);

  return (
    <div className="p-4" style={{ fontSize: "12px" }}>

      {/* <Tabs defaultValue="spk" className="w-full"> */}
      <Tabs
        value={tab === "surat-jalan" && formData.ID > 0 ? "surat-jalan" : "spk"}
        onValueChange={(value) => {
          router.replace(
            {
              pathname: router.pathname,
              query: {
                ...router.query,
                tab: value,
              },
            },
            undefined,
            { shallow: true }
          );
        }}
        className="w-full"
      >

        <TabsList className="inline-flex h-auto w-full justify-start gap-2 rounded-xl border border-gray-200 bg-gray-100 p-1.5 mb-5">

          <TabsTrigger
            value="spk"
            className="
              flex items-center gap-2 rounded-lg px-5 py-2.5
              text-sm font-semibold text-gray-500
              transition-all duration-200
              data-[state=active]:bg-white
              data-[state=active]:text-blue-700
              data-[state=active]:shadow-sm
              data-[state=active]:ring-1
              data-[state=active]:ring-gray-200
            "
          >
            <FileText className="h-4 w-4" />
            Manifest
            {/* <span className="rounded-md bg-gray-200 px-2 py-0.5 text-[10px] data-[state=active]:bg-blue-100">
              Header & Muatan
            </span> */}
          </TabsTrigger>

          {formData.ID > 0 && (
            <TabsTrigger
              value="surat-jalan"
              className="
                flex items-center gap-2 rounded-lg px-5 py-2.5
                text-sm font-semibold text-gray-500
                transition-all duration-200
                data-[state=active]:bg-white
                data-[state=active]:text-emerald-700
                data-[state=active]:shadow-sm
                data-[state=active]:ring-1
                data-[state=active]:ring-gray-200
              "
            >
              <TruckIcon className="h-4 w-4" />
              Delivery Notes
              {/* <span className="rounded-md bg-gray-200 px-2 py-0.5 text-[10px]">
                Pengiriman
              </span> */}
            </TabsTrigger>
          )}

        </TabsList>


        <TabsContent value="spk">

          {/* Header Buttons */}
          <div className="flex justify-between items-center mb-4">
            <div className="space-x-1">
              <Button
                variant="outline"
                className="bg-black-500 text-black hover:bg-gray-200 h-8"
                onClick={() => router.push("/wms/outbound/shipping/data")}
              >
                <ArrowBigLeftIcon className="mr-0" />
                Back
              </Button>



              {formData.status !== "loaded" && can("shipment", "create") && (
                <Button
                  variant="outline"
                  className="bg-blue-500 text-white hover:bg-blue-600 h-8"
                  onClick={handleSave}
                >
                  <Save className="mr-2" />
                  Save
                </Button>
              )}

              {formData.ID > 0 && can("shipment", "create") && (
                <Button
                  variant="outline"
                  className="bg-slate-300-500 text-black hover:bg-blue-600 h-8"
                  onClick={()=>{
                    window.open(`/wms/outbound/order-spk/spk-custom-1/${formData.order_no}`, "_blank");
                  }}
                >
                  <PrinterIcon className="mr-2" />
                  Print Manifest
                </Button>
              )}
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}



            <div className="bg-white-200 p-0 space-y-1">

              <div className="flex items-center gap-2">
                <Label className="w-24 text-left shrink-0" style={{ fontSize: "12px" }}>
                  Status
                </Label>
                <span className="shrink-0">:</span>

                <div className="justify-left">
                  <span
                    className={cn(
                      "ml-auto inline-flex shrink-0 items-center rounded-md border px-3 py-1",
                      "text-xs font-semibold uppercase",
                      formData.status === "open" &&
                      "border-emerald-200 bg-emerald-50 text-emerald-700",
                      formData.status === "picking" &&
                      "border-blue-200 bg-blue-50 text-blue-700",
                      formData.status === "packing" &&
                      "border-amber-200 bg-amber-50 text-amber-700",
                      formData.status === "packed" &&
                      "border-amber-200 bg-amber-50 text-amber-800",
                      formData.status === "complete" &&
                      "border-red-200 bg-red-50 text-red-700"
                    )}
                  >
                    {String(formData.status || "Draft")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-24 text-left shrink-0" style={{ fontSize: "12px" }}>
                  Delivery Date
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <DatePicker
                    selected={formData.order_date ? parseISO(formData.order_date) : null}
                    onChange={(date: Date | null) => {
                      if (date)
                        setFormData({ ...formData, order_date: format(date, "yyyy-MM-dd") });
                    }}
                    dateFormat="dd/MM/yyyy"
                    locale={id}
                    customInput={
                      <Input id="OutboundDate" style={{ width: "160px", fontSize: "12px" }} />
                    }
                    placeholderText="Pilih tanggal"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-24 text-left shrink-0" style={{ fontSize: "12px" }}>
                  Transporter
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <Select
                    value={transporterOptions.find(
                      (o) => o.value === formData.transporter_code
                    )}
                    className="w-80"
                    options={transporterOptions}
                    onChange={(opt) => {
                      if (opt) {
                        setFormData({
                          ...formData,
                          transporter_code: opt.value,
                          transporter_name: transporter.find(
                            (t) => t.transporter_code === opt.value
                          )?.transporter_name ?? "",
                        });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-24 text-left shrink-0" style={{ fontSize: "12px" }}>
                  Truck Size
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <Select
                    className="w-80"
                    value={truckTypeOptions.find((o) => o.value === formData.truck_type)}
                    options={truckTypeOptions}
                    onChange={(opt) => {
                      if (opt)
                        setFormData({ ...formData, truck_type: opt.value, truck_size: opt.value });
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-24 text-left shrink-0" style={{ fontSize: "12px" }}>
                  Driver
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <Input
                    autoComplete="off"
                    id="Driver"
                    style={{ fontSize: "12px" }}
                    className="flex-1 w-64"
                    value={formData.driver}
                    onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-24 text-left shrink-0" style={{ fontSize: "12px" }}>
                  Truck No.
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <Input
                    autoComplete="off"
                    id="TruckNo"
                    style={{ fontSize: "12px" }}
                    className="flex-1 w-64"
                    value={formData.truck_no}
                    onChange={(e) => setFormData({ ...formData, truck_no: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="bg-white-200 p-0 space-y-1">

              <div className="flex items-center gap-2">
                <Label className="w-32 text-left shrink-0" style={{ fontSize: "12px" }}>
                  Drver Phone
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <Input
                    autoComplete="off"
                    id="DriverPhone"
                    style={{ fontSize: "12px" }}
                    className="flex-1 w-64"
                    value={formData.driver_phone}
                    onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-32 text-left shrink-0" style={{ fontSize: "12px" }}>
                  Order Type
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  {/* ── Opsi diperluas: TRIP, MULTI DROP, B2B - Consignment, B2B - Normal, B2C - Marketplace ── */}
                  <Select
                    className="w-56"
                    value={ordertypeOptions.find((o) => o.value === formData.order_type)}
                    options={ordertypeOptions}
                    onChange={(opt) => {
                      if (opt) setFormData({ ...formData, order_type: opt.value });
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-32 text-left shrink-0" style={{ fontSize: "12px" }}>
                  Load Date
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex">
                  <DatePicker
                    selected={formData.load_date ? parseISO(formData.load_date) : null}
                    onChange={(date: Date | null) => {
                      if (date)
                        setFormData({ ...formData, load_date: format(date, "yyyy-MM-dd") });
                    }}
                    dateFormat="dd/MM/yyyy"
                    locale={id}
                    customInput={
                      <Input id="PlanPickupDate" style={{ width: "160px", fontSize: "12px" }} />
                    }
                    placeholderText="Choose date"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-32 text-left shrink-0" style={{ fontSize: "12px" }}>
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
                      setFormData({ ...formData, load_start_time: e.target.value })
                    }
                  />
                  <Input
                    id="endTime"
                    type="time"
                    style={{ width: "160px", fontSize: "12px" }}
                    value={formData.load_end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, load_end_time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-32 text-left shrink-0" style={{ fontSize: "12px" }}>
                  Remarks
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex gap-2">
                  <Textarea
                    id="remarks"
                    style={{ width: "325px", fontSize: "12px", height: "40px" }}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hidden fields */}
          <form className="space-y-4">
            <div className="hidden">
              <Input
                id="OutboundID"
                value={formData.ID}
                onChange={(e) => setFormData({ ...formData, ID: Number(e.target.value) })}
              />
            </div>
          </form>

          <hr className="my-6" />
          <ItemFormTable
            muatan={muatan}
            setMuatan={setMuatan}
            headerForm={formData}
            setHeaderForm={setFormData}
          />

        </TabsContent>
        {formData.ID > 0 && (
          <TabsContent value="surat-jalan">
            <SPKSuratJalanSection
              orderNo={formData.order_no}
            />
          </TabsContent>
        )}

      </Tabs>
    </div>
  );
}
