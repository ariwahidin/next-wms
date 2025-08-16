// import { AppSidebar } from "@/components/app-sidebar"
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb"
// import { Separator } from "@/components/ui/separator"
// import {
//   SidebarInset,
//   SidebarProvider,
//   SidebarTrigger,
// } from "@/components/ui/sidebar"

// export default function Page() {
//   return (
//     <SidebarProvider>
//       <AppSidebar />
//       <SidebarInset>
//         <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
//           <div className="flex items-center gap-2 px-4">
//             <SidebarTrigger className="-ml-1" />
//             <Separator orientation="vertical" className="mr-2 h-4" />
//             <Breadcrumb>
//               <BreadcrumbList>
//                 <BreadcrumbItem className="hidden md:block">
//                   <BreadcrumbLink href="#">
//                     Building Your Application
//                   </BreadcrumbLink>
//                 </BreadcrumbItem>
//                 <BreadcrumbSeparator className="hidden md:block" />
//                 <BreadcrumbItem>
//                   <BreadcrumbPage>Data Fetching</BreadcrumbPage>
//                 </BreadcrumbItem>
//               </BreadcrumbList>
//             </Breadcrumb>
//           </div>
//         </header>
//         <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
//           <div className="grid auto-rows-min gap-4 md:grid-cols-3">
//             <div className="aspect-video rounded-xl bg-muted/50" />
//             <div className="aspect-video rounded-xl bg-muted/50" />
//             <div className="aspect-video rounded-xl bg-muted/50" />
//           </div>
//           <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
//         </div>
//       </SidebarInset>
//     </SidebarProvider>
//   )
// }

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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/80 backdrop-blur-sm transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-6">
            <SidebarTrigger className="-ml-1 hover:bg-slate-100 transition-colors" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-slate-300" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink 
                    href="#" 
                    className="text-slate-600 hover:text-slate-900 font-medium text-sm"
                  >
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block text-slate-400" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-slate-900 font-semibold text-sm">
                    Analytics Overview
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto pr-6">
            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6 bg-gradient-to-br from-slate-50 to-white min-h-screen">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                Good morning! 👋
              </h1>
              {/* <p className="text-slate-600 text-sm">
                Here's what's happening with your business today
              </p> */}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">$84,532</p>
                    <div className="flex items-center gap-1 mt-2">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-600">+12.5%</span>
                      <span className="text-xs text-slate-500">vs last month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Active Orders</p>
                    <p className="text-2xl font-bold text-slate-900">1,247</p>
                    <div className="flex items-center gap-1 mt-2">
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-500">-3.2%</span>
                      <span className="text-xs text-slate-500">vs last month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Total Products</p>
                    <p className="text-2xl font-bold text-slate-900">3,847</p>
                    <div className="flex items-center gap-1 mt-2">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-600">+8.1%</span>
                      <span className="text-xs text-slate-500">vs last month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Sales Chart */}
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Sales Overview</h3>
                    <p className="text-sm text-slate-600">Monthly performance metrics</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">This Year</Badge>
                    <BarChart3 className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
                <div className="h-64 bg-gradient-to-t from-slate-100 to-slate-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Chart visualization would go here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
                    <p className="text-sm text-slate-600">Latest system updates</p>
                  </div>
                  <PieChart className="w-5 h-5 text-slate-400" />
                </div>
                <div className="space-y-4">
                  {[
                    { action: "New order placed", time: "2 minutes ago", status: "success" },
                    { action: "Product updated", time: "15 minutes ago", status: "info" },
                    { action: "User registered", time: "1 hour ago", status: "success" },
                    { action: "Payment received", time: "2 hours ago", status: "success" },
                    { action: "System backup", time: "4 hours ago", status: "info" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className={`w-2 h-2 rounded-full ${
                        item.status === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{item.action}</p>
                        <p className="text-xs text-slate-500">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Stats */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Performance Metrics</h3>
                  <p className="text-sm text-slate-600">Key business indicators</p>
                </div>
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">Live Data</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">2,847</p>
                  <p className="text-sm text-slate-600">Active Users</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">94.2%</p>
                  <p className="text-sm text-slate-600">Success Rate</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">1,293</p>
                  <p className="text-sm text-slate-600">Products Sold</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">87.5%</p>
                  <p className="text-sm text-slate-600">Uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}