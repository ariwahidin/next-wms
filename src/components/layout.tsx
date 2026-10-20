// // /* eslint-disable @typescript-eslint/no-unused-vars */
// // /* eslint-disable @typescript-eslint/no-explicit-any */
// // "use client";

// // import { AppSidebar } from "@/components/app-sidebar";
// // import {
// //   Breadcrumb,
// //   BreadcrumbItem,
// //   BreadcrumbLink,
// //   BreadcrumbList,
// //   BreadcrumbPage,
// //   BreadcrumbSeparator,
// // } from "@/components/ui/breadcrumb";
// // import { Separator } from "@/components/ui/separator";
// // import {
// //   SidebarInset,
// //   SidebarProvider,
// //   SidebarTrigger,
// // } from "@/components/ui/sidebar";
// // import { useEffect } from "react";

// // import { Inter } from "next/font/google";
// // import { useRouter } from "next/navigation";
// // import { Badge } from "@/components/ui/badge";
// // import { useAppSelector } from "@/hooks/useAppSelector";
// // import { Server } from "lucide-react";
// // import { ConnectionStatus } from "./connection-status";
// // import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
// // import { Toaster } from "sonner";

// // const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// // export default function Layout({
// //   children,
// //   ...props
// // }: {
// //   children: React.ReactNode;
// //   [props: string]: any;
// // }) {
// //   const router = useRouter();
// //   const userRedux = useAppSelector((state) => state.user);

// //   useRealtimeEvents();

// //   useEffect(() => {
// //     if (props.subTitle) {
// //       window.document.title = props.subTitle;
// //     }
// //   }, [props.subTitle]);

// //   return (
// //     <SidebarProvider>
// //       <AppSidebar />
// //       <SidebarInset>
// //         <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200">
// //           <div className="flex items-center gap-2 px-4">
// //             <SidebarTrigger className="-ml-1" />
// //             <Separator orientation="vertical" className="mr-2 h-4" />
// //             <Breadcrumb>
// //               <BreadcrumbList>
// //                 <BreadcrumbItem className="hidden md:block">
// //                   <div className="flex items-center gap-3">
// //                     <span
// //                       className="right-6 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
// //                       onClick={() => router.push(props.titleLink || "#")}
// //                     >
// //                       {props.title || "Page Menu"}
// //                     </span>
// //                     <div className="
// //                     absolute top-5 right-6
// //                     flex items-center 
// //                     gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm">
// //                       <Server className="w-3.5 h-3.5" />
// //                       <span className="text-xs font-semibold tracking-wide">
// //                         {userRedux.unit?.replace(/_/g, ' ').toUpperCase() || 'SYSTEM'}
// //                       </span>
// //                     </div>
// //                     <div className="absolute top-5 right-36 me-2">
// //                     <ConnectionStatus />
// //                     </div>
// //                   </div>
// //                 </BreadcrumbItem>
// //                 <BreadcrumbSeparator className="hidden md:block" />
// //                 <BreadcrumbItem>
// //                   <BreadcrumbPage>
// //                     {props.subTitle || "Page Sub Menu"}
// //                   </BreadcrumbPage>
// //                 </BreadcrumbItem>
// //               </BreadcrumbList>
// //             </Breadcrumb>
// //           </div>
// //         </header>
// //         <div className={`${inter.variable} font-sans`}>{children}</div>
// //       </SidebarInset>
// //       <Toaster richColors position="top-right" />
// //     </SidebarProvider>
// //   );
// // }


// "use client";

// import * as React from "react";
// import { Inter } from "next/font/google";
// import { Server } from "lucide-react";

// import { AppSidebar } from "@/components/app-sidebar";
// // import { PageTabs } from "@/components/page-tabs";
// import { PageTabsProvider } from "@/contexts/page-tabs-context";

// import {
//   SidebarInset,
//   SidebarProvider,
//   SidebarTrigger,
// } from "@/components/ui/sidebar";

// import { Separator } from "@/components/ui/separator";
// import { useAppSelector } from "@/hooks/useAppSelector";
// import { ConnectionStatus } from "./connection-status";
// import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
// import { Toaster } from "sonner";
// import { PageTabs } from "./page-tabs";

