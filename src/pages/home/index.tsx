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
import { use, useEffect, useState } from "react";
import api from "@/lib/api";
import { Transactions } from "@/types/dashboard";
import dayjs from "dayjs";

export default function Page() {
  const [transactions, setTransactions] = useState<Transactions[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/dashboard", {
          withCredentials: true,
        });
        const data = await response.data;
        if (data.success === false) {
          return;
        }
        setTransactions(data.data.transactions);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        // setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Layout title="Home" subTitle="Dashboard">
      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3"></div>
      {/* Content */}
      <div className="flex flex-1 flex-col gap-6 p-6 pt-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card key={"inbound"}>
            <CardHeader>
              <CardTitle>{"Inbound Pending"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {transactions?.reduce((total, order) => {
                  if (order.trans_type === "inbound") {
                    return total + 1;
                  }
                  return total;
                }, 0)}
              </p>
            </CardContent>
          </Card>
          <Card key={"outbound"}>
            <CardHeader>
              <CardTitle>{"Outbound Pending"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {transactions?.reduce((total, order) => {
                  if (order.trans_type === "outbound") {
                    return total + 1;
                  }
                  return total;
                }, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            {/* <Button variant="outline" size="sm">
              View All
            </Button> */}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Trans Type</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Item</TableHead>
                  <TableHead>Total Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((order, index) => (
                  <TableRow key={order.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {dayjs(order.trans_date).format("D MMMM YYYY")}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{order.trans_type}</span>
                    </TableCell>
                    <TableCell>{order.no_ref}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>{order.tot_item}</TableCell>
                    <TableCell>{order.tot_qty}</TableCell>
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
