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
import { FormDescription } from "@/components/ui/form";
import eventBus from "@/utils/eventBus";

export function ProductForm({
  editData,
  setEditData,
  editMode,
  id,
  code,
  formHeader,
  setFormHeader,
  formItem,
  setFormItem,
}) {
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [gmc, setGmc] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState([]);
  const [itemsSelectOption, setItemsSelectOption] = useState([]);

  const [remarks, setRemarks] = useState("");
  const [location, setLocation] = useState("STAGING");

  // Whs Code
  const [whsCode, setWhsCode] = useState([
    { value: "CKY", label: "CKY" },
    { value: "CDY", label: "CDY" },
    { value: "NGY", label: "NGY" },
    { value: "PROMO", label: "PROMO" },
    { value: "SAMPLE", label: "SAMPLE" },
  ]);
  const [selectedWhsCode, setSelectedWhsCode] = useState(whsCode[0].value);
  const handleWhsCodeChange = (selectedOption) => {
    setSelectedWhsCode(selectedOption.value);
  };

  // Remarks Inbound
  const [handlingOption, setHandlingOption] = useState([]);
  const [handlingSelected, setHandlingSelected] = useState("");
  const handleHandlingChange = (selectedOption) => {
    console.log(selectedOption);
    setHandlingSelected(selectedOption.value);
  };

  const handleSelectChange = (selectedOption) => {
    const itemSelected = items.find(
      (item) => item.item_code === selectedOption.value
    );
    setItemCode(selectedOption.value);
    setItemName(itemSelected.item_name);
    setGmc(itemSelected.gmc);
  };

  const [uom, setUom] = useState("PCS");
  const [recDate, setRecDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {

    console.log("form header", formHeader);
    console.log("form item", formItem);

    const fetchData = async () => {
      try {
        const [products, handling] = await Promise.all([
          api.get("/products", { withCredentials: true }),
          api.get("/handling", { withCredentials: true }),
        ]);

        if (products.data.success && handling.data.success) {
          setItemsSelectOption(
            products.data.data.map((item) => ({
              value: item.ID,
              label: item.item_code,
            }))
          );
          setItems(products.data.data);
          const options = handling.data.data.map((item) => ({
            value: item.id,
            label: item.name,
          }));
          setHandlingOption(options);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setTimeout(() => {
          // setLoading(false);
        }, 500);
      }
    };

    fetchData();
  }, []);

  // useEffect(() => {
  //   api.get("/products", { withCredentials: true }).then((res) => {
  //     if (res.data.success) {
  //       setItemsSelectOption(
  //         res.data.data.map((item) => ({
  //           value: item.item_code,
  //           label: item.item_code + " - " + item.item_name,
  //         }))
  //       );
  //       setItems(res.data.data);
  //     }
  //   });

  //   api.get("/handling", { withCredentials: true }).then((res) => {
  //     if (res.data.success) {
  //       // Olah response jadi opsi yang benar
  //       const options = res.data.data.map((item) => ({
  //         value: item.id,
  //         label: item.name,
  //       }));
  //       // Set hasil ke state
  //       setHandlingOption(options);

  //       // Set default Handling
  //       if (!editData) {
  //         setHandlingSelected(10);
  //       }
  //     }
  //   });

  //   if (editData) {
  //     setItemCode(editData.item_code);
  //     setItemName(editData.item_name);
  //     setGmc(editData.gmc);
  //     setQuantity(editData.quantity);
  //     setUom(editData.uom);
  //     setRecDate(editData.rec_date);
  //     setSelectedWhsCode(editData.whs_code);
  //     setLocation(editData.location);
  //     setHandlingSelected(editData.handling_id);
  //     setRemarks(editData.remarks);
  //   }

  // }, [editData]);

  async function handleSubmit(e) {
    e.preventDefault();

    console.log(formHeader, formItem);
    // return;

    try {
      const [saveData] = await Promise.all([
        api.post(
          "/inbound/detail",
          { form_header: formHeader, form_item: formItem },
          { withCredentials: true }
        ),
      ]);

      if (saveData.data.success) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: "Saved",
          type: "success",
        });

        console.log("Inbound ID : ", saveData.data.data.inbound_id);

        setFormHeader({
          ...formHeader,
          inbound_id: saveData.data.data.inbound_id,
          inbound_no: saveData.data.data.inbound_no,
        });

        setFormItem({
          ...formItem,
          inbound_detail_id: 0,
          inbound_id: saveData.data.data.inbound_id,
          inbound_no: saveData.data.data.inbound_no,
        });

        mutate("/inbound/" + saveData.data.data.inbound_id);
      }

      // document.getElementById("itemCode")?.focus();
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
    // setError(null);
    // setEditData(null);
    // setItemCode("");
    // setItemName("");
    // setGmc("");
  };

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
                onChange={(selectedOption) => {
                  const item = items.find((e) => e.ID === selectedOption.value);
                  setFormItem({
                    ...formItem,
                    item_id: selectedOption.value,
                    item_code: item.item_code,
                    item_name: item.item_name,
                    barcode: item.barcode,
                    uom: item.uom,
                  });
                }}
                value={{ value: formItem.item_id, label: formItem.item_code }}
                placeholder="Select an option"
              />
              <span className="text-xs text-muted-foreground">
                Item Name : {formItem.item_name} <br />
                GMC : {formItem.barcode} <br />
                Serial :{" "}
                {
                  items.find((item) => item.ID === formItem.item_id)?.has_serial
                }{" "}
                | Waranty :{" "}
                {
                  items.find((item) => item.ID === formItem.item_id)
                    ?.has_waranty
                }
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  id="quantity"
                  onChange={(e) =>
                    setFormItem({
                      ...formItem,
                      quantity: parseInt(e.target.value),
                    })
                  }
                  value={formItem.quantity}
                  placeholder="Enter Quantity"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label>UoM</Label>
                <Input
                  type="text"
                  id="uom"
                  onChange={(e) =>
                    setFormItem({ ...formItem, uom: e.target.value })
                  }
                  value={
                    items.find((item) => item.ID === formItem.item_id)?.uom
                  }
                  placeholder=""
                  readOnly
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label>Location</Label>
                <Input
                  type="text"
                  id="location"
                  value={formItem.location}
                  onChange={(e) =>
                    setFormItem({ ...formItem, location: e.target.value })
                  }
                  placeholder=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col space-y-1.5">
                <Label>Rec Date</Label>
                <Input
                  type="date"
                  id="recDate"
                  onChange={(e) =>
                    setFormItem({ ...formItem, rec_date: e.target.value })
                  }
                  value={formItem.rec_date}
                  placeholder=""
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label>Whs Code</Label>
                <Select
                  id="whsCode"
                  options={whsCode}
                  value={{ value: formItem.whs_code, label: formItem.whs_code }}
                  onChange={(e) =>
                    setFormItem({ ...formItem, whs_code: e.value })
                  }
                  placeholder="Select an option"
                />
              </div>
            </div>
            <div className="grid grid-cols-1">
              <div className="flex flex-col space-y-1.5">
                <Label>Handling</Label>
                <Select
                  id="handling"
                  options={handlingOption}
                  onChange={(e) =>
                    setFormItem({ ...formItem, handling_id: e.value })
                  }
                  value={{
                    value: formItem.handling_id,
                    label: handlingOption.find(
                      (item) => item.value === formItem.handling_id
                    )?.label,
                  }}
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
                  onChange={(e) =>
                    setFormItem({ ...formItem, remarks: e.target.value })
                  }
                  value={formItem.remarks}
                  placeholder="Enter Remarks"
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
          {formItem.inbound_detail_id > 0 ? "Update" : "Add"}
        </Button>
      </CardFooter>
    </Card>
  );
}
