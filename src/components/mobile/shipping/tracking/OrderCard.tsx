/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import guestApi from "@/lib/guestApi";
import eventBus from "@/utils/eventBus";
import { Dialog } from "@radix-ui/react-dialog";
import { useState } from "react";

interface OrderItem {
  ID: number;
  order_no: string;
  transporter: string;
  status: "fully received" | "partial" | "open";
}

export default function OutboundCard({ data }: { data: OrderItem }) {
  const { ID, order_no, transporter, status } = data;

  const [openModal, setOpenModal] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [selectedOrderNo, setSelectedOrderNo] = useState("");

  //   const handleConsoleClick = (order_no: string) => {
  //   };

  const handleConsoleClick = (order_no: string) => {
    setSelectedOrderNo(order_no);
    setOpenModal(true);
  };

  const handleSubmitTracking = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await guestApi.put(`/shipping/update/${order_no}`, {
            order_no: selectedOrderNo,
            driver_name: driverName,
            remarks: remarks,
            latitude: latitude,
            longitude: longitude,
          });

          const data = await response.data;
          console.log("Response data:", data);
          if (data.success === true) {
            eventBus.emit("showAlert", {
              title: "Success",
              description: data.message,
              type: "success",
            });
            setOpenModal(false);
            setDriverName("");
            setRemarks("");
          }
        } catch (error) {
          console.error("Error sending data:", error);
          alert("Failed to send tracking");
        }
      },
      (error) => {
        console.error("Location error:", error);
        alert("Please allow location access");
      }
    );
  };

  const handleFinishClick = (order_no: string) => {};

  return (
    <>
      <Card className="p-3 relative">
        <CardContent className="p-0 space-y-1">
          <div className="text-sm font-semibold">
            {order_no}
            <span className="ml-2 text-xs text-gray-500 rounded px-2 py-1 w-max mt-1 bg-green-100">
              {status}
            </span>
          </div>
          <div className="text-sm text-gray-500">{transporter}</div>

          <div className="mt-3 flex gap-2">
            <Button
              className="w-full"
              onClick={() => handleConsoleClick(order_no)}
            >
              Console
            </Button>
            <Button
              className="w-full"
              onClick={() => handleFinishClick(order_no)}
            >
              Finish
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[425px] bg-white p-4">
          <DialogHeader>
            <DialogTitle>Tracking Info</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Driver Name"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
            <Textarea
              placeholder="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

            <Button className="w-full" onClick={handleSubmitTracking}>
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
