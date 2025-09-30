/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import { Select } from "@radix-ui/react-select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Role {
  ID: number;
  name: string;
}

interface Permission {
  ID: number;
  name: string;
}

interface UserFormProps {
  mode: "create" | "edit";
  userData?: any;
}

const UserForm: React.FC<UserFormProps> = ({ mode, userData }) => {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "",
    base_route: "",
    roles: [] as number[],
    permissions: [] as number[],
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const fetchData = async () => {
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        api.get("/roles", { withCredentials: true }),
        api.get("/permissions", { withCredentials: true }),
      ]);

      setRoles(rolesRes.data.data);
      setPermissions(permissionsRes.data.data);

    

      console.log("mode => ", mode);
      if (mode === "edit" && userData) {
        console.log("userData => ", userData);

        // setForm({
        //   ...form,
        //   ...userData,
        //   username: userData.data.username,
        //   password: "",
        //   name: userData.data.name,
        //   email: userData.data.email,
        //   base_route: userData.data.base_route,
        //   roles: userData.data.Roles.map((r: any) => r.ID),
        //   permissions: userData.data.Permissions.map((p: any) => p.ID),
        // });

        const d = await userData.data;

        setForm((prev) => ({
          ...prev,
          username: d.username,
          password: "",
          name: d.name ?? "",
          email: d.email ?? "",
          base_route: d.base_route ?? "",
          roles: d.Roles?.map((r: any) => r.ID) ?? [],
          permissions: d.Permissions?.map((p: any) => p.ID) ?? [],
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
  if (mode === "edit" && !userData) return; // tunggu userData ada
  fetchData();
}, [mode, userData]);

  // useEffect(() => {
  //   fetchData();
  // }, [mode, userData]);

  const handleCheckboxChange = (id: number, type: "roles" | "permissions") => {
    setForm((prev) => {
      const arr = prev[type];
      return {
        ...prev,
        [type]: arr.includes(id)
          ? arr.filter((item) => item !== id)
          : [...arr, id],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = mode === "create" ? "/users" : `/users/${userData.data.ID}`;

    let res;
    if (mode === "create") {
      if (!form.username || !form.password || !form.name || !form.email) {
        eventBus.emit("showAlert", {
          title: "Failed!",
          description: "Harap isi semua field.",
          type: "error",
        });
        return;
      }

      res = await api.post(url, form, { withCredentials: true });
    } else {
      if (!form.username || !form.name || !form.email) {
        eventBus.emit("showAlert", {
          title: "Failed!",
          description: "Harap isi semua field.",
          type: "error",
        });
        return;
      }
      res = await api.put(url, form, { withCredentials: true });
    }

    // const res = await api.post(url, form, { withCredentials: true });

    if (res.data.success) {
      eventBus.emit("showAlert", {
        title: "Success!",
        description: res.data.message,
        type: "success",
      });
      router.push("/wms/master/user");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
      <div>
        <Label>Username</Label>
        <Input
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
      </div>
      <div>
        <Label>Password</Label>
        <Input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </div>
      <div>
        <Label>Name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div>
        <Label>Email</Label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div>
        <Label>Base Route</Label>
        <Select
          value={form.base_route}
          onValueChange={(e) => setForm({ ...form, base_route: e })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Base Route" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="/dashboard">Desktop</SelectItem>
            <SelectItem value="/mobile">Scanner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1 block">Roles</Label>
        <div className="grid grid-cols-2 gap-2">
          {roles.map((role) => (
            <label key={role.ID} className="flex items-center space-x-2">
              <Checkbox
                checked={form.roles.includes(role.ID)}
                onCheckedChange={() => handleCheckboxChange(role.ID, "roles")}
              />
              <span>{role.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-1 block">Permissions</Label>
        <div className="grid grid-cols-2 gap-2">
          {permissions.map((perm) => (
            <label key={perm.ID} className="flex items-center space-x-2">
              <Checkbox
                checked={form.permissions.includes(perm.ID)}
                onCheckedChange={() =>
                  handleCheckboxChange(perm.ID, "permissions")
                }
              />
              <span>{perm.name}</span>
            </label>
          ))}
        </div>
      </div>

      <Button type="submit">
        {mode === "create" ? "Create User" : "Update User"}
      </Button>
    </form>
  );
};

export default UserForm;
