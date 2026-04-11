"use client";

import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";

// ============================================================
// TYPES
// ============================================================

type Platform = {
  id: string;
  name: string;
  icon: string;
  color: string;
  available: boolean;
};

type SyncResult = {
  success: boolean;
  message: string;
  total_orders: number;
  synced: number;
  skipped: number;
  failed: number;
  outbound_nos: string[];
  skipped_orders: string[];
  errors: string[];
};

// ============================================================
// PLATFORMS CONFIG
// ============================================================

const PLATFORMS: Platform[] = [
  {
    id: "shopee",
    name: "Shopee",
    icon: "🛍️",
    color: "bg-orange-500 hover:bg-orange-600",
    available: true,
  },
  {
    id: "tokopedia",
    name: "Tokopedia",
    icon: "🟢",
    color: "bg-green-500 hover:bg-green-600",
    available: false,
  },
  {
    id: "lazada",
    name: "Lazada",
    icon: "🔵",
    color: "bg-blue-500 hover:bg-blue-600",
    available: false,
  },
  {
    id: "tiktok",
    name: "TikTok Shop",
    icon: "🎵",
    color: "bg-black hover:bg-gray-800",
    available: false,
  },
];

// ============================================================
// PROPS
// ============================================================

type SyncEcommerceModalProps = {
  open: boolean;
  onClose: () => void;
  onSyncSuccess?: (result: SyncResult) => void;
};

// ============================================================
// COMPONENT
// ============================================================

export default function SyncEcommerceModal({
  open,
  onClose,
  onSyncSuccess,
}: SyncEcommerceModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const isSyncingRef = useRef(false);

  const handleClose = () => {
    if (loading) return;
    setSelectedPlatform(null);
    setResult(null);
    onClose();
  };

  const handleSync = async () => {
    if (!selectedPlatform) return;
    if (isSyncingRef.current) return; // 🔒 GUARD double click

    isSyncingRef.current = true; // 🔒 LOCK
    setLoading(true);
    setResult(null);

    try {
      let endpoint = "";
      if (selectedPlatform === "shopee") {
        endpoint = "/outbound/shopee/sync";
      }

      eventBus.emit("loading", true);
      const res = await api.post(endpoint, {}, { withCredentials: true });
      const data: SyncResult = res.data;
      setResult(data);

      if (data.success) {
        if (data.synced > 0) {
          eventBus.emit("showAlert", {
            title: "Sync Berhasil!",
            description: `${data.synced} order dari ${selectedPlatform} berhasil masuk ke WMS`,
            type: "success",
          });
          onSyncSuccess?.(data);
        } else {
          eventBus.emit("showAlert", {
            title: "Tidak Ada Order Baru",
            description: `Semua order dari ${selectedPlatform} sudah tersync (skipped: ${data.skipped})`,
            type: "info",
          });
        }
      } else {
        eventBus.emit("showAlert", {
          title: "Sync Gagal",
          description: data.message,
          type: "error",
        });
      }
    } catch (err) {
      eventBus.emit("showAlert", {
        title: "Error",
        description: "Terjadi kesalahan saat sync",
        type: "error",
      });
      console.error(err);
    } finally {
      eventBus.emit("loading", false);
      setLoading(false);
      isSyncingRef.current = false; // 🔓 UNLOCK
    }
  };


  // const handleSync = async () => {
  //   if (!selectedPlatform) return;

  //   setLoading(true);
  //   setResult(null);

  //   try {
  //     const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

  //     let endpoint = "";
  //     if (selectedPlatform === "shopee") {
  //       endpoint = `${API_URL}/api/shopee/sync`;
  //     }



  //     const res = await fetch(endpoint, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${localStorage.getItem("token")}`,
  //       },
  //     });

  //     const data: SyncResult = await res.json();
  //     setResult(data);

  //     if (data.success) {
  //       if (data.synced > 0) {
  //         toast.success(`Berhasil sync ${data.synced} order dari ${selectedPlatform}`);
  //         onSyncSuccess?.(data);
  //       } else {
  //         toast.info("Tidak ada order baru dari " + selectedPlatform);
  //       }
  //     } else {
  //       toast.error("Sync gagal: " + data.message);
  //     }
  //   } catch (err) {
  //     toast.error("Terjadi kesalahan saat sync");
  //     console.error(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Sync E-Commerce Orders</DialogTitle>
        </DialogHeader>

        {/* Platform Selection */}
        {!result && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pilih platform untuk sync order ke WMS
            </p>

            <div className="grid grid-cols-2 gap-3">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  disabled={!platform.available || loading}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`
                    relative flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all
                    ${!platform.available ? "opacity-40 cursor-not-allowed border-gray-200" : "cursor-pointer"}
                    ${selectedPlatform === platform.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  <span className="text-2xl">{platform.icon}</span>
                  <span className="text-sm font-medium">{platform.name}</span>
                  {!platform.available && (
                    <span className="absolute top-1 right-1 text-[10px] bg-gray-200 text-gray-500 rounded px-1">
                      Soon
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedPlatform || loading || isSyncingRef.current}
                onClick={handleSync}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Syncing...
                  </span>
                ) : (
                  "Sync Sekarang"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">{result.synced}</div>
                <div className="text-xs text-green-600">Synced</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
                <div className="text-xs text-yellow-600">Skipped</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-xs text-red-600">Failed</div>
              </div>
            </div>

            {/* Outbound Numbers */}
            {result.outbound_nos?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Outbound dibuat:
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.outbound_nos.map((no) => (
                    <span
                      key={no}
                      className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                    >
                      {no}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-500 mb-1">Error:</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setResult(null);
                  setSelectedPlatform(null);
                }}
              >
                Sync Lagi
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Selesai
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
