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

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function Layout({
  children,
  ...props
}: {
  children: React.ReactNode;
  [props: string]: any;
}) {
  const router = useRouter();
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
                {/* <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={props.titleLink || "#"}>
                    {props.title || "Page Menu"}
                  </BreadcrumbLink>
                </BreadcrumbItem> */}
                <BreadcrumbItem className="hidden md:block">
                  <span
                    className="cursor-pointer text-sm font-medium text-muted-foreground hover:underline"
                    onClick={() => router.push(props.titleLink || "#")}
                  >
                    {props.title || "Page Menu"}
                  </span>
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
