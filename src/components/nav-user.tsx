/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { ChevronsUpDown, LogOut, User } from "lucide-react";

// import { LogOut } from "@/auth/log-out";

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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import api from "@/lib/api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/hooks/useAppSelector";

import { useDispatch } from "react-redux";
import { persistor } from "@/store";
import { logout } from "@/store/userSlice";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const userRedux = useAppSelector((state) => state.user);

  // const fetchUser = async () => {
  //   const response = await api.get("/user/profile", {
  //     withCredentials: true,
  //   });

  //   if (response.data.success === true) {
  //     const profile = response.data.data;
  //     user.name = profile.name;
  //     user.email = profile.email;
  //     user.avatar = profile.avatar;
  //     setIsLoading(false);
  //   }
  // };

  useEffect(() => {
    // fetchUser();
  }, []);

  // const handleLogout = () => {
  //   api
  //     .get("/logout", { withCredentials: true })
  //     .then((res) => {
  //       console.log(res);
  //       if (res.data.success === true) {
  //         router.push("/auth/login");
  //       }
  //     })
  //     .catch((err) => console.log(err));
  // };

  const dispatch = useDispatch();

  const handleLogout = () => {
    api
      .get("/logout", { withCredentials: true })
      .then((res) => {
        if (res.data.success === true) {
          // 1. Hapus user dari Redux state
          dispatch(logout());

          // 2. Hapus Redux Persist dari localStorage
          persistor.purge().then(() => {
            // 3. Redirect ke login
            router.push("/auth/login");
          });
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name} />
                ) : (
                  <AvatarFallback className="rounded-lg flex items-center justify-center bg-gray-200">
                    <User className="h-4 w-4 text-gray-500" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{userRedux.name}</span>
                <span className="truncate text-xs">{userRedux.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator /> */}
            <DropdownMenuItem>
              <LogOut />
              <button onClick={handleLogout}>Log Out</button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
