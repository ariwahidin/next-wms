// components/RoleForm.tsx
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface RoleFormProps {
    mode: "create" | "edit";
    roleData?: { name: string; description?: string };
    onSubmit: (data: { name: string }) => void;
  }
  
  const RoleForm: React.FC<RoleFormProps> = ({ mode, roleData, onSubmit }) => {
    const [name, setName] = useState(roleData?.name || "");
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({ name });
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Role Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button type="submit">
          {mode === "edit" ? "Update Role" : "Create Role"}
        </Button>
      </form>
    );
  };
  
  export default RoleForm;