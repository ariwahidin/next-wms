"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";

type PickupTimeSlot = {
  date: string;
  time_text: string;
  pickup_time_id: string;
};

type AddressItem = {
  address_id: number;
  address: string;
  city: string;
  pickup_time_list: PickupTimeSlot[];
};

type BranchItem = {
  branch_id: number;
  branch_name: string;
  address: string;
  city: string;
};

type ShippingParam = {
  method: "pickup" | "dropoff" | "non_integrated";
  response: {
    pickup?: {
      address_list?: AddressItem[];
    };
    dropoff?: {
      branch_list?: BranchItem[];
    };
  };
};

type ArrangeShipmentModalProps = {
  open: boolean;
  orderSN: string;
  outboundNo: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ArrangeShipmentModal({
  open,
  orderSN,
  outboundNo,
  onClose,
  onSuccess,
}: ArrangeShipmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [param, setParam] = useState<ShippingParam | null>(null);
  const [error, setError] = useState("");

  const [selectedAddressID, setSelectedAddressID] = useState<number | null>(null);
  const [selectedTimeID, setSelectedTimeID] = useState("");
  const [selectedBranchID, setSelectedBranchID] = useState<number | null>(null);

  const isSubmittingRef = useRef(false);

  // Safe list helpers
  const addressList: AddressItem[] = param?.response?.pickup?.address_list ?? [];
  const branchList: BranchItem[]   = param?.response?.dropoff?.branch_list ?? [];
  const selectedAddress             = addressList.find((a) => a.address_id === selectedAddressID);
  const timeSlotList: PickupTimeSlot[] = selectedAddress?.pickup_time_list ?? [];

  useEffect(() => {
    if (!open || !orderSN) return;

    const fetchParam = async () => {
      setLoading(true);
      setError("");
      setParam(null);
      setSelectedAddressID(null);
      setSelectedTimeID("");
      setSelectedBranchID(null);

      try {
        const res = await api.get(`/outbound/shopee/shipping-param/${orderSN}`, {
          withCredentials: true,
        });

        if (res.data.success) {
          setParam(res.data);

          const addrList: AddressItem[] = res.data.response?.pickup?.address_list ?? [];
          if (res.data.method === "pickup" && addrList.length > 0) {
            setSelectedAddressID(addrList[0].address_id);
          }

          const brnList: BranchItem[] = res.data.response?.dropoff?.branch_list ?? [];
          if (res.data.method === "dropoff" && brnList.length > 0) {
            setSelectedBranchID(brnList[0].branch_id);
          }
        } else {
          setError(res.data.message || "Gagal mengambil shipping parameter");
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchParam();
  }, [open, orderSN]);

  const handleClose = () => {
    if (submitting) return;
    setParam(null);
    setError("");
    setSelectedAddressID(null);
    setSelectedTimeID("");
    setSelectedBranchID(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current || !param) return;

    if (param.method === "pickup") {
      if (!selectedAddressID) {
        eventBus.emit("showAlert", { title: "Error", description: "Pilih alamat pickup", type: "error" });
        return;
      }
      if (!selectedTimeID) {
        eventBus.emit("showAlert", { title: "Error", description: "Pilih waktu pickup", type: "error" });
        return;
      }
    }

    if (param.method === "dropoff" && !selectedBranchID) {
      eventBus.emit("showAlert", { title: "Error", description: "Pilih lokasi dropoff", type: "error" });
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);
    eventBus.emit("loading", true);

    try {
      const payload: any = {
        order_sn: orderSN,
        method: param.method,
      };

      if (param.method === "pickup") {
        payload.address_id    = selectedAddressID;
        payload.pickup_time_id = selectedTimeID;
      } else if (param.method === "dropoff") {
        payload.branch_id = selectedBranchID;
      }

      const res = await api.post("/outbound/shopee/init-shipment", payload, {
        withCredentials: true,
      });

      if (res.data.success) {
        eventBus.emit("showAlert", {
          title: "Berhasil!",
          description: `Arrange shipment untuk order ${orderSN} berhasil`,
          type: "success",
        });
        onSuccess();
        handleClose();
      } else {
        eventBus.emit("showAlert", {
          title: "Gagal",
          description: res.data.message,
          type: "error",
        });
      }
    } catch (err: any) {
      eventBus.emit("showAlert", {
        title: "Error",
        description: err?.response?.data?.message || "Terjadi kesalahan",
        type: "error",
      });
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
      eventBus.emit("loading", false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Arrange Shipment</DialogTitle>
          <p className="text-xs text-muted-foreground">Order SN: {orderSN}</p>
        </DialogHeader>

        {/* Loading */}
        {loading && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Mengambil opsi pengiriman...
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="py-4 text-sm text-red-500 bg-red-50 rounded p-3 text-center">
            {error}
          </div>
        )}

        {/* Pickup */}
        {!loading && param?.method === "pickup" && (
          <div className="space-y-4">
            <p className="text-sm font-medium">🚚 Metode: Pickup (Kurir Jemput)</p>

            <div>
              <label className="text-xs text-muted-foreground">Alamat Pickup</label>
              <select
                className="w-full mt-1 border rounded px-3 py-2 text-sm"
                value={selectedAddressID ?? ""}
                onChange={(e) => {
                  setSelectedAddressID(Number(e.target.value));
                  setSelectedTimeID("");
                }}
              >
                {addressList.length === 0 && (
                  <option value="">Tidak ada alamat tersedia</option>
                )}
                {addressList.map((addr) => (
                  <option key={addr.address_id} value={addr.address_id}>
                    {addr.address}, {addr.city}
                  </option>
                ))}
              </select>
            </div>

            {selectedAddress && (
              <div>
                <label className="text-xs text-muted-foreground">Waktu Pickup</label>
                <select
                  className="w-full mt-1 border rounded px-3 py-2 text-sm"
                  value={selectedTimeID}
                  onChange={(e) => setSelectedTimeID(e.target.value)}
                >
                  <option value="">-- Pilih Waktu --</option>
                  {timeSlotList.map((slot) => (
                    <option key={slot.pickup_time_id} value={slot.pickup_time_id}>
                      {slot.date} — {slot.time_text}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Dropoff */}
        {!loading && param?.method === "dropoff" && (
          <div className="space-y-4">
            <p className="text-sm font-medium">📦 Metode: Dropoff (Antar ke Counter)</p>
            <div>
              <label className="text-xs text-muted-foreground">Pilih Lokasi Counter</label>
              <select
                className="w-full mt-1 border rounded px-3 py-2 text-sm"
                value={selectedBranchID ?? ""}
                onChange={(e) => setSelectedBranchID(Number(e.target.value))}
              >
                {branchList.length === 0 && (
                  <option value="">Tidak ada lokasi tersedia</option>
                )}
                {branchList.map((branch) => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.branch_name} — {branch.address}, {branch.city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Non Integrated */}
        {!loading && param?.method === "non_integrated" && (
          <div className="py-4 text-sm text-center text-muted-foreground bg-gray-50 rounded p-3">
            Pengiriman ini tidak memerlukan konfigurasi tambahan.
          </div>
        )}

        {/* Footer */}
        {!loading && (param || error) && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={submitting}
            >
              Batal
            </Button>
            {param && (
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Memproses..." : "Konfirmasi"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}