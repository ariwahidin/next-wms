"use client";

import { useState } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

const dummyItems = [
  { barcode: "MUT123", name: "Monitor LG", currentDept: "IT", status: "Ready" },
  { barcode: "MUT456", name: "Keyboard Logitech", currentDept: "Warehouse", status: "In Repair" },
];

export default function ItemMutationPage() {
  const [barcode, setBarcode] = useState("");
  const [itemDetail, setItemDetail] = useState<any>(null);
  const [targetDept, setTargetDept] = useState("");
  const [targetStatus, setTargetStatus] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setBarcode(code);
    const found = dummyItems.find((item) => item.barcode === code);
    setItemDetail(found || null);
    setMessage("");
  };

  const handleMutate = () => {
    if (!itemDetail || !targetDept || !targetStatus) {
      setMessage("Please complete all fields.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setMessage(`Item "${itemDetail.name}" successfully mutated to "${targetDept}" (${targetStatus}).`);
      // reset
      setBarcode("");
      setItemDetail(null);
      setTargetDept("");
      setTargetStatus("");
    }, 1000);
  };

  return (
    <>
      <PageHeader title="Item Mutation" showBackButton />
      <div className="px-4 py-4 min-h-screen bg-gray-50 space-y-4">
        <p className="text-gray-600">Mutate item ownership or status within organization.</p>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Scan / Enter Barcode</label>
          <Input value={barcode} onChange={handleScan} placeholder="Enter item barcode" />
        </div>

        {itemDetail && (
          <Card className="p-4">
            <p><strong>Name:</strong> {itemDetail.name}</p>
            <p><strong>Current Dept:</strong> {itemDetail.currentDept}</p>
            <p><strong>Status:</strong> {itemDetail.status}</p>
          </Card>
        )}

        {itemDetail && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">New Department</label>
              <Select value={targetDept} onValueChange={setTargetDept}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Warehouse">Warehouse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">New Status</label>
              <Select value={targetStatus} onValueChange={setTargetStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ready">Ready</SelectItem>
                  <SelectItem value="In Repair">In Repair</SelectItem>
                  <SelectItem value="Loaned">Loaned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full mt-4" onClick={handleMutate} disabled={isLoading}>
              {isLoading ? "Processing..." : "Mutate Now"}
            </Button>
          </>
        )}

        {message && (
          <div className="bg-blue-100 text-blue-700 mt-4 p-3 rounded-md">
            {message}
          </div>
        )}
      </div>
    </>
  );
}
