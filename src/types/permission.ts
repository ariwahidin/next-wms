// types/permission.ts
export interface Permission {
  ID: number;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface PermissionFormData {
  name: string;
  description?: string;
  resource: string;
  action: string;
}