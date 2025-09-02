/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Product } from "@/types/item";

interface ItemSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  onApply?: (selectedItems: Product[]) => void;
  api?: any;
  selectedItems?: any[];
  mode?: "create" | "edit";
}

const ItemSelectionModal = ({
  isOpen,
  onClose,
  products = [],
  onApply,
  api,
  selectedItems = [],
  mode = "create",
}: ItemSelectionModalProps) => {
  const [items, setItems] = useState<Product[]>([]);
  const [filteredItems, setFilteredItems] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Initialize selected items when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log(
        "setSelectedItemIds:",
        selectedItems.map((item) => item.item_id)
      );
      setSelectedItemIds(selectedItems.map((item) => item.item_id));
      setSearchTerm(""); // Reset search term
    }
  }, [isOpen, selectedItems]);

  // Fetch items from API
  const fetchItems = async () => {
    console.log("products : ", products);
    setLoading(true);
    setItems(products);
    setFilteredItems(products);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

  // Filter items based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = items.filter(
        (item) =>
          (item.item_code?.toLowerCase() || "").includes(searchLower) ||
          (item.item_name?.toLowerCase() || "").includes(searchLower) ||
          (item.barcode?.toLowerCase() || "").includes(searchLower)
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, items]);

  const handleItemSelect = (itemId: string, isChecked: boolean) => {
    if (mode === "edit") {
      // Untuk edit mode, hanya boleh pilih satu item
      setSelectedItemIds(isChecked ? [itemId] : []);
    } else {
      // Untuk create mode, bisa pilih multiple
      setSelectedItemIds((prev) =>
        isChecked ? [...prev, itemId] : prev.filter((id) => id !== itemId)
      );
    }
  };

  const handleRowClick = (itemId: string) => {
    const isCurrentlySelected = selectedItemIds.includes(itemId);
    handleItemSelect(itemId, !isCurrentlySelected);
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (mode === "edit") {
      // Untuk edit mode, tidak ada select all
      return;
    }
    setSelectedItemIds(isChecked ? filteredItems.map((item) => item.ID) : []);
  };

  //   const handleApply = () => {

  //     const currentSelected = selectedItems.map((item) => item.item_id);

  //     console.log("Current Selected Items:", currentSelected);

  //     console.log("Applying selected items:", selectedItemIds);

  //     const selectedItemsData = items.filter((item) =>
  //       selectedItemIds.includes(item.ID)
  //     );

  //     console.log("Selected Items Data:", selectedItemsData);
  //     onApply(selectedItemsData);
  //     onClose();
  //   };

  const handleApply = () => {
    // ID yang sudah ada
    const currentSelectedIds = selectedItems.map((item) => item.item_id);

    console.log("Current Selected IDs:", currentSelectedIds);
    console.log("Applying selected items:", selectedItemIds);

    // Cari ID yang baru (belum ada di currentSelectedIds)
    // Cari ID baru (belum ada di currentSelectedIds)
    const newSelectedIds = selectedItemIds.filter(
      (item_id) => !currentSelectedIds.includes(String(item_id))
    );

    console.log("New Selected IDs:", newSelectedIds);

    // Ambil data lengkap berdasarkan ID baru saja
    const newSelectedItemsData = items.filter((item) =>
      newSelectedIds.includes(item.ID)
    );

    console.log("New Selected Items Data:", newSelectedItemsData);

    onApply(newSelectedItemsData);
    onClose();
  };

  const handleCancel = () => {
    setSelectedItemIds([]);
    setSearchTerm("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && selectedItemIds.length > 0) {
      handleApply();
    }
  };

  if (!isOpen) return null;

  const allSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedItemIds.includes(item.ID));

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {mode === "edit" ? "Edit Item Selection" : "Select Items"}
            {mode === "edit" && (
              <span className="text-sm text-gray-500 ml-2">
                (Select one item)
              </span>
            )}
          </h2>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X size={16} />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by item code, item name, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Loading items...</p>
            </div>
          ) : (
            <table
              className="w-full border text-sm"
              style={{ fontSize: "12px" }}
            >
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-2 border w-12">
                    {/* {mode !== "edit" && (
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    )} */}
                    #
                  </th>
                  <th className="p-2 border w-12">No.</th>
                  <th className="p-2 border">Item Code</th>
                  <th className="p-2 border">Item Name</th>
                  <th className="p-2 border">Barcode</th>
                  <th className="p-2 border w-20">UoM</th>
                  <th className="p-2 border w-20">Serial</th>
                  <th className="p-2 border">Group</th>
                  <th className="p-2 border">Category</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => {
                  const isSelected = selectedItemIds.includes(item.ID);
                  return (
                    <tr
                      key={item.ID}
                      className={`border-t cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-blue-50 border-blue-200" : ""
                      }`}
                      onClick={() => handleRowClick(item.ID)}
                    >
                      <td className="p-2 border text-center">
                        <input
                          type={mode === "edit" ? "radio" : "checkbox"}
                          name={mode === "edit" ? "selectedItem" : undefined}
                          checked={isSelected}
                          onChange={(e) =>
                            handleItemSelect(item.ID, e.target.checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="p-2 border text-center">{index + 1}</td>
                      <td className="p-2 border font-medium">
                        {item.item_code}
                      </td>
                      <td className="p-2 border">{item.item_name}</td>
                      <td className="p-2 border">{item.barcode}</td>
                      <td className="p-2 border text-center">{item.uom}</td>
                      <td className="p-2 border text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            item.has_serial === "Y"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.has_serial}
                        </span>
                      </td>
                      <td className="p-2 border">{item?.group}</td>
                      <td className="p-2 border">{item?.category}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? `No items found matching "${searchTerm}"`
                : "No items available"}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedItemIds.length} item
            {selectedItemIds.length !== 1 ? "s" : ""} selected
            {mode === "edit" && selectedItemIds.length > 1 && (
              <span className="text-orange-600 ml-2">
                (Only the first item will be applied in edit mode)
              </span>
            )}
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={selectedItemIds.length === 0}
              className="min-w-[100px]"
            >
              Apply ({selectedItemIds.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemSelectionModal;