// const inter = Inter({
//   subsets: ["latin"],
//   variable: "--font-inter",
// });

// type LayoutProps = {
//   children: React.ReactNode;
//   title?: string;
//   titleLink?: string;
//   subTitle?: string;
//   [key: string]: unknown;
// };

// export default function Layout({
//   children,
//   ...props
// }: LayoutProps) {
//   const userRedux = useAppSelector((state) => state.user);

//   useRealtimeEvents();

//   React.useEffect(() => {
//     if (typeof props.subTitle === "string") {
//       window.document.title = props.subTitle;
//     }
//   }, [props.subTitle]);

//   return (
//     <SidebarProvider>
//       <PageTabsProvider>
//         <AppSidebar />

//         <SidebarInset>
//           <header className="sticky top-0 z-30 flex h-14 min-w-0 items-center gap-2 border-b bg-background px-3">
//             <SidebarTrigger className="shrink-0" />

//             <Separator
//               orientation="vertical"
//               className="h-5 shrink-0"
//             />

//             <PageTabs />

//             <div className="hidden shrink-0 items-center gap-2 border-l pl-3 lg:flex">
//               <ConnectionStatus />

//               <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-2.5 py-1 text-white shadow-sm">
//                 <Server className="size-3.5" />
//                 <span className="max-w-[150px] truncate text-xs font-semibold tracking-wide">
//                   {userRedux.unit?.replace(/_/g, " ").toUpperCase() ||
//                     "SYSTEM"}
//                 </span>
//               </div>
//             </div>
//           </header>

//           <div className={`${inter.variable} min-w-0 flex-1 font-sans`}>
//             {children}
//           </div>
//         </SidebarInset>

//         <Toaster richColors position="top-right" />
//       </PageTabsProvider>
//     </SidebarProvider>
//   );
// }



"use client";

import * as React from "react";
import { Inter } from "next/font/google";
import { Server } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { PageTabs } from "@/components/page-tabs";
import { useKeepAlivePageActive } from "@/contexts/keep-alive-page-context";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

import { useAppSelector } from "@/hooks/useAppSelector";
import { ConnectionStatus } from "@/components/connection-status";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

type LayoutProps = {
  children: React.ReactNode;
  title?: string;
  titleLink?: string;
  subTitle?: string;
  [key: string]: unknown;
};

export default function Layout({
  children,
  ...props
}: LayoutProps) {
  const isActive = useKeepAlivePageActive();
  const userRedux = useAppSelector((state) => state.user);

  // Jalankan listener realtime hanya pada halaman aktif.
  // Jika hook ini memang harus global, pindahkan ke _app.tsx.
  useRealtimeEvents();

  React.useEffect(() => {
    if (isActive && typeof props.subTitle === "string") {
      document.title = props.subTitle;
    }
  }, [isActive, props.subTitle]);

  return (
    <SidebarProvider>
      {isActive && <AppSidebar />}

      <SidebarInset>
        {isActive && (
          <header className="sticky top-0 z-30 flex h-14 min-w-0 items-center gap-2 border-b bg-background px-3">
            <SidebarTrigger className="shrink-0" />

            <Separator
              orientation="vertical"
              className="h-5 shrink-0"
            />

            <PageTabs />

            <div className="hidden shrink-0 items-center gap-2 border-l pl-3 lg:flex">
              <ConnectionStatus />

              <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-2.5 py-1 text-white shadow-sm">
                <Server className="size-3.5" />

                <span className="max-w-[150px] truncate text-xs font-semibold tracking-wide">
                  {userRedux.unit?.replace(/_/g, " ").toUpperCase() ||
                    "SYSTEM"}
                </span>
              </div>
            </div>
          </header>
        )}

        <main
          hidden={!isActive}
          className={`${inter.variable} min-w-0 flex-1 font-sans`}
        >
          {children}
        </main>
      </SidebarInset>

      {isActive && (
        <Toaster richColors position="top-right" />
      )}
    </SidebarProvider>
  );
}
