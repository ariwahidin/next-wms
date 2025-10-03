"use client";

import { useState } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import eventBus from "@/utils/eventBus";

export default function AddLocationPage() {
  const [newLocation, setNewLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newLocation.trim()) return;

    const dataToPost = {
      new_location: newLocation,
    };

    try {
      setLoading(true);
      const response = await api.post(
        "/mobile/inventory/add-location/",
        dataToPost,
        {
          withCredentials: true,
        }
      );
      const data = await response.data;
      if (data.success) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: data.message,
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error saving data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Add New Location" showBackButton />
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pb-24 max-w-md mx-auto">
        <form onSubmit={handleSave}>
          <Input
            placeholder="Entry new location"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            className="mb-2"
          />
          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            {loading ? "Saving..." : "Save Location"}
          </Button>
        </form>
      </div>
    </>
  );
}
