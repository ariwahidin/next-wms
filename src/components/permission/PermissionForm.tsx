import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PermissionFormData } from "@/types/permission";

interface PermissionFormProps {
  mode: "create" | "edit";
  initialData?: {
    name: string;
    description?: string;
    resource?: string;
    action?: string;
  };
  onSubmit: (data: PermissionFormData) => void;
}

// PermissionForm — tambah resource & action
const ACTIONS = ["read", "create", "update", "delete", "export"];

const PermissionForm: React.FC<PermissionFormProps> = ({ mode, initialData, onSubmit }) => {
  const [form, setForm] = useState<PermissionFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    resource: initialData?.resource || "",
    action: initialData?.action || "read",
  });

  const handleChange = (field: keyof PermissionFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4 max-w-xl mx-auto">
      <div>
        <Label>Permission Name</Label>
        <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
      </div>
      <div>
        <Label>Resource</Label>
        <Input value={form.resource} placeholder="e.g. supplier, inbound"
          onChange={(e) => handleChange("resource", e.target.value)} required />
      </div>
      <div>
        <Label>Action</Label>
        <select value={form.action} onChange={(e) => handleChange("action", e.target.value)}
          className="w-full border rounded p-2">
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <Label>Description</Label>
        <Input value={form.description} onChange={(e) => handleChange("description", e.target.value)} />
      </div>
      <Button type="submit">
        {mode === "create" ? "Create Permission" : "Update Permission"}
      </Button>
    </form>
  );
};

// const PermissionForm: React.FC<PermissionFormProps> = ({
//   mode,
//   initialData,
//   onSubmit,
// }) => {
//   const [name, setName] = useState(initialData?.name || "");
//   const [description, setDescription] = useState(initialData?.description || "");

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onSubmit({ name, description });
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
//       <div>
//         <Label>Permission Name</Label>
//         <Input value={name} onChange={(e) => setName(e.target.value)} />
//       </div>
//       <div>
//         <Label>Description</Label>
//         <Input value={description} onChange={(e) => setDescription(e.target.value)} />
//       </div>
//       <Button type="submit">
//         {mode === "create" ? "Create Permission" : "Update Permission"}
//       </Button>
//     </form>
//   );
// };

export default PermissionForm;
