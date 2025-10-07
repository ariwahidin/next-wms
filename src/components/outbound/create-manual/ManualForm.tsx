/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

export default function ManualForm() {
  const router = useRouter();
  const { no } = router.query;
  const path = router.pathname; // "/wms/outbound/copy/[no]" atau "/wms/outbound/edit/[no]" atau "/wms/outbound/add"

  let mode: "add" | "edit" | "copy" = "add";

  if (path.includes("/copy/")) {
    mode = "copy";
  } else if (path.includes("/edit/")) {
    mode = "edit";
  } else if (path.includes("/add")) {
    mode = "add";
  }
  console.log("outbound_no", no);

  const [formData, setFormData] = useState<HeaderFormProps>({
    ID: 0,
    outbound_no: no ? no.toString() : "Auto Generate",
    outbound_date: new Date().toISOString().split("T")[0],
    customer_code: "",
    shipment_id: "",
    whs_code: "CKY",
    owner_code: "YMID",
    mode: "create",
    picker_name: "",
    cust_address: "",
    cust_city: "",
    plan_pickup_date: "",
    plan_pickup_time: "",
    rcv_do_date: "",
    rcv_do_time: "",
    start_pick_time: "",
    end_pick_time: "",
    deliv_to: "",
    deliv_address: "",
    deliv_city: "",
    driver: "",
    qty_koli: 0,
    qty_koli_seal: 0,
    truck_size: "",
    truck_no: "",
    transporter_code: "L5W",
  });

  const [muatan, setMuatan] = useState<ItemFormProps[]>([]);
  const [customer, setCustomer] = useState<Customer[]>([]);
  const [transporter, setTransporter] = useState<Transporter[]>([]);
  const [transporterOptions, setTransporterOptions] = useState<ItemOptions[]>(
    []
  );
  const [customerOptions, setCustomerOptions] = useState<ItemOptions[]>([]);
  const [whsOptions, setWhsOptions] = useState<ItemOptions[]>([]);
  const [ownerOptions, setOwnerOptions] = useState<ItemOptions[]>([]);

  const fetchData = async () => {
    try {
      const [customers, warehouses, owners, transporters] = await Promise.all([
        api.get("/customers"),
        api.get("/warehouses"),
        api.get("/owners"),
        api.get("/transporters"),
      ]);

      if (
        customers.data.success &&
        warehouses.data.success &&
        owners.data.success &&
        transporters.data.success
      ) {
        setCustomer(customers.data.data);
        setCustomerOptions(
          customers.data.data.map((item: Customer) => ({
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
    console.log("Data outbound yang akan disimpan:", formData, muatan);

    if (
      formData.plan_pickup_date == "" ||
      formData.plan_pickup_time == "" ||
      formData.rcv_do_date == "" ||
      formData.rcv_do_time == "" ||
      formData.start_pick_time == "" ||
      formData.end_pick_time == ""
    ) {
      eventBus.emit("showAlert", {
        title: "Error!",
        description: "Please fill all required fields",
        type: "error",
      });
      return;
    }

    // return;
    if (formData.ID === 0) {
      eventBus.emit("loading", true);
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
        eventBus.emit("loading", false);
        if (res.data.success) {
          eventBus.emit("showAlert", {
            title: "Success!",
            description: res.data.message,
            type: "success",
          });
          router.push("/wms/outbound/data");
        }
      } catch (error) {
        eventBus.emit("loading", false);
        console.error("Error saving outbound:", error);
        // alert("Error saving outbound");
      }
    } else {
      try {
        eventBus.emit("loading", true);
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
        eventBus.emit("loading", false);
        if (res.data.success) {
          eventBus.emit("showAlert", {
            title: "Success!",
            description: res.data.message,
            type: "success",
          });
          router.push("/wms/outbound/data");
        }
      } catch (error) {
        eventBus.emit("loading", false);
        console.error("Error updating outbound:", error);
        // alert("Error updating outbound");
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (no && (mode === "edit" || mode === "copy")) {
      const fetchOutbound = async () => {
        try {
          const res = await api.get(`/outbound/${no}`, {
            withCredentials: true,
          });
          if (res.data.success) {
            let data = res.data.data;

            if (mode === "copy") {
              // reset ID biar dianggap data baru
              data = {
                ...data,
                ID: 0,
                outbound_no: "",
                status: "create",
                shipment_id: "",
              };
            }

            setFormData(data);
            setMuatan(
              data.items.map((item) => ({
                ...item,
                item_id: String(item.item_id),
                item_name: item.product?.item_name || "",
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching outbound:", error);
        }
      };
      fetchOutbound();
    }
  }, [no, mode]);

  return (
    <div className="p-4" style={{ fontSize: "12px" }}>
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-1">
          <Button
            variant="outline"
            className="bg-black-500 text-black hover:bg-gray-200"
            onClick={() => {
              router.push("/wms/outbound/data");
            }}
          >
            <ArrowBigLeftIcon className="mr-0" />
            Back
          </Button>
          <Button
            variant="outline"
            className="bg-blue-500 text-white hover:bg-blue-600"
            onClick={handleSave}
          >
            <Save className="mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Column 1 */}
        <div className="bg-white-200 p-0 space-y-1">
          <div className="grid grid-cols-2 gap-4">
            {/* Column 1 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Picking Date
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <DatePicker
                    disabled={formData.status === "complete" ? true : false}
                    selected={
                      formData.outbound_date
                        ? parseISO(formData.outbound_date)
                        : null
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
                  DO No <span className="text-red-500">*</span>
                </Label>
                <span className="shrink-0">:</span>
                <Input
                  disabled={formData.status === "complete" ? true : false}
                  id="ShipmentID"
                  style={{ fontSize: "12px" }}
                  className="flex-1"
                  value={formData.shipment_id}
                  autoComplete="off"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shipment_id: e.target.value,
                    })
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
                    isDisabled={
                      formData.status == "picking" ||
                      formData.status == "complete"
                        ? true
                        : false
                    }
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
              </div>

              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  WhsCode
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <Select
                    isDisabled={
                      formData.status == "picking" ||
                      formData.status == "complete"
                        ? true
                        : false
                    }
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

              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Picker Name
                </Label>
                <span className="shrink-0">:</span>
                <Input
                  id="PickerName"
                  style={{ fontSize: "12px" }}
                  className="flex-1"
                  value={formData.picker_name}
                  autoComplete="off"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      picker_name: e.target.value,
                    })
                  }
                />
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
                    options={transporterOptions}
                    onChange={(selectedOption) => {
                      if (selectedOption) {
                        setFormData({
                          ...formData,
                          transporter_code: selectedOption.value,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-1 ps-8">
              <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Plan Pickup Date / Time<span className="text-red-500">*</span>
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <DatePicker
                    selected={
                      formData.plan_pickup_date
                        ? parseISO(formData.plan_pickup_date)
                        : null
                    }
                    onChange={(date: Date | null) => {
                      if (date) {
                        setFormData({
                          ...formData,
                          plan_pickup_date: format(date, "yyyy-MM-dd"), // simpan format ISO
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
                  <Input
                    id="PlanPickupTime"
                    type="time"
                    style={{ width: "160px", fontSize: "12px" }}
                    value={formData.plan_pickup_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plan_pickup_time: e.target.value,
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
                  Receiving DO Date / Time<span className="text-red-500">*</span>
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <DatePicker
                    selected={
                      formData.rcv_do_date
                        ? parseISO(formData.rcv_do_date)
                        : null
                    }
                    onChange={(date: Date | null) => {
                      if (date) {
                        setFormData({
                          ...formData,
                          rcv_do_date: format(date, "yyyy-MM-dd"), // simpan format ISO
                        });
                      }
                    }}
                    dateFormat="dd/MM/yyyy" // TAMPILAN Indonesia
                    locale={id} // Bahasa Indonesia
                    customInput={
                      <Input
                        id="RcvDODate"
                        style={{ width: "160px", fontSize: "12px" }}
                      />
                    }
                    placeholderText="Choose date"
                  />
                  <Input
                    id="RcvDOTime"
                    type="time"
                    style={{ width: "160px", fontSize: "12px" }}
                    value={formData.rcv_do_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rcv_do_time: e.target.value,
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
                  Start/Finish Picking Time<span className="text-red-500">*</span>
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <Input
                    id="startTime"
                    type="time"
                    style={{ width: "160px", fontSize: "12px" }}
                    value={formData.start_pick_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        start_pick_time: e.target.value,
                      })
                    }
                  />
                  <Input
                    id="endTime"
                    type="time"
                    style={{ width: "160px", fontSize: "12px" }}
                    value={formData.end_pick_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        end_pick_time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white-200 p-0 space-y-1">
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-2 w-1/2">
              <Label
                className="w-24 text-left shrink-0"
                style={{ fontSize: "12px" }}
              >
                Customer
              </Label>
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
                        cust_address: customer.find(
                          (option) =>
                            option.customer_code === selectedOption.value
                        ).cust_addr1,
                        cust_city: customer.find(
                          (option) =>
                            option.customer_code === selectedOption.value
                        ).cust_city,
                      });
                    }
                  }}
                  formatOptionLabel={(option, { context }) => {
                    const cust = customer.find(
                      (c) => c.customer_code === option.value
                    );

                    if (context === "menu") {
                      // tampil di dropdown
                      return (
                        <div>
                          <div>{option.label}</div>
                          <div className="text-xs text-gray-500">
                            {cust?.cust_addr1}, {cust?.cust_city}
                          </div>
                        </div>
                      );
                    }

                    // tampil setelah kepilih (hanya label utama)
                    return <div>{option.label}</div>;
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-2">
              <Label
                className="w-24 text-left shrink-0"
                style={{ fontSize: "12px" }}
              >
                Cust. Address
              </Label>
              <span className="shrink-0">:</span>
              <textarea
                style={{ fontSize: "12px", width: "350px" }}
                id="CustomerAddress"
                readOnly
                className="flex-1 resize-none border border-input bg-background rounded-md px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                rows={2}
                value={formData.cust_address}
                onChange={(e) =>
                  setFormData({ ...formData, cust_address: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-2">
              <Label
                className="w-24 text-left shrink-0"
                style={{ fontSize: "12px" }}
              >
                Cust. City
              </Label>
              <span className="shrink-0">:</span>
              <Input
                readOnly
                id="CustomerCity"
                style={{ fontSize: "12px" }}
                className="flex-1"
                value={formData.cust_city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cust_city: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="flex items-center gap-2 w-1/2">
              <Label
                className="w-24 text-left shrink-0"
                style={{ fontSize: "12px" }}
              >
                Delivery To.
              </Label>
              <span className="shrink-0">:</span>
              <div className="flex-1">
                <Select
                  className="min-w-[185px]"
                  value={customerOptions.find(
                    (option) => option.value === formData.deliv_to
                  )}
                  options={customerOptions}
                  onChange={(selectedOption) => {
                    if (selectedOption) {
                      setFormData({
                        ...formData,
                        deliv_to: selectedOption.value,
                        deliv_address: customer.find(
                          (option) =>
                            option.customer_code === selectedOption.value
                        ).cust_addr1,
                        deliv_city: customer.find(
                          (option) =>
                            option.customer_code === selectedOption.value
                        ).cust_city,
                      });
                    }
                  }}
                  formatOptionLabel={(option, { context }) => {
                    const cust = customer.find(
                      (c) => c.customer_code === option.value
                    );

                    if (context === "menu") {
                      // tampil di dropdown
                      return (
                        <div>
                          <div>{option.label}</div>
                          <div className="text-xs text-gray-500">
                            {cust?.cust_addr1}, {cust?.cust_city}
                          </div>
                        </div>
                      );
                    }

                    // tampil setelah kepilih (hanya label utama)
                    return <div>{option.label}</div>;
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-2">
              <Label
                className="w-24 text-left shrink-0"
                style={{ fontSize: "12px" }}
              >
                Deliv. Address
              </Label>
              <span className="shrink-0">:</span>
              <textarea
                style={{ fontSize: "12px", width: "350px" }}
                id="CustomerAddress"
                readOnly
                className="flex-1 resize-none border border-input bg-background rounded-md px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                rows={2}
                value={formData.deliv_address}
                onChange={(e) =>
                  setFormData({ ...formData, deliv_address: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-2">
              <Label
                className="w-24 text-left shrink-0"
                style={{ fontSize: "12px" }}
              >
                Deliv. City
              </Label>
              <span className="shrink-0">:</span>
              <Input
                readOnly
                id="CustomerCity"
                style={{ fontSize: "12px" }}
                className="flex-1"
                value={formData.deliv_city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deliv_city: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Column 1 */}
            <div className="space-y-1">
              {/* <div className="flex items-center gap-2">
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
                    className="flex-1"
                    value={formData.driver}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        driver: e.target.value,
                      })
                    }
                  />
                </div>
              </div> */}

              {/* <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Qty Koli
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <Input
                    type="number"
                    id="Koli"
                    style={{ fontSize: "12px" }}
                    className="flex-1 w-42"
                    value={formData.qty_koli}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        qty_koli: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div> */}
              {/* <div className="flex items-center gap-2">
                <Label
                  className="w-24 text-left shrink-0"
                  style={{ fontSize: "12px" }}
                >
                  Qty Koli Seal
                </Label>
                <span className="shrink-0">:</span>
                <div className="flex-1">
                  <Input
                    type="number"
                    id="KoliSeal"
                    style={{ fontSize: "12px" }}
                    className="flex-1"
                    value={formData.qty_koli_seal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        qty_koli_seal: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div> */}
            </div>

            {/* Column 2 */}
            {/* <div className="space-y-1">
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
                    className="flex-1"
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
                <Input
                  id="TruckNo"
                  style={{ fontSize: "12px" }}
                  className="flex-1"
                  value={formData.truck_no}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      truck_no: e.target.value,
                    })
                  }
                />
              </div>
            </div> */}
          </div>

          <div className="flex items-start gap-2">
            <div className="flex items-start gap-2">
              <Label
                className="w-24 text-left shrink-0 pt-2"
                style={{ fontSize: "12px" }}
                htmlFor="RemarksHeader"
              >
                Remarks
              </Label>
              <span className="shrink-0 pt-2">:</span>
              <textarea
                style={{ fontSize: "12px", width: "350px" }}
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
