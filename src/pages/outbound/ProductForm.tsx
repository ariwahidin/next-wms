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
import { set } from "react-hook-form";

export function ProductForm({
  formHeader,
  setFormHeader,
  formItem,
  setFormItem,
}) {
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState([]);
  const [itemsSelectOption, setItemsSelectOption] = useState([]);
  const [loading, setLoading] = useState(true);

  // Whs Code
  const [whsCode, setWhsCode] = useState([
    { value: "CKY", label: "CKY" },
    { value: "CDY", label: "CDY" },
    { value: "NGY", label: "NGY" },
    { value: "PROMO", label: "PROMO" },
    { value: "SAMPLE", label: "SAMPLE" },
  ]);

  const handleWhsCodeChange = (selectedOption) => {
    setFormItem({ ...formItem, whs_code: selectedOption.value });
  };

  // Remarks Inbound
  const [handlingOption, setHandlingOption] = useState([]);
  const handleHandlingChange = (selectedOption) => {
    setFormItem({ ...formItem, handling_id: selectedOption.value });
  };

  const handleSelectChange = (selectedOption) => {
    const itemSelected = items.find(
      (item) => item.item_code === selectedOption.value
    );

    setFormItem({
      ...formItem,
      item_code: selectedOption.value,
      item_name: itemSelected.item_name,
      barcode: itemSelected.gmc,
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [products, handling] = await Promise.all([
          api.get("/products", { withCredentials: true }),
          api.get("/handling", { withCredentials: true }),
        ]);

        if (products.data.success && handling.data.success) {
          setItemsSelectOption(
            products.data.data.map((item) => ({
              value: item.item_code,
              label: item.item_code + " - " + item.item_name,
            }))
          );

          setItems(products.data.data);
          const options = handling.data.data.map((item) => ({
            value: item.id,
            label: item.name,
          }));
          setHandlingOption(options);

          if (
            formItem.handling_id === 0 &&
            formItem.whs_code === "" &&
            formItem.uom === ""
          ) {
            setFormItem({
              ...formItem,
              handling_id: handling.data.data[0].id,
              whs_code: whsCode[0].value,
              uom: "PCS",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        // setTimeout(() => {
        // }, 500);
      }
    };

    fetchData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError(null);

      const dataPost = {
        form_header: formHeader,
        form_items: formItem,
      };

      console.log("Data Post : ", dataPost);

      const urlAdd = `/outbound/item`;
      const res = await api.post(urlAdd, dataPost, { withCredentials: true });
      if (res.data.success) {
        setFormHeader({
          ...formHeader,
          outbound_id: res.data.data.header.ID,
        });

        setFormItem({
          ...formItem,
          outbound_id: res.data.data.header.ID,
          outbound_detail_id: 0,
        });
        mutate("/outbound/" + res.data.data.header.ID);
      }

      document.getElementById("itemCode")?.focus();
    } catch (err: any) {
      if (err.response) {
        if (err.response.status === 400) {
          setError("Data yang dimasukkan tidak valid.");
        } else {
          setError("Terjadi kesalahan, coba lagi nanti.");
        }
      } else {
        setError("Tidak ada respon dari server.");
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e); // Submit form saat Enter
    }
  };

  const handleCancel = () => {
    setFormItem({
      ...formItem,
      outbound_detail_id: 0,
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Product Form</CardTitle>
        {/* <CardDescription>
          {editData ? "Edit Product" : "Add Product"}
        </CardDescription> */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="item_code">Item Code</Label>
              <Select
                id="itemCode"
                options={itemsSelectOption}
                onChange={handleSelectChange}
                value={itemsSelectOption.find(
                  (item) => item.value === formItem.item_code
                )}
                placeholder="Select an option"
              />
              <span className="text-xs text-muted-foreground">
                Item Name : {formItem.item_name}
              </span>
              <span className="text-xs text-muted-foreground">
                GMC : {formItem.barcode}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  id="quantity"
                  onChange={(e) => {
                    setFormItem({
                      ...formItem,
                      quantity: parseInt(e.target.value),
                    });
                  }}
                  value={formItem.quantity}
                  placeholder=""
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label>UoM</Label>
                <Input
                  type="text"
                  id="uom"
                  onChange={(e) => {
                    setFormItem({
                      ...formItem,
                      uom: e.target.value,
                    });
                  }}
                  value={formItem.uom}
                  placeholder=""
                  readOnly
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label>Whs Code</Label>
                <Select
                  id="whsCode"
                  options={whsCode}
                  value={whsCode.find(
                    (item) => item.value === formItem.whs_code
                  )}
                  onChange={handleWhsCodeChange}
                  placeholder="Select an option"
                />
              </div>
            </div>
            <div className="grid grid-cols-1">
              <div className="flex flex-col space-y-1.5">
                <Label>Handling</Label>
                <Select
                  id="handling"
                  defaultValue={handlingOption ? handlingOption[0] : ""}
                  options={handlingOption}
                  onChange={handleHandlingChange}
                  value={handlingOption.find(
                    (item) => item.value === formItem.handling_id
                  )}
                  placeholder="Select an option"
                />
              </div>
            </div>
            <div className="grid grid-cols-1">
              <div className="flex flex-col space-y-1.5">
                <Label>Remarks</Label>
                <Input
                  type="text"
                  id="remarks"
                  onChange={(e) => {
                    setFormItem({ ...formItem, remarks: e.target.value });
                  }}
                  value={formItem.remarks}
                  placeholder=""
                />
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} type="submit">
          {" "}
          {/* Tombol submit */}
          {formItem.outbound_detail_id > 0 ? "Update" : "Add"}
        </Button>
      </CardFooter>
    </Card>
  );
}
