/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { mutate } from "swr";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Division } from "@/types/division";

const emptyDivision: Division = {
  id: 0,
  code: "",
  name: "",
  description: "",
};

export default function DivisionForm({ editData, setEditData }) {
  const [division, setDivision] = useState<Division>(emptyDivision);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editData) {
      setDivision(editData);
    }
  }, [editData]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (division.code.trim() === "" || division.name.trim() === "") {
      setError("Code and Name are required.");
      return;
    }

    try {
      setError(null);

      if (editData) {
        await api.put(`/divisions/${editData.id}`, division);
      } else {
        await api.post("/divisions", division);
      }

      mutate("/divisions");
      setEditData(null);
      setDivision(emptyDivision);
      document.getElementById("code")?.focus();
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
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      handleSubmit(e);
    }
  };

  const handleCancel = () => {
    setError(null);
    setEditData(null);
    setDivision(emptyDivision);
    document.getElementById("code")?.focus();
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>{editData ? "Edit Division" : "Add Division"}</CardTitle>
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
                value={division.code}
                onChange={(e) =>
                  setDivision({ ...division, code: e.target.value })
                }
                placeholder="e.g. DIV-01"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={division.name}
                onChange={(e) =>
                  setDivision({ ...division, name: e.target.value })
                }
                placeholder="e.g. Operations"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={division.description}
                onChange={(e) =>
                  setDivision({ ...division, description: e.target.value })
                }
                placeholder="Optional description..."
                rows={3}
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {editData ? "Update" : "Add"}
        </Button>
      </CardFooter>
    </Card>
  );
}