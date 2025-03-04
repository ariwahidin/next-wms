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

export function ProductForm({ editData, setEditData, editMode, id, code }) {
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [gmc, setGmc] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState([]);
  const [itemsSelectOption, setItemsSelectOption] = useState([]);

  const [remarks, setRemarks] = useState("");

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
  const [handlingSelected, setHandlingSelected] = useState(null);
  const handleHandlingChange = (selectedOption) => {
    console.log(selectedOption);
    setHandlingSelected(selectedOption);
  };

  const [uom, setUom] = useState("PCS");
  const [recDate, setRecDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const handleSelectChange = (selectedOption) => {
    const itemSelected = items.find(
      (item) => item.item_code === selectedOption.value
    );
    setItemCode(selectedOption.value);
    setItemName(itemSelected.item_name);
    setGmc(itemSelected.gmc);
  };

  useEffect(() => {
    api.get("/products", { withCredentials: true }).then((res) => {
      if (res.data.success) {
        setItemsSelectOption(
          res.data.data.map((item) => ({
            value: item.item_code,
            label: item.item_code + " - " + item.item_name,
          }))
        );
        setItems(res.data.data);
      }
    });

    api.get("handling", { withCredentials: true }).then((res) => {
      if (res.data.success) {
        // Olah response jadi opsi yang benar
        const options = res.data.data.map((item) => ({
          value: item.id,
          label: item.name,
        }));

        // Set hasil ke state
        setHandlingOption(options);

        // Cek apakah ada editData
        if (editData) {
          const selected = options.find(
            (item) => item.value === editData.handling_id
          );
          setHandlingSelected(selected || null);
        } else if (options.length > 0) {
          // Jika tidak ada editData, ambil opsi pertama
          setHandlingSelected(options[0]);
        }
      }
    });

    if (editData) {
      setItemCode(editData.item_code);
      setItemName(editData.item_name);
      setGmc(editData.gmc);
      setQuantity(editData.quantity);
      setUom(editData.uom);
      setRecDate(editData.rec_date);
      setSelectedWhsCode(editData.whs_code);

      const selected = handlingOption.find(
        (item) => item.value === editData.handling_id
      );
      setHandlingSelected(selected || null);

      setRemarks(editData.remarks);

      console.log("Selected : ", selected);
      console.log("Edit Data ABS : ", editData);
    }

    // console.log("Edit Data : ", editData);
  }, [editData]);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validasi form
    if (!itemCode || !quantity) {
      setError("Harap isi semua field.");
      if (!itemCode) {
        document.getElementById("itemCode")?.focus();
      } else if (!quantity) {
        document.getElementById("quantity")?.focus();
      }
      return;
    }

    try {
      setError(null);

      console.log("ID : ", id);

      if (editData) {
        const editUrl = `/inbound/detail/${editData.id}`;
        await api.put(
          editUrl,
          {
            item_code: itemCode,
            quantity: parseInt(quantity),
            reference_code: code,
            uom: uom,
            rec_date: recDate,
            whs_code: selectedWhsCode,
            handling: handlingSelected,
            remarks: remarks,
          },
          { withCredentials: true }
        );
      } else {
        const urlAdd = `/inbound/detail`;
        const dataPost = {
          inbound_id : parseInt(id),
          item_code: itemCode,
          quantity: parseInt(quantity),
          reference_code: code,
          uom: uom,
          rec_date: recDate,
          whs_code: selectedWhsCode,
          handling: handlingSelected,
          remarks: remarks,
        };

        await api.post(urlAdd, dataPost, { withCredentials: true });
      }

      let urlMutate = "/inbound/detail/draft";
      if (editMode) {
        urlMutate = "/inbound/" + id;
      }

      mutate(urlMutate);
      setEditData(null);
      setQuantity("");

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
    setError(null);
    setEditData(null);
    setItemCode("");
    setItemName("");
    setGmc("");
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
                onChange={handleSelectChange}
                value={itemsSelectOption.find(
                  (item) => item.value === itemCode
                )}
                placeholder="Select an option"
              />
              <span className="text-xs text-muted-foreground">
                Item Name : {itemName}
              </span>
              <span className="text-xs text-muted-foreground">GMC : {gmc}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  id="quantity"
                  onChange={(e) => setQuantity(e.target.value)}
                  value={quantity}
                  placeholder=""
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label>UoM</Label>
                <Input
                  type="text"
                  id="uom"
                  onChange={(e) => setUom(e.target.value)}
                  value={uom}
                  placeholder=""
                  readOnly
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col space-y-1.5">
                <Label>Rec Date</Label>
                <Input
                  type="date"
                  id="recDate"
                  onChange={(e) => setRecDate(e.target.value)}
                  value={recDate}
                  placeholder=""
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label>Whs Code</Label>
                <Select
                  id="whsCode"
                  options={whsCode}
                  value={whsCode.find((item) => item.value === selectedWhsCode)}
                  onChange={handleWhsCodeChange}
                  placeholder="Select an option"
                />
              </div>
            </div>
            <div className="grid grid-cols-1">
              <div className="flex flex-col space-y-1.5">
                <Label>Handling</Label>
                {/* <Select
                  id="handling"
                  options={handlingOption}
                  onChange={handleHandlingChange}
                  value={handlingOption.find(
                    (item) => item.value === handlingSelected.value
                  )}
                  placeholder="Select an option"
                /> */}

                <Select
                  id="handling"
                  options={handlingOption}
                  onChange={handleHandlingChange}
                  value={handlingSelected} // Langsung gunakan state
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
                  onChange={(e) => setRemarks(e.target.value)}
                  value={remarks}
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
          {editData ? "Update" : "Add"}
        </Button>
      </CardFooter>
    </Card>
  );
}
