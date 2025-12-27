import { useState, useEffect } from "react";
import type { ItemPackaging, ItemCodeOption } from "@/types/itemPackaging";

interface ItemPackagingFormProps {
  item: ItemPackaging | null;
  itemCodeOptions: ItemCodeOption[];
  onSubmit: (data: Partial<ItemPackaging>) => void;
  onClose: () => void;
}

export function ItemPackagingForm({
  item,
  itemCodeOptions,
  onSubmit,
  onClose,
}: ItemPackagingFormProps) {
  const [formData, setFormData] = useState({
    item_code: "",
    uom: "",
    ean: "",
    length_cm: 0,
    width_cm: 0,
    height_cm: 0,
    net_weight_kg: 0,
    gross_weight_kg: 0,
    is_active: true,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        item_code: item.item_code,
        uom: item.uom,
        ean: item.ean,
        length_cm: item.length_cm,
        width_cm: item.width_cm,
        height_cm: item.height_cm,
        net_weight_kg: item.net_weight_kg,
        gross_weight_kg: item.gross_weight_kg,
        is_active: item.is_active,
      });
    }
  }, [item]);

  const handleItemCodeChange = (itemCode: string) => {
    const selectedOption = itemCodeOptions.find(
      (opt) => opt.item_code === itemCode
    );
    if (selectedOption) {
      setFormData({
        ...formData,
        item_code: selectedOption.item_code,
        uom: selectedOption.uom,
        ean: selectedOption.ean,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {item ? "Edit Item Packaging" : "Add New Item Packaging"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Code <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.item_code}
                onChange={(e) => handleItemCodeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Item Code</option>
                {itemCodeOptions.map((option) => (
                  <option key={option.item_code} value={option.item_code}>
                    {option.item_code} - {option.uom}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UOM <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.uom}
                  onChange={(e) =>
                    setFormData({ ...formData, uom: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  EAN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.ean}
                  onChange={(e) =>
                    setFormData({ ...formData, ean: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Dimensions (cm)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Length
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.length_cm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        length_cm: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Width
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.width_cm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        width_cm: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Height
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.height_cm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        height_cm: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Weight (kg)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Net Weight
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.net_weight_kg}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        net_weight_kg: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Gross Weight
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.gross_weight_kg}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gross_weight_kg: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="is_active"
                className="ml-2 text-sm text-gray-700"
              >
                Active
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {item ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}