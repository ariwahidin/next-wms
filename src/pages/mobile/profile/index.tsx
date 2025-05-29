"use client";

import { LogOut, Mail, Phone, User } from "lucide-react";
import BottomNavbar from "@/components/mobile/BottomNavbar";
import PageHeader from "@/components/mobile/PageHeader";

export default function ProfilePage() {
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
              <h2 className="text-lg font-semibold">Ujang Saputra</h2>
              <p className="text-sm text-gray-500">Warehouse Staff</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
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
        </div>

        <div className="mt-6">
          <button className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-xl flex justify-center items-center space-x-2">
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
      <BottomNavbar />
    </>
  );
}
