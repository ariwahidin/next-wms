/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { LogOut, Mail, Phone, User } from "lucide-react";
import BottomNavbar from "@/components/mobile/BottomNavbar";
import PageHeader from "@/components/mobile/PageHeader";
import { useAppSelector } from "@/hooks/useAppSelector";
import api from "@/lib/api";
import { persistor } from "@/store";
import { useRouter } from "next/router";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { logout } from "@/store/userSlice";

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const userRedux = useAppSelector((state) => state.user);
  const dispatch = useDispatch();

/**
 * Logs out the user by performing the following actions:
 * 1. Retrieves the authentication token from cookies.
 * 2. If the token exists, it deletes the token from cookies.
 * 3. Dispatches a logout action to remove the user from the Redux state.
 * 4. Clears the Redux Persist data from localStorage.
 * 5. Redirects the user to the login page.
 */

  const handleLogout = () => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("next-auth-token="))
      ?.split("=")[1];
    console.log("Next Auth Token:", token);
    if (token) {
      document.cookie = `next-auth-token=; path=/; max-age=0; secure; samesite=None`;
      // 1. Hapus user dari Redux state
      dispatch(logout());
      // 2. Hapus Redux Persist dari localStorage
      persistor.purge().then(() => {
        // 3. Redirect ke login
        router.push("/auth/login");
      });
    }
  };

  return (
    <>
      <PageHeader title="Akun Saya" showBackButton={false} />
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4 max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
              U
            </div>
            <div>
              <h2 className="text-lg font-semibold">{userRedux.name}</h2>
              <p className="text-sm text-gray-500">{userRedux.email}</p>
            </div>
          </div>
        </div>

        {/* <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <Mail className="text-gray-600 w-5 h-5" />
            <span className="text-sm text-gray-700">ujang@example.com</span>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="text-gray-600 w-5 h-5" />
            <span className="text-sm text-gray-700">+62 812-3456-7890</span>
          </div>
          <div className="flex items-center space-x-3">
            <User className="text-gray-600 w-5 h-5" />
            <span className="text-sm text-gray-700">Username: ujang123</span>
          </div>
        </div> */}

        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-xl flex justify-center items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
      <BottomNavbar />
    </>
  );
}
