/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { mutate } from "swr";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Select from "react-select";
import { ItemOptions } from "@/types/inbound";
import { Category } from "@/types/category";

interface ProductFormProps {
  editData: any;
  setEditData: (data: any) => void;
  onClose: () => void;
}

export default function ProductForm({
  editData,
  setEditData,
  onClose,
}: ProductFormProps) {
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [gmc, setGmc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Options dan selections
  const [handlingOptions, setHandlingOptions] = useState<ItemOptions[]>([]);
  const [selectedHandlings, setSelectedHandlings] = useState<ItemOptions[]>([]);
  const [itemOptions, setItemOptions] = useState<ItemOptions[]>([]);


  const fetchItems = async () => {
    try {
      const response = await api.get("/products", { withCredentials: true });
      if (response.data.success) {
        const options = response.data.data.map((item: any) => ({
          value: item.item_code,
          label: item.item_code,
        }));
        setItemOptions(options);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  // Fetch Handling data
  const fetchHandlings = async () => {
    try {
      const response = await api.get("/handling", { withCredentials: true });
      console.log("Handling Response:", response.data); // Debug log

      let handlingData = [];

      // Handle different possible response structures
      if (response.data.success && response.data.data) {
        handlingData = response.data.data;
      } else if (Array.isArray(response.data)) {
        handlingData = response.data;
      } else if (response.data && Array.isArray(response.data.handlings)) {
        handlingData = response.data.handlings;
      }

      console.log("Handling Data:", handlingData); // Debug log

      const options = handlingData.map((handling: any) => ({
        value: handling.name,
        label: handling.name,
      }));

      console.log("Handling Options:", options); // Debug log
      setHandlingOptions(options);
    } catch (error) {
      console.error("Error fetching handlings:", error);
      // Set some dummy data for testing if API fails
      setHandlingOptions([
        { value: "NORMAL", label: "Normal Handling" },
        { value: "FRAGILE", label: "Fragile Handling" },
        { value: "HAZMAT", label: "Hazmat Handling" },
      ]);
    }
  };


  // Load initial data
  useEffect(() => {
    fetchHandlings();
    fetchItems();
  }, []);

  // Populate form when editing
  useEffect(() => {
  if (editData) {
    setItemCode(editData.item_code || "");

    // Ambil semua handling dari details
    const selected = handlingOptions.filter(option =>
      editData.details?.some(detail => detail.Handling === option.value)
    );

    console.log("Selected Handlings:", selected); // Debug log

    setSelectedHandlings(selected);
  }
}, [editData, handlingOptions]);




  const validateForm = () => {
    if (!itemCode.trim()) {
      setError("Item Code is required");
      document.getElementById("itemCode")?.focus();
      return false;
    }

    if (selectedHandlings.length === 0) {
      setError("At least one handling is required");
      return false;
    }


    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        item_code: itemCode.trim(),
        handlings: selectedHandlings.map((h) => h.value), // Array of handling codes
      };

      console.log("Payload:", payload);

      // return;

      // await api.post("/handling/items", payload, { withCredentials: true });

      if (editData) {
        await api.put(`/handling/items/${editData.ID}`, payload, {
          withCredentials: true,
        });
      } else {
        await api.post("/handling/items", payload, { withCredentials: true });
      }

      mutate("/handling/items");
      handleCancel(); // Reset form and close modal
    } catch (err: any) {
      console.error("Submit error:", err);

      if (err.response) {
        if (err.response.status === 400) {
          setError(err.response.data?.message || "Invalid data provided");
        } else if (err.response.status === 409) {
          setError("Product with this code already exists");
        } else {
          setError("An error occurred, please try again");
        }
      } else {
        setError("No response from server");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit(e as any);
    }
  };

  const handleCancel = () => {
    setError(null);
    setEditData(null);
    setItemCode("");
    setSelectedHandlings([]);
    onClose();
  };

  return (
    <Card>
      {/* <CardHeader style={{ paddingBottom: "0" }}>
        <CardTitle>{editData ? "Edit Product" : "Add Product"}</CardTitle>
      </CardHeader> */}
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <div className="grid w-full items-center gap-4">
            <div className="flex items-center gap-4">
              <Label className="w-24 text-left shrink-0" htmlFor="itemCode">
                Item Code
              </Label>
              <span className="shrink-0">:</span>

              <Select
                id="itemCode"
                styles={{
                  container: (provided) => ({
                    ...provided,
                    width: "100%",
                  }),
                }}
                options={itemOptions}
                value={itemOptions.find((option) => option.value === itemCode)}
                onChange={(selectedOption) =>
                  setItemCode(selectedOption?.value || "")
                }
                placeholder="Select Item Code"
                isDisabled={isLoading}
              />
            </div>

            <div className="flex items-center gap-4">
              <Label className="w-24 text-left shrink-0">Handling</Label>
              <span className="shrink-0">:</span>
              <div className="flex-1">
                {/* Debug info */}
                {process.env.NODE_ENV === "development" && (
                  <div className="text-xs text-gray-500 mb-1">
                    Options: {handlingOptions.length}, Selected:{" "}
                    {selectedHandlings.length}
                  </div>
                )}

                <Select
                  isMulti
                  options={handlingOptions}
                  value={selectedHandlings}
                  onChange={(newValue) => {
                    console.log("Handling onChange:", newValue); // Debug log
                    setSelectedHandlings(newValue ? [...newValue] : []);
                  }}
                  placeholder={
                    handlingOptions.length === 0
                      ? "Loading..."
                      : "Select handling methods"
                  }
                  isDisabled={isLoading || handlingOptions.length === 0}
                  closeMenuOnSelect={false}
                  isSearchable={true}
                  isClearable={false}
                  noOptionsMessage={() =>
                    handlingOptions.length === 0
                      ? "Loading options..."
                      : "No options available"
                  }
                />
              </div>
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} type="submit" disabled={isLoading}>
          {isLoading ? "Processing..." : editData ? "Update" : "Add"}
        </Button>
      </CardFooter>
    </Card>
  );
}
