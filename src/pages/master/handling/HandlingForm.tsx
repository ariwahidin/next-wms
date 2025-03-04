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
import { AlertCircle, CaseUpper } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import Select from "react-select";

export function HandlingForm({ ...props }: any) {
  const [handlingName, setHandlingName] = useState("");
  const [handlingRate, setHandlingRate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [handlingData, setHandlingData] = useState([]);

  const handlingOptions = [
    { value: "red", label: "Red" },
    { value: "orange", label: "Orange" },
    { value: "yellow", label: "Yellow" },
    { value: "green", label: "Green" },
  ];

  const [selectedHandlingCombined, setSelectedHandlingCombined] =
    useState(null);

  // 🔥 Jika editData berubah, isi form dengan data produk yang dipilih
  useEffect(() => {
    if (props.editData) {
      setHandlingName(props.editData.name);
      setHandlingRate(props.editData.rate_idr);
    }

    try {
      api.get("/handling/origin", { withCredentials: true }).then((res) => {
        if (res.data.success) {
          console.log(res.data.data);

          if (res.data.data != null) {
            setHandlingData(
              res.data.data.map((item: any) => ({
                value: item.id,
                label: item.name,
              }))
            );
          }
        }
      });
    } catch (error) {
      console.error("Error fetching handling data:", error);
    }
  }, [props.editData]);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validasi form
    if (!handlingName || !handlingRate) {
      setError("Harap isi semua field.");
      // Fokuskan ke field yang kosong
      if (!handlingName) {
        document.getElementById("handlingName")?.focus();
      } else if (!handlingRate) {
        document.getElementById("handlingRate")?.focus();
      }
      return;
    }

    try {
      setError(null); // Reset error message jika form valid

      if (props.editData) {
        console.log(props.editData);
        // 🔥 Update produk jika sedang dalam mode edit
        await api.put(
          `/handling/${props.editData.id}`, // ID produk dari editData
          {
            name: handlingName,
            rate_idr: parseInt(handlingRate),
          },
          { withCredentials: true }
        );
      } else {
        // 🔥 Tambah produk baru jika tidak sedang edit
        await api.post(
          "/handling",
          {
            name: handlingName,
            rate_idr: parseInt(handlingRate),
          },
          { withCredentials: true }
        );
      }

      mutate("/handling");
      setError(null);
      setHandlingName("");
      setHandlingRate("");
      document.getElementById("handlingName")?.focus();
    } catch (err: any) {
      // Tangani error dengan cara yang lebih ramah
      if (err.response) {
        // Backend memberikan response error (misal status 400)
        if (err.response.status === 400) {
          setError("Data yang dimasukkan tidak valid.");
        } else {
          setError("Terjadi kesalahan, coba lagi nanti.");
        }
      } else {
        // Tidak ada response dari backend (misalnya jaringan error)
        setError("Tidak ada respon dari server.");
      }
    }
  }

  async function handleCombineSubmit(e) {
    e.preventDefault();

    console.log("Selected handling combined:", selectedHandlingCombined);
    try {
      await api.post(
        "/handling/combine",
        {
          combine: selectedHandlingCombined,
        },
        { withCredentials: true }
      );
      mutate("/handling");
      setError(null);
    } catch (err: any) {
      if (err.response) {
        if (err.response.status === 400) {
          setError("Data yang dimasukkan tidak valid.");
        } else {
          setError("Terjadi kesalahan, coba lagi nanti.");
        }
      }
    }
  }

  // Menangani tombol Enter untuk submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e); // Submit form saat Enter
    }
  };

  const handleCancel = () => {
    setError(null);
    props.setEditData(null);
    setHandlingName("");
    setHandlingRate("");
  };

  const handleHandlingChange = (selectedOption) => {
    console.log(selectedOption);
    setSelectedHandlingCombined(selectedOption);
  };

  return (
    <Tabs defaultValue="single" className="w-full">
      <TabsList>
        <TabsTrigger value="single">Single</TabsTrigger>
        <TabsTrigger value="combine">Combine</TabsTrigger>
      </TabsList>
      <TabsContent value="single">
        <Card className="w-[400px] mt-3">
          <CardHeader>
            <CardTitle>Handling Form</CardTitle>
            <CardDescription>
              {props.editData ? "Edit Handling" : "Add Handling"}
            </CardDescription>
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
                  <Label htmlFor="">Handling Name</Label>
                  <Input
                    id="handlingName"
                    onChange={(e) =>
                      setHandlingName(e.target.value.toUpperCase())
                    }
                    value={handlingName}
                    placeholder=""
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="">Handling Rate</Label>
                  <Input
                    type="number"
                    id="handlingRate"
                    onChange={(e) => setHandlingRate(e.target.value)}
                    value={handlingRate}
                    placeholder=""
                  />
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
              {props.editData ? "Update" : "Add"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="combine">
        <Card className="w-[400px] mt-3">
          <CardHeader>
            <CardTitle>Handling Combine Form</CardTitle>
            <CardDescription>
              {props.editData ? "Edit Handling" : "Add Handling"}
            </CardDescription>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCombineSubmit} onKeyDown={handleKeyDown}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="">Handling Name</Label>
                  <Select
                    // defaultValue={[colourOptions[2], colourOptions[3]]}
                    id="inputHandlingCombine"
                    isMulti
                    name="colors"
                    options={handlingData}
                    onChange={handleHandlingChange}
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button onClick={handleCombineSubmit} type="submit">
              {" "}
              {/* Tombol submit */}
              {props.editData ? "Update" : "Add"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
