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
import { QaStatus } from "@/types/qa-status";

export default function Form({ editData, setEditData }) {
  const [qa, setQa] = useState<QaStatus>({
    id: 0,
    qa_status: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editData) {
      setQa(editData);
    }
  }, [editData]);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validasi form
    if (qa.qa_status.trim() === "") {
      setError("Please fill all the fields.");
      return;
    }

    try {
      setError(null); // Reset error message jika form valid
      if (editData) {
        console.log(editData);
        // 🔥 Update produk jika sedang dalam mode edit
        await api.put(
          `/qa-status/${editData.id}`,qa);
      } else {
        // 🔥 Tambah produk baru jika tidak sedang edit
        await api.post(
          "/qa-status",qa
        );
      }

      mutate("/qa-status"); // 🔥 Refresh tabel otomatis tanpa reload
      setEditData(null); 
      setQa({ id: 0, qa_status: "", description: "" });
      setError(null);
      document.getElementById("qa_status")?.focus();
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

  // Menangani tombol Enter untuk submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e); // Submit form saat Enter
    }
  };

  const handleCancel = () => {
    setError(null);
    setEditData(null);
    setQa({ id: 0, qa_status: "", description: "" });
    document.getElementById("qa_status")?.focus();
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle> {editData ? "Edit QA Status" : "Add QA Status"}</CardTitle>
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
              <Label htmlFor="">QA Status</Label>
              <Input
                id="qa_status"
                value={qa.qa_status}
                onChange={(e) => setQa({ ...qa, qa_status: e.target.value })}
                placeholder="Enter QA Status"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">Description</Label>
              <Input
                id="description"
                value={qa.description}
                onChange={(e) => setQa({ ...qa, description: e.target.value })}
                placeholder="Enter Description"
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
