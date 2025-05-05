/* eslint-disable @typescript-eslint/no-unused-vars */
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout";

export default function Page() {
  const stats = [
    { title: "Total Products", value: 1200 },
    { title: "Pending Orders", value: 45 },
    { title: "Shipped Orders", value: 300 },
    { title: "Inventory Value", value: "$250,000" },
  ];

  const recentOrders = [
    { id: "ORD-001", customer: "John Doe", status: "Pending", total: "$500" },
    {
      id: "ORD-002",
      customer: "Jane Smith",
      status: "Shipped",
      total: "$1200",
    },
    {
      id: "ORD-003",
      customer: "Michael Johnson",
      status: "Pending",
      total: "$300",
    },
    {
      id: "ORD-004",
      customer: "Emily Davis",
      status: "Shipped",
      total: "$750",
    },
  ];

  return (
    <Layout title="Home" subTitle="Dashboard">
      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3"></div>
      {/* Content */}
      <div className="flex flex-1 flex-col gap-6 p-6 pt-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader>
                <CardTitle>{stat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>{order.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
