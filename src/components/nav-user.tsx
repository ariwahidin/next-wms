/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { ChevronsUpDown, LogOut, User, Package, Truck, Settings, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import api from "@/lib/api";
import { useRouter } from "next/router";
import { use, useEffect, useState } from "react";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useDispatch } from "react-redux";
import { persistor } from "@/store";
import { logout } from "@/store/userSlice";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
    role?: string;
  };
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const userRedux = useAppSelector((state) => state.user);
  const dispatch = useDispatch();

  const handleLogout = () => {
    // Tutup dialog terlebih dahulu
    setShowLogoutDialog(false);

    api
      .get("/auth/logout", { withCredentials: true })
      .then((res) => {
        if (res.data.success === true) {
          console.log("Logout successful");
        }
      })
      .catch((err) => console.log(err));

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("wms-auth-token="))
      ?.split("=")[1];
    console.log("Next Auth Token:", token);
    if (token) {
      document.cookie = `wms-auth-token=; path=/; max-age=0; secure; samesite=None`;
      dispatch(logout());
      persistor.purge().then(() => {
        router.push("/auth/login");
      });
    }

    // set css pointer-events
    document.body.style.pointerEvents = "auto";
  };

  useEffect(() => {
    // set css pointer-events
    // if (showLogoutDialog === false) {
    console.log("showLogoutDialog: ", showLogoutDialog);
    document.body.style.pointerEvents = "auto";
    // }
  }, [showLogoutDialog]);

  // Get user role badge color
  const getRoleBadge = () => {
    // const role = userRedux?.role || "user";
    const role = "user";
    const colors = {
      admin: "bg-red-500",
      manager: "bg-blue-500",
      operator: "bg-green-500",
      user: "bg-gray-500"
    };
    return colors[role as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-accent transition-all duration-200"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8 rounded-lg ring-2 ring-offset-2 ring-blue-500/20">
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} alt={user.name} />
                    ) : (
                      <AvatarFallback className="rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                        <User className="h-5 w-5 text-white" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-background" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-foreground">
                    {userRedux.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {userRedux.email}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl shadow-lg border-2"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 rounded-lg">
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} alt={user.name} />
                    ) : (
                      <AvatarFallback className="rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                        <User className="h-6 w-6 text-white" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="font-semibold text-sm">{userRedux.name}</span>
                    <span className="text-xs text-muted-foreground">{userRedux.email}</span>

                    {userRedux.roles.length > 0 && (
                      userRedux.roles.map((role) => (
                        <Badge
                          className={`${getRoleBadge()} text-white w-fit text-xs mt-1`}
                          key={role.ID}
                        >
                          {role.name}
                        </Badge>
                      ))
                    )}
                    {/* <Badge className={`${getRoleBadge()} text-white w-fit text-xs mt-1`}> */}
                    {/* {userRedux.role?.toUpperCase() || "USER"} */}
                    {/* {"User"} */}
                    {/* {userRedux.roles[0].name || "User"} */}
                    {/* </Badge> */}
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="cursor-pointer group py-2.5">
                <UserCircle className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="font-medium">My Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer group py-2.5">
                <Package className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="font-medium">My Orders</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer group py-2.5">
                <Truck className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="font-medium">Track Shipment</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer group py-2.5">
                <Settings className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="font-medium">Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer group py-2.5 text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="max-w-md bg-slate-50">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-red-100">
                <LogOut className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl">Confirm Logout</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Are you sure you want to log out? You will need to sign in again to access your account and continue managing your logistics operations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <Button className="mt-0"
              onClick={() => setShowLogoutDialog(false)}
            >Cancel</Button>
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Log Out
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// /* eslint-disable @typescript-eslint/no-unused-vars */
// "use client";

// import { ChevronsUpDown, LogOut, User } from "lucide-react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   useSidebar,
// } from "@/components/ui/sidebar";
// import api from "@/lib/api";
// import { useRouter } from "next/router";
// import { useEffect, useState } from "react";
// import { useAppSelector } from "@/hooks/useAppSelector";

// import { useDispatch } from "react-redux";
// import { persistor } from "@/store";
// import { logout } from "@/store/userSlice";

// export function NavUser({
//   user,
// }: {
//   user: {
//     name: string;
//     email: string;
//     avatar: string;
//   };
// }) {
//   const { isMobile } = useSidebar();
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(true);

//   const userRedux = useAppSelector((state) => state.user);
//   const dispatch = useDispatch();

//   const handleLogout = () => {
//     api
//       .get("/auth/logout", { withCredentials: true })
//       .then((res) => {
//         if (res.data.success === true) {
//           console.log("Logout successful");
//         }
//       })
//       .catch((err) => console.log(err));

//     const token = document.cookie
//       .split("; ")
//       .find((row) => row.startsWith("wms-auth-token="))
//       ?.split("=")[1];
//     console.log("Next Auth Token:", token);
//     if (token) {
//       document.cookie = `wms-auth-token=; path=/; max-age=0; secure; samesite=None`;
//       dispatch(logout());
//       persistor.purge().then(() => {
//         router.push("/auth/login");
//       });
//     }
//   };

//   return (
//     <SidebarMenu>
//       <SidebarMenuItem>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <SidebarMenuButton
//               size="lg"
//               className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
//             >
//               <Avatar className="h-8 w-8 rounded-lg">
//                 {user.avatar ? (
//                   <AvatarImage src={user.avatar} alt={user.name} />
//                 ) : (
//                   <AvatarFallback className="rounded-lg flex items-center justify-center bg-gray-200">
//                     <User className="h-4 w-4 text-gray-500" />
//                   </AvatarFallback>
//                 )}
//               </Avatar>
//               <div className="grid flex-1 text-left text-sm leading-tight">
//                 <span className="truncate font-semibold">{userRedux.name}</span>
//                 <span className="truncate text-xs">{userRedux.email}</span>
//               </div>
//               <ChevronsUpDown className="ml-auto size-4" />
//             </SidebarMenuButton>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent
//             className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
//             side={isMobile ? "bottom" : "right"}
//             align="end"
//             sideOffset={4}
//           >
//             <DropdownMenuItem>
//               <LogOut />
//               <button onClick={handleLogout}>Log Out</button>
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </SidebarMenuItem>
//     </SidebarMenu>
//   );
// }
