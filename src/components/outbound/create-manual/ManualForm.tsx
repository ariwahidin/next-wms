/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ItemFormTable from "./ItemFormTable";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { HeaderFormProps, ItemFormProps, ItemOptions } from "@/types/outbound";
import { Customer } from "@/types/customer";
import api from "@/lib/api";
import Select from "react-select";
import eventBus from "@/utils/eventBus";
import { useRouter } from "next/router";
import { Item } from "@radix-ui/react-dropdown-menu";
import ItemScannedTable from "./ItemScannedTable";

export default function ManualForm() {
  const router = useRouter();
  const { no } = router.query;
  console.log("outbound_no", no);

  const [formData, setFormData] = useState<HeaderFormProps>({
    ID: 0,
    outbound_no: no ? no.toString() : "Auto Generate",
    outbound_date: new Date().toISOString().split("T")[0],
    customer: "",
    delivery_no: "",
    mode: "create",
  });

  const [muatan, setMuatan] = useState<ItemFormProps[]>([]);
  const [customer, setCustomer] = useState<Customer[]>([]);
  const [customerOptions, setCustomerOptions] = useState<ItemOptions[]>([]);

  const fetchData = async () => {
    try {
      const [suppliers] = await Promise.all([
        api.get("/customers", { withCredentials: true }),
      ]);

      if (suppliers.data.success) {
        setCustomer(suppliers.data.data);
        setCustomerOptions(
          suppliers.data.data.map((item: Customer) => ({
            value: item.customer_code,
            label: item.customer_code,
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
          router.push("/outbound/list");
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
          router.push("/outbound/list");
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
            setMuatan(res.data.data.items);
          }
        } catch (error) {
          console.error("Error fetching outbound:", error);
        }
      };
      fetchOutbound();
    }
  }, [no]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Create Outbound</h2>
        {formData.status !== "complete" && (
          <div className="space-x-2">
            <Button
              variant="outline"
              className="bg-blue-500 text-white hover:bg-blue-600"
              onClick={handleSave}
            >
              <Save className="mr-2" />
              Save
            </Button>
          </div>
        )}
      </div>
      <hr className="my-4" />
      <form className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div style={{ display: "none" }}>
            <Label htmlFor="OutboundID">Outbound ID</Label>
            <Input
              id="OutboundID"
              value={formData.ID}
              onChange={(e) =>
                setFormData({ ...formData, ID: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label htmlFor="OutboundNo">Outbound No</Label>
            <Input
              readOnly
              id="OutboundNo"
              value={formData.outbound_no}
              onChange={(e) =>
                setFormData({ ...formData, outbound_no: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="OutboundDate">Outbound Date</Label>
            <Input
              type="date"
              id="OutboundDate"
              value={formData.outbound_date}
              onChange={(e) =>
                setFormData({ ...formData, outbound_date: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="DeliveryNo">DO Number</Label>
            <Input
              id="DeliveryNo"
              value={formData.delivery_no}
              onChange={(e) =>
                setFormData({ ...formData, delivery_no: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="Customer">Customer</Label>
            <Select
              value={customerOptions.find(
                (option) => option.value === formData.customer
              )}
              options={customerOptions}
              onChange={(selectedOption) => {
                if (selectedOption) {
                  setFormData({
                    ...formData,
                    customer: selectedOption.value,
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
      <ItemScannedTable itemsReceived={[]} />
    </div>
  );
}
