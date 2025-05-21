"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner"; // ganti sesuai notifikasi Anda
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import Layout from "@/components/layout";

type Role = {
  ID: number;
  name: string;
  Permissions: Permission[];
};

type Permission = {
  ID: number;
  name: string;
};

export default function RolePermissionPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    []
  );

  // Fetch all roles with their permissions
  const fetchRoles = async () => {
    const res = await api.get("/roles", { withCredentials: true });
    setRoles(res.data.data);
  };

  // Fetch all available permissions
  const fetchPermissions = async () => {
    const res = await api.get("/permissions", { withCredentials: true });
    setPermissions(res.data.data);
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const handleSelectRole = (roleId: number) => {
    console.log("roles => ", roles);
    console.log("Selected role ID:", roleId);

    const role = roles.find((r) => r.ID === roleId);

    console.log("role:", role);

    setSelectedRole(role || null);
    setSelectedPermissionIds(role?.Permissions?.map((p) => p.ID) || []);
  };

  const handleTogglePermission = (id: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!selectedRole) return;

    try {
      const res = await api.put(
        `/roles/permissions/${selectedRole.ID}`,
        {
          permissionIds: selectedPermissionIds,
        },
        {
          withCredentials: true,
        }
      );

      if (res.data.success) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: res.data.message,
          type: "success",
        });
        fetchRoles();
      }
    } catch {
      toast.error("Failed to update permissions");
    }
  };

  return (
    <Layout title="Master" subTitle="Role Permission">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">Role-Permission Management</h1>

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2">Roles</h2>
              {roles.map((role) => (
                <Button
                  key={role.ID}
                  variant={selectedRole?.ID === role.ID ? "default" : "outline"}
                  onClick={() => handleSelectRole(role.ID)}
                  className="w-full mb-2"
                >
                  {role.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          {selectedRole && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <h2 className="text-lg font-semibold mb-2">
                  Permissions for {selectedRole?.name}
                </h2>
                {permissions.map((perm) => (
                  <div key={perm.ID} className="flex items-center space-x-2">
                    <Checkbox
                      id={`perm-${perm.ID}`}
                      checked={selectedPermissionIds.includes(perm.ID)}
                      onCheckedChange={() => handleTogglePermission(perm.ID)}
                    />
                    <Label htmlFor={`perm-${perm.ID}`}>{perm.name}</Label>
                  </div>
                ))}

                <Button onClick={handleSave} className="mt-4">
                  Save Permissions
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
