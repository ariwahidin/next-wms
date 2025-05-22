"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AlertCircle, Boxes } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { setUser } from "@/store/userSlice";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error] = useState<string | null>(null);

  // const dispatch = useAppDispatch();

  // const handleLogin = (e) => {
  //   e.preventDefault();
  //   api
  //     .post(
  //       "/login",
  //       {
  //         email: username,
  //         password,
  //       },
  //       { withCredentials: true }
  //     )
  //     .then((res) => {
  //       if (res.data.success === true) {
  //         if (res.data.user.base_url === "/dashboard") {
  //           router.push("/home");
  //         } else {
  //           router.push("/mobile/home");
  //         }
  //       }
  //     })
  //     .catch((err) => console.log(err));
  // };

  const dispatch = useAppDispatch();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    api
      .post(
        "/login",
        {
          email: username,
          password,
        },
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data.success === true) {
          // Simpan user ke Redux
          dispatch(
            setUser({
              name: res.data.user.name,
              email: res.data.user.email,
              base_url: res.data.user.base_url,
              token: res.data.token,
              menus: res.data.menus,
            })
          );

          // Navigasi berdasarkan base_url
          if (res.data.user.base_url === "/dashboard") {
            router.push("/home");
          } else {
            router.push("/mobile/home");
          }
        }
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    api
      .get("/isLoggedIn", { withCredentials: true })
      .then((res) => {
        if (res.data.success === true) {
          window.location.href = "/home";
        }
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-7">
          {/* FORM SECTION */}
          <form className="p-6 md:p-8 col-span-3" onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <Boxes className="h-10 w-10" />
                <h4 className="text-2xl font-bold">
                  Warehouse Management System
                </h4>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </div>
          </form>

          {/* IMAGE CAROUSEL SECTION */}
          <div className="relative hidden md:block h-full w-full col-span-4">
            <Swiper
              pagination={{
                dynamicBullets: true,
              }}
              navigation={true}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              modules={[Pagination, Navigation, Autoplay]}
              className="h-full w-full"
            >
              <SwiperSlide>
                <Image
                  src="/images/wms_cover.jpeg"
                  alt="Hero Logistics 1"
                  className="object-cover w-full h-full brightness-75"
                  width={600}
                  height={300}
                />
              </SwiperSlide>
              <SwiperSlide>
                <Image
                  src="/images/tms_cover.jpeg"
                  alt="Hero Logistics 2"
                  className="object-cover w-full h-full brightness-75"
                  width={600}
                  height={600}
                />
              </SwiperSlide>
              <SwiperSlide>
                <Image
                  src="/images/gudang.jpg"
                  alt="Hero Logistics 3"
                  className="object-cover w-full h-full brightness-75"
                  width={600}
                  height={600}
                />
              </SwiperSlide>
            </Swiper>
          </div>
        </CardContent>
      </Card>

      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        PT Yusen Logistics Puninar Indonesia &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
