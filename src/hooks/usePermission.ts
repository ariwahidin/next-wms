/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/usePermission.ts
import { useSelector } from "react-redux"
import { RootState } from "@/store"

export const usePermission = () => {
  const permissions = useSelector((state: RootState) => state.user.permissions)
  const roles = useSelector((state: RootState) => state.user.roles)

  const isSuperAdmin = roles.some((r: any) => r.name === "SUPERADMIN")

  const can = (resource: string, action: string): boolean => {
    if (isSuperAdmin) return true
    return permissions.includes(`${resource}:${action}`)
  }

  return { can, permissions, isSuperAdmin }
}