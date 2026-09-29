
"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import useSWR from "swr";
import {
  Package,
  Plus,
  Trash2,
  X,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import Select from "react-select";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  ID: number;
  item_code: string;
  item_name: string;
  owner_code?: string;
  category?: string;
  uom?: string;
  is_bundle?: string;
}

interface BundleItem {
  item_id: number;
  item_code: string;
  item_name: string;
  qty: number;
}

interface ProductBundleModalProps {
  product: Product | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSaved?: () => void;
}

interface ProductOption {
  value: number;
  label: string;
  item_code: string;
  item_name: string;
  uom?: string;
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  api.get(url).then((res) => {
    if (res.data.success) {
      return res.data.data;
    }

    return [];
  });

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProductBundleModal({
  product,
  open,
  setOpen,
  onSaved,
}: ProductBundleModalProps) {
  const {
    data: products,
    isLoading: productsLoading,
  } = useSWR<Product[]>("/products", fetcher, {
    revalidateOnFocus: false,
  });

  // ─── State ──────────────────────────────────────────────

  const [selectedProduct, setSelectedProduct] =
    useState<ProductOption | null>(null);

  const [qty, setQty] = useState<string>("1");

  const [items, setItems] = useState<BundleItem[]>([]);

  const [loadingBundle, setLoadingBundle] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [loadedBundle, setLoadedBundle] =
    useState(false);

  // ─── Product options ───────────────────────────────────

  const productOptions = useMemo<ProductOption[]>(() => {
    if (!products || !product) {
      return [];
    }

    return products
      .filter((item) => {
        // Don't allow current bundle itself
        if (Number(item.ID) === Number(product.ID)) {
          return false;
        }

        // Don't allow another bundle as component
        if (item.is_bundle === "Y") {
          return false;
        }

        return true;
      })
      .map((item) => ({
        value: item.ID,
        label: `${item.item_code} - ${item.item_name}`,
        item_code: item.item_code,
        item_name: item.item_name,
        uom: item.uom,
      }));
  }, [products, product]);

  // ─── Reset state ────────────────────────────────────────

  const resetState = () => {
    setSelectedProduct(null);
    setQty("1");
    setItems([]);
    setError("");
    setLoadedBundle(false);
    setLoadingBundle(false);
    setSaving(false);
  };

  // ─── Load existing bundle ──────────────────────────────

  useEffect(() => {
    if (!open || !product?.ID) {
      return;
    }

    let cancelled = false;

    const loadBundle = async () => {
      setLoadingBundle(true);
      setError("");
      setLoadedBundle(false);

      try {
        const res = await api.get(
          `/products/bundles/${product.ID}`,
          {
            withCredentials: true,
          }
        );

        if (cancelled) {
          return;
        }

        if (
          res.data?.success &&
          res.data?.data
        ) {
          const data = res.data.data;

          /*
           * Expected response:
           *
           * {
           *   success: true,
           *   data: {
           *     bundle: {...},
           *     items: [...]
           *   }
           * }
           */

          const bundleItems =
            Array.isArray(data.items)
              ? data.items
              : [];

          setItems(
            bundleItems.map((item: any) => ({
              item_id: Number(
                item.item_id ?? item.ItemId
              ),

              item_code:
                item.item_code ??
                item.ItemCode ??
                "",

              item_name:
                item.item_name ??
                item.ItemName ??
                "",

              qty: Number(
                item.qty ?? item.Qty ?? 0
              ),
            }))
          );
        } else {
          setItems([]);
        }
      } catch (err: any) {
        if (cancelled) {
          return;
        }

        /*
         * 404 usually means the bundle configuration
         * does not exist yet.
         *
         * That is not an error for this modal.
         */
        if (err?.response?.status === 404) {
          setItems([]);
        } else {
          setError(
            err?.response?.data?.error ||
              "Failed to load bundle configuration."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingBundle(false);
          setLoadedBundle(true);
        }
      }
    };

    loadBundle();

    return () => {
      cancelled = true;
    };
  }, [open, product?.ID]);

  // ─── Reset when closed ─────────────────────────────────

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  // ─── Add component ─────────────────────────────────────

  const handleAddItem = () => {
    setError("");

    if (!selectedProduct) {
      setError("Please select a component item.");
      return;
    }

    const parsedQty = Number(qty);

    if (
      !Number.isFinite(parsedQty) ||
      parsedQty <= 0
    ) {
      setError("Quantity must be greater than 0.");
      return;
    }

    // Prevent duplicate item
    const alreadyExists = items.some(
      (item) =>
        Number(item.item_id) ===
        Number(selectedProduct.value)
    );

    if (alreadyExists) {
      setError(
        `${selectedProduct.item_code} is already added to this bundle.`
      );
      return;
    }

    const newItem: BundleItem = {
      item_id: selectedProduct.value,
      item_code: selectedProduct.item_code,
      item_name: selectedProduct.item_name,
      qty: parsedQty,
    };

    setItems((prev) => [...prev, newItem]);

    setSelectedProduct(null);
    setQty("1");
  };

  // ─── Remove component ──────────────────────────────────

  const handleRemoveItem = (itemId: number) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          Number(item.item_id) !== Number(itemId)
      )
    );
  };

  // ─── Save bundle ────────────────────────────────────────

  const handleSave = async () => {
    if (!product?.ID) {
      return;
    }

    setError("");

    if (items.length === 0) {
      setError(
        "Bundle must contain at least one component item."
      );
      return;
    }

    // Validate all quantities
    const invalidQty = items.some(
      (item) =>
        !Number.isFinite(Number(item.qty)) ||
        Number(item.qty) <= 0
    );

    if (invalidQty) {
      setError(
        "All component quantities must be greater than 0."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        bundle_product_id: product.ID,

        items: items.map((item) => ({
          item_id: item.item_id,
          qty: Number(item.qty),
        })),
      };

      /*
       * First check whether configuration already exists.
       *
       * GET /products/bundles/:id
       */

      let exists = false;

      try {
        const checkRes = await api.get(
          `/products/bundles/${product.ID}`,
          {
            withCredentials: true,
          }
        );

        exists =
          checkRes.data?.success === true &&
          !!checkRes.data?.data;
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          throw err;
        }

        exists = false;
      }

      // ─────────────────────────────────────────────
      // UPDATE
      // ─────────────────────────────────────────────

      if (exists) {
        await api.put(
          `/products/bundles/${product.ID}`,
          {
            items: payload.items,
          },
          {
            withCredentials: true,
          }
        );
      }

      // ─────────────────────────────────────────────
      // CREATE
      // ─────────────────────────────────────────────

      else {
        await api.post(
          "/products/bundles",
          payload,
          {
            withCredentials: true,
          }
        );
      }

      onSaved?.();

      setOpen(false);
    } catch (err: any) {
      console.error(
        "Save bundle error:",
        err
      );

      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to save bundle configuration."
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── Modal close ────────────────────────────────────────

  const handleClose = () => {
    if (saving) {
      return;
    }

    setOpen(false);
  };

  // ─── Render ─────────────────────────────────────────────

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* ─────────────────────────────────────────────── */}
        {/* Header */}
        {/* ─────────────────────────────────────────────── */}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
              <Package className="h-5 w-5 text-slate-700" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Configure Bundle
              </h2>

              {product && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {product.item_code}{" "}
                  <span className="text-slate-300">
                    •
                  </span>{" "}
                  {product.item_name}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ─────────────────────────────────────────────── */}
        {/* Body */}
        {/* ─────────────────────────────────────────────── */}

        <div className="p-5">
          {/* Bundle info */}
          <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Bundle SKU
                </div>

                <div className="mt-1 text-sm font-medium text-slate-700">
                  {product?.item_code || "-"}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Bundle Name
                </div>

                <div className="mt-1 truncate text-sm font-medium text-slate-700">
                  {product?.item_name || "-"}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Components
                </div>

                <div className="mt-1 text-sm font-medium text-slate-700">
                  {items.length}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </div>

                <div className="mt-1">
                  <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    BUNDLE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loadingBundle && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading bundle configuration...
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

              <span>{error}</span>
            </div>
          )}

          {/* ───────────────────────────────────────────── */}
          {/* Add Component */}
          {/* ───────────────────────────────────────────── */}

          <div className="mb-5 rounded-lg border border-slate-200">
            <div className="border-b border-slate-100 px-4 py-2.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Add Component Item
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_120px_auto]">
              {/* Product */}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-500">
                  Item
                </label>

                <Select
                  options={productOptions}
                  value={selectedProduct}
                  onChange={(value) =>
                    setSelectedProduct(
                      value as ProductOption | null
                    )
                  }
                  isLoading={productsLoading}
                  isDisabled={
                    productsLoading ||
                    loadingBundle ||
                    saving
                  }
                  isClearable
                  placeholder="Select component..."
                  className="text-sm"
                  classNamePrefix="bundle-select"
                  menuPortalTarget={
                    typeof document !==
                    "undefined"
                      ? document.body
                      : undefined
                  }
                  styles={{
                    menuPortal: (base) => ({
                      ...base,
                      zIndex: 9999,
                    }),

                    control: (base) => ({
                      ...base,
                      minHeight: 36,
                      borderColor:
                        "#e2e8f0",
                      boxShadow: "none",
                      fontSize: 13,
                    }),

                    option: (
                      base,
                      state
                    ) => ({
                      ...base,
                      fontSize: 13,
                      backgroundColor:
                        state.isSelected
                          ? "#f1f5f9"
                          : state.isFocused
                          ? "#f8fafc"
                          : "white",
                      color: "#334155",
                    }),
                  }}
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-500">
                  Quantity
                </label>

                <input
                  type="number"
                  min="0.0001"
                  step="any"
                  value={qty}
                  disabled={
                    loadingBundle || saving
                  }
                  onChange={(e) =>
                    setQty(e.target.value)
                  }
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200 disabled:bg-slate-50"
                />
              </div>

              {/* Add button */}
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleAddItem}
                  disabled={
                    loadingBundle ||
                    saving ||
                    !selectedProduct
                  }
                  className="h-9 w-full sm:w-auto"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────── */}
          {/* Component List */}
          {/* ───────────────────────────────────────────── */}

          <div className="rounded-lg border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Bundle Components
              </div>

              <div className="text-[11px] text-slate-400">
                {items.length} item
                {items.length !== 1
                  ? "s"
                  : ""}
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex min-h-[150px] items-center justify-center px-4">
                <div className="text-center">
                  <Package className="mx-auto mb-2 h-7 w-7 text-slate-300" />

                  <p className="text-sm text-slate-400">
                    No component items
                  </p>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Add items above to define this
                    bundle.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="w-12 px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        No.
                      </th>

                      <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Item Code
                      </th>

                      <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Item Name
                      </th>

                      <th className="w-28 px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Qty
                      </th>

                      <th className="w-16 px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map(
                      (item, index) => (
                        <tr
                          key={item.item_id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                        >
                          <td className="px-4 py-2.5 text-center text-xs text-slate-400">
                            {index + 1}
                          </td>

                          <td className="px-4 py-2.5">
                            <span className="font-medium text-slate-700">
                              {item.item_code}
                            </span>
                          </td>

                          <td className="px-4 py-2.5">
                            <span className="text-slate-600">
                              {item.item_name}
                            </span>
                          </td>

                          <td className="px-4 py-2.5 text-right">
                            <span className="font-semibold text-slate-700">
                              {item.qty}
                            </span>
                          </td>

                          <td className="px-4 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveItem(
                                  item.item_id
                                )
                              }
                              disabled={saving}
                              title="Remove"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────── */}
        {/* Footer */}
        {/* ─────────────────────────────────────────────── */}

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
          <div className="text-[11px] text-slate-400">
            Components will be consumed from
            inventory when the bundle is processed.
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
              className="h-8"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={
                saving ||
                loadingBundle ||
                !loadedBundle ||
                items.length === 0
              }
              className="h-8"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save Bundle
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}