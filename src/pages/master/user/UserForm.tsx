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
import { set } from "react-hook-form";

export default function UserForm({ editData, setEditData }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 🔥 Jika editData berubah, isi form dengan data produk yang dipilih
  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setUsername(editData.username);
      setEmail(editData.email);
      setPassword(editData.password);
    }
  }, [editData]);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validasi form
    if ( !name || !username || !email || !password) {
      setError("Harap isi semua field.");
      // Fokuskan ke field yang kosong
      if 
      (!name) {
        document.getElementById("name")?.focus();
      } else if (!username) {
        document.getElementById("username")?.focus();
      } else if (!email) {
        document.getElementById("email")?.focus();
      } else if (!password) {
        document.getElementById("password")?.focus();
      }
      return;
    }

    try {
      setError(null); // Reset error message jika form valid

      if (editData) {
        console.log(editData);
        // 🔥 Update produk jika sedang dalam mode edit
        await api.put(
          `/users/${editData.ID}`, // ID produk dari editData
          {
            name: name,
            username: username,
            email: email,
            password: password,
          },
          { withCredentials: true }
        );
      } else {
        // 🔥 Tambah produk baru jika tidak sedang edit
        await api.post(
          "/users",
          {
            name: name,
            username: username,
            email: email,
            password: password,
          },
          { withCredentials: true }
        );
      }

      mutate("/users"); // 🔥 Refresh tabel otomatis tanpa reload
      setEditData(null); // 🔄 Reset editData setelah submit
      setName("");
      setUsername("");
      setEmail("");
      setPassword("");
      document.getElementById("name")?.focus();
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
    setUsername("");
    setEmail("");
    setPassword("");
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>User Form</CardTitle>
        <CardDescription>
          {editData ? "Edit User" : "Add User"}
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
              <Label htmlFor="supplier_code">Name</Label>
              <Input
                id="name"
                onChange={(e) => setName(e.target.value)}
                value={name}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="supplier_code">Username</Label>
              <Input
                id="username"
                onChange={(e) => setUsername(e.target.value)}
                value={username}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">Email</Label>
              <Input
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                placeholder=""
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="">Password</Label>
              <Input
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
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
