import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Calendar,
  Bell
} from "lucide-react"

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex items-center pt-5 gap-2 px-6">
          {/* <iframe title="ASICS Warehouse Performance (Rev1)" width="1210" height="841.25" src="https://app.powerbi.com/reportEmbed?reportId=c67b040b-5322-4514-b25c-68254f6832d7&autoAuth=true&ctid=ca2aecff-bc6d-4032-9161-fe56057fd193" frameborder="0" allowFullScreen="true"></iframe> */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}