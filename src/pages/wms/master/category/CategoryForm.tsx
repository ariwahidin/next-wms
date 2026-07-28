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
import { Category } from "@/types/category";

export default function CategoryForm({ editData, setEditData }) {
  const [category, setCategory] = useState<Category>({
    ID: 0,
    code: "",
    name: "",
    remarks: "",
  });
  const [error, setError] = useState<string | null>(null);

  // 🔥 Jika editData berubah, isi form dengan data category yang dipilih
  useEffect(() => {
    if (editData) {
      setCategory(editData);
    }
  }, [editData]);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validasi form
    if (category.code.trim() === "" || category.name.trim() === "") {
      setError("Please fill all the fields.");
      return;
    }

    try {
      setError(null); // Reset error message jika form valid

      if (editData) {
        // 🔥 Update category jika sedang dalam mode edit
        await api.put(`/categories/${editData.ID}`, category);
      } else {
        // 🔥 Tambah category baru jika tidak sedang edit
        await api.post("/categories", category);
      }

      mutate("/categories"); // 🔥 Refresh tabel otomatis tanpa reload
      setEditData(null);
      setCategory({ ID: 0, code: "", name: "", remarks: "" });
      setError(null);
      document.getElementById("code")?.focus();
    } catch (err: any) {
      // Tangani error dengan cara yang lebih ramah
      if (err.response) {
        // Backend memberikan response error (misal status 400)
        if (err.response.status === 400) {
          setError(err.response.data?.error || "Data yang dimasukkan tidak valid.");
        } else {
          setError("Terjadi kesalahan, coba lagi nanti.");
        }
      } else {
        // Tidak ada response dari backend (misalnya jaringan error)
        setError("Tidak ada respon dari server.");
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
    setEditData(null);
    setCategory({ ID: 0, code: "", name: "", remarks: "" });
    document.getElementById("code")?.focus();
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle> {editData ? "Edit Category" : "Add Category"}</CardTitle>
        {/* <CardDescription></CardDescription> */}
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
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={category.code}
                onChange={(e) =>
                  setCategory({ ...category, code: e.target.value })
                }
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={category.name}
                onChange={(e) =>
                  setCategory({ ...category, name: e.target.value })
                }
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={category.remarks}
                onChange={(e) =>
                  setCategory({ ...category, remarks: e.target.value })
                }
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
          {editData ? "Update" : "Add"}
        </Button>
      </CardFooter>
    </Card>
  );
}