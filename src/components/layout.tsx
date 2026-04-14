/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
import { useEffect } from "react";

import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useAppSelector } from "@/hooks/useAppSelector";
import { Server } from "lucide-react";
import { ConnectionStatus } from "./connection-status";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function Layout({
  children,
  ...props
}: {
  children: React.ReactNode;
  [props: string]: any;
}) {
  const router = useRouter();
  const userRedux = useAppSelector((state) => state.user);
  useEffect(() => {
    if (props.subTitle) {
      window.document.title = props.subTitle;
    }
  }, [props.subTitle]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <div className="flex items-center gap-3">
                    <span
                      className="right-6 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => router.push(props.titleLink || "#")}
                    >
                      {props.title || "Page Menu"}
                    </span>
                    <div className="
                    absolute top-5 right-6
                    flex items-center 
                    gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm">
                      <Server className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold tracking-wide">
                        {userRedux.unit?.replace(/_/g, ' ').toUpperCase() || 'SYSTEM'}
                      </span>
                    </div>
                    <div className="absolute top-5 right-36 me-2">
                    <ConnectionStatus />
                    </div>
                  </div>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {props.subTitle || "Page Sub Menu"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className={`${inter.variable} font-sans`}>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
