"use client";

import { useState } from "react";
import PageHeader from "@/components/mobile/PageHeader"; 
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

const dummySerials = [
  { serial: "ABC123", name: "Laptop A", location: "Warehouse A" },
  { serial: "XYZ456", name: "Smartphone B", location: "Warehouse B" },
  { serial: "DEF789", name: "Tablet C", location: "Warehouse A" },
];

export default function TransferBySerialPage() {
  const [serialNumber, setSerialNumber] = useState<string>("");
  const [destinationLocation, setDestinationLocation] = useState<string>("");
  const [transferResult, setTransferResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serialDetails, setSerialDetails] = useState<any | null>(null);

  const handleScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSerialNumber(e.target.value);
    const foundItem = dummySerials.find((item) => item.serial === e.target.value);
    if (foundItem) {
      setSerialDetails(foundItem);
    } else {
      setSerialDetails(null);
    }
  };

  const handleTransfer = () => {
    if (!serialNumber || !destinationLocation) {
      setTransferResult("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setTransferResult(`Transfer of ${serialDetails?.name} successful to ${destinationLocation}.`);
    }, 1000);
  };

  return (
    <>
      <PageHeader title="Transfer by Serial" showBackButton />
      <div className="px-6 pt-6 pb-16 min-h-screen bg-gray-50">
        <p className="text-gray-700 text-lg mb-6">Transfer items based on serial number to another location.</p>

        <div className="space-y-4">
          {/* Serial Number Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Serial Number</label>
            <Input
              type="text"
              placeholder="Enter Serial Number"
              value={serialNumber}
              onChange={handleScan}
              className="w-full mt-2 p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Serial Details */}
          {serialDetails && (
            <div className="p-4 bg-gray-100 rounded-lg shadow-md">
              <p className="text-gray-800"><strong>Item Name:</strong> {serialDetails.name}</p>
              <p className="text-gray-800"><strong>Current Location:</strong> {serialDetails.location}</p>
            </div>
          )}

          {/* Destination Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Destination Location</label>
            <Select
              value={destinationLocation}
              onValueChange={setDestinationLocation}
            >
              <SelectTrigger className="w-full mt-2 p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Warehouse A">Warehouse A</SelectItem>
                <SelectItem value="Warehouse B">Warehouse B</SelectItem>
                <SelectItem value="Storefront">Storefront</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transfer Button */}
          <Button
            variant="outline"
            onClick={handleTransfer}
            className="w-full py-3 mt-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Transfer"}
          </Button>

          {/* Result Message */}
          {transferResult && (
            <div className={`mt-4 p-4 text-white ${transferResult.includes("successful") ? "bg-green-500" : "bg-red-500"} rounded-lg`}>
              {transferResult}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
