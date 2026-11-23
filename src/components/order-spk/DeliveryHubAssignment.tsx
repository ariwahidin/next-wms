
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Plus,
  RefreshCw,
  Warehouse,
  Pencil,
} from "lucide-react";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DetailItemFormPropsSPK } from "@/types/order-spk";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeliveryHub {
  ID: number;
  code: string;
  name: string;
  address: string;
  city: string;
  is_active: boolean;
}

interface Props extends DetailItemFormPropsSPK {
  disabled?: boolean;
}

interface DeliveryHubForm {
  name: string;
  address: string;
  city: string;
}

type DeliveryMode = "DIRECT" | "VIA_HUB";

const initialForm: DeliveryHubForm = {
  name: "",
  address: "",
  city: "",
};

export default function DeliveryHubAssignment({
  muatan,
  setMuatan,
  disabled = false,
}: Props) {
  const [hubs, setHubs] = useState<DeliveryHub[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [mode, setMode] = useState<DeliveryMode>("DIRECT");
  const [hubId, setHubId] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  // Add Hub Dialog
  const [openAddHub, setOpenAddHub] = useState(false);
  const [hubForm, setHubForm] = useState<DeliveryHubForm>(initialForm);
  const [formError, setFormError] = useState("");

  // =========================================================
  // FETCH DELIVERY HUB MASTER
  // =========================================================

  const fetchHubs = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const res = await api.get("/order/delivery-hubs", {
        withCredentials: true,
      });

      if (!res.data?.success) {
        throw new Error(
          res.data?.message || "Failed to load delivery hubs"
        );
      }

      setHubs(res.data.data || []);
    } catch (error: any) {
      setLoadError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load delivery hubs"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHubs();
  }, [fetchHubs]);

  // =========================================================
  // SELECTED HUB
  // =========================================================

  const selectedHub = useMemo(
    () => hubs.find((hub) => String(hub.ID) === hubId),
    [hubs, hubId]
  );

  // =========================================================
  // SUMMARY
  // =========================================================

  const viaHubCount = muatan.filter(
    (item) => item.delivery_mode === "VIA_HUB"
  ).length;

  const directCount = muatan.length - viaHubCount;

  const allSelected =
    muatan.length > 0 &&
    muatan.every((item) => selectedIds.includes(item.ID));

  // =========================================================
  // ADD DELIVERY HUB
  // =========================================================

  const handleOpenAddHub = () => {
    setHubForm(initialForm);
    setFormError("");
    setOpenAddHub(true);
  };

  const handleSaveHub = async () => {
    if (saving) return;

    const name = hubForm.name.trim();
    const address = hubForm.address.trim();
    const city = hubForm.city.trim();

    if (!name) {
      setFormError("Delivery Hub name is required.");
      return;
    }

    if (!city) {
      setFormError("City is required.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const res = await api.post(
        "/order/delivery-hubs",
        {
          name,
          address,
          city,
        },
        {
          withCredentials: true,
        }
      );

      if (!res.data?.success) {
        throw new Error(
          res.data?.message || "Failed to create Delivery Hub"
        );
      }

      // Reload master data after successful creation.
      const listRes = await api.get("/order/delivery-hubs", {
        withCredentials: true,
      });

      if (!listRes.data?.success) {
        throw new Error(
          "Delivery Hub was created, but the list could not be refreshed. Please refresh manually."
        );
      }

      const updatedHubs: DeliveryHub[] = listRes.data.data || [];
      setHubs(updatedHubs);

      // Try to get the new hub ID from the create response.
      const createdData = res.data.data;
      const createdId =
        createdData?.ID ??
        createdData?.id ??
        createdData?.ID?.ID;

      // Fallback: find by name and city.
      const newHub =
        updatedHubs.find(
          (hub) => createdId && hub.ID === Number(createdId)
        ) ||
        updatedHubs.find(
          (hub) =>
            hub.name.toLowerCase() === name.toLowerCase() &&
            hub.city.toLowerCase() === city.toLowerCase()
        );

      if (newHub) {
        setHubId(String(newHub.ID));
        setMode("VIA_HUB");
      }

      setOpenAddHub(false);
      setHubForm(initialForm);
      setMessage(
        newHub
          ? `${newHub.name} successfully created and selected.`
          : "Delivery Hub successfully created. Please select it from the list."
      );
    } catch (error: any) {
      setFormError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create Delivery Hub"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // SELECTION
  // =========================================================

  const toggleItem = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );

    setMessage("");
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(muatan.map((item) => item.ID));
    }

    setMessage("");
  };

  // =========================================================
  // APPLY DELIVERY ASSIGNMENT
  // =========================================================

  const applyAssignment = (applyToAll: boolean) => {
    if (disabled) return;

    if (muatan.length === 0) {
      setMessage("No DO available in this SPK.");
      return;
    }

    if (mode === "VIA_HUB" && !selectedHub) {
      setMessage("Please select a Delivery Hub first.");
      return;
    }

    if (!applyToAll && selectedIds.length === 0) {
      setMessage("Select at least one DO.");
      return;
    }

    const targetIds = applyToAll ? null : selectedIds;

    setMuatan((prev) =>
      prev.map((item) => {
        if (targetIds && !targetIds.includes(item.ID)) {
          return item;
        }

        if (mode === "DIRECT") {
          return {
            ...item,
            delivery_mode: "DIRECT",
            delivery_hub_id: null,
            delivery_hub_code: "",
            delivery_hub_name: "",
            delivery_hub_address: "",
            delivery_hub_city: "",
          };
        }

        return {
          ...item,
          delivery_mode: "VIA_HUB",
          delivery_hub_id: selectedHub!.ID,
          delivery_hub_code: selectedHub!.code,
          delivery_hub_name: selectedHub!.name,
          delivery_hub_address: selectedHub!.address,
          delivery_hub_city: selectedHub!.city,
        };
      })
    );

    const affectedCount = applyToAll
      ? muatan.length
      : selectedIds.length;

    setMessage(
      `${affectedCount} DO assigned to ${
        mode === "DIRECT"
          ? "Direct Delivery"
          : selectedHub!.name
      }.`
    );

    if (!applyToAll) {
      setSelectedIds([]);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <section className="space-y-4 rounded-lg border bg-white p-4">

        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-blue-50 p-2 text-blue-700">
              <Warehouse size={18} />
            </div>

            <div>
              <h3 className="text-sm font-semibold">
                Delivery Hub Assignment
              </h3>

              <p className="text-xs text-gray-500">
                Assign delivery route for each order in this manifest.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={fetchHubs}
              disabled={loading}
            >
              <RefreshCw
                size={14}
                className={`mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleOpenAddHub}
              disabled={disabled}
            >
              <Plus size={14} className="mr-2" />
              Add Delivery Hub
            </Button>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="text-xs text-gray-500">Total DO</p>
            <p className="text-xl font-semibold">{muatan.length}</p>
          </div>

          <div className="rounded-md border p-3">
            <p className="text-xs text-gray-500">Direct Delivery</p>
            <p className="text-xl font-semibold">{directCount}</p>
          </div>

          <div className="rounded-md border p-3">
            <p className="text-xs text-gray-500">Via Delivery Hub</p>
            <p className="text-xl font-semibold">{viaHubCount}</p>
          </div>
        </div>

        {/* ERROR */}
        {loadError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {/* ASSIGNMENT FORM */}
        <div className="grid grid-cols-1 items-end gap-2 md:grid-cols-[180px_1fr_auto_auto]">
          <div>
            <Label className="mb-1 block text-xs">
              Delivery Mode
            </Label>

            <select
              className="h-9 w-full rounded-md border bg-white px-3 text-sm"
              value={mode}
              disabled={disabled}
              onChange={(e) => {
                setMode(e.target.value as DeliveryMode);
                setMessage("");
              }}
            >
              <option value="DIRECT">Direct Delivery</option>
              <option value="VIA_HUB">Via Delivery Hub</option>
            </select>
          </div>

          <div>
            <Label className="mb-1 block text-xs">
              Delivery Hub
            </Label>

            <select
              className="h-9 w-full rounded-md border bg-white px-3 text-sm disabled:bg-gray-100"
              value={hubId}
              disabled={
                disabled ||
                mode !== "VIA_HUB" ||
                loading
              }
              onChange={(e) => {
                setHubId(e.target.value);
                setMessage("");
              }}
            >
              <option value="">Select Delivery Hub</option>

              {hubs.map((hub) => (
                <option key={hub.ID} value={hub.ID}>
                  {hub.code} - {hub.name} ({hub.city})
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={disabled || muatan.length === 0}
            onClick={() => applyAssignment(false)}
          >
            <Check size={14} className="mr-2" />
            Apply to Selected
          </Button>

          <Button
            type="button"
            disabled={disabled || muatan.length === 0}
            onClick={() => applyAssignment(true)}
          >
            <Check size={14} className="mr-2" />
            Apply to All
          </Button>
        </div>

        {/* SELECTED HUB INFO */}
        {mode === "VIA_HUB" && selectedHub && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs">
            <p className="font-semibold text-blue-900">
              {selectedHub.name} ({selectedHub.code})
            </p>

            <p className="text-blue-800">
              {selectedHub.address || "-"}
            </p>

            <p className="text-blue-800">
              {selectedHub.city}
            </p>
          </div>
        )}

        {message && (
          <p className="text-xs text-blue-700">{message}</p>
        )}

        {/* DO ASSIGNMENT TABLE */}
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[850px] text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="w-10 border p-2 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    disabled={disabled || muatan.length === 0}
                    onChange={toggleAll}
                  />
                </th>

                <th className="border p-2 text-left">
                  DO Number
                </th>

                <th className="border p-2 text-left">
                  Original Destination
                </th>

                <th className="border p-2 text-left">
                  Delivery Mode
                </th>

                <th className="border p-2 text-left">
                  Assigned Hub
                </th>
              </tr>
            </thead>

            <tbody>
              {muatan.map((item) => {
                const isViaHub = item.delivery_mode === "VIA_HUB";

                return (
                  <tr key={item.ID} className="hover:bg-gray-50">
                    <td className="border p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.ID)}
                        disabled={disabled}
                        onChange={() => toggleItem(item.ID)}
                      />
                    </td>

                    <td className="border p-2 font-medium">
                      {item.shipment_id || item.outbound_no}
                    </td>

                    <td className="border p-2">
                      <div className="font-medium">
                        {item.deliv_to_name || item.deliv_to || "-"}
                      </div>

                      <div className="text-gray-500">
                        {item.deliv_city || "-"}
                      </div>
                    </td>

                    <td className="border p-2">
                      {isViaHub ? (
                        <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">
                          VIA HUB
                        </span>
                      ) : (
                        <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">
                          DIRECT
                        </span>
                      )}
                    </td>

                    <td className="border p-2">
                      {isViaHub
                        ? `${item.delivery_hub_code || ""} - ${
                            item.delivery_hub_name || ""
                          }`
                        : "-"}
                    </td>
                  </tr>
                );
              })}

              {muatan.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center text-gray-500"
                  >
                    Add DO to this SPK before assigning a delivery route.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500">
          Original order destination is preserved. Delivery Hub is only a
          transit point before handover to the expedition company.
        </p>
      </section>

      {/* =====================================================
          ADD DELIVERY HUB DIALOG
      ===================================================== */}

      <Dialog open={openAddHub} onOpenChange={setOpenAddHub}>
        <DialogContent className="bg-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Delivery Hub</DialogTitle>

            <DialogDescription>
              Create a new Delivery Hub master record.
              Hub code will be generated automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">

            <div className="space-y-2">
              <Label htmlFor="hub-name">
                Delivery Hub Name <span className="text-red-500">*</span>
              </Label>

              <Input
                id="hub-name"
                placeholder="Example: Delivery Hub Palembang"
                value={hubForm.name}
                disabled={saving}
                onChange={(e) =>
                  setHubForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hub-address">
                Address
              </Label>

              <Input
                id="hub-address"
                placeholder="Enter full address"
                value={hubForm.address}
                disabled={saving}
                onChange={(e) =>
                  setHubForm((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hub-city">
                City <span className="text-red-500">*</span>
              </Label>

              <Input
                id="hub-city"
                placeholder="Example: Palembang"
                value={hubForm.city}
                disabled={saving}
                onChange={(e) =>
                  setHubForm((prev) => ({
                    ...prev,
                    city: e.target.value,
                  }))
                }
              />
            </div>

            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setOpenAddHub(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={saving}
              onClick={handleSaveHub}
            >
              {saving ? (
                <>
                  <RefreshCw size={14} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus size={14} className="mr-2" />
                  Save Delivery Hub
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
