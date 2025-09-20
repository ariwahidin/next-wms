/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { MuatanOrderSPK } from "@/types/order-spk";

interface ItemSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: MuatanOrderSPK[];
  onApply?: (selectedItems: MuatanOrderSPK[]) => void;
  api?: any;
  selectedItems?: MuatanOrderSPK[];
  mode?: "create" | "edit";
}

const ItemSelectionModal = ({
  isOpen,
  onClose,
  items = [],
  onApply,
  selectedItems = [],
  mode = "create",
}: ItemSelectionModalProps) => {
  const [filteredItems, setFilteredItems] = useState<MuatanOrderSPK[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedOutboundNo, setSelectedOutboundNo] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      console.log("Data Order SPK:", items);
      console.log(
        "setSelectedItemIds:",
        selectedItems.map((item) => item.outbound_id)
      );
      setSelectedOutboundNo(selectedItems.map((item) => item.outbound_no));
      setSearchTerm("");
    }
  }, [isOpen, selectedItems]);

  //   const fetchItems = async () => {
  //     console.log("products : ", products);
  //     setLoading(true);
  //     setFilteredItems(products);
  //     setTimeout(() => {
  //       setLoading(false);
  //     }, 500);
  //   };

  //   useEffect(() => {
  //     if (isOpen) {
  //       fetchItems();
  //     }
  //   }, [isOpen]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = items.filter(
        (item) =>
          (item.outbound_no?.toLowerCase() || "").includes(searchLower) ||
          (item.shipment_id?.toLowerCase() || "").includes(searchLower) ||
          (item.deliv_to?.toLowerCase() || "").includes(searchLower) ||
          (item.deliv_to_name?.toLowerCase() || "").includes(searchLower) ||
          (item.deliv_address?.toLowerCase() || "").includes(searchLower) ||
          (item.deliv_city?.toLowerCase() || "").includes(searchLower)
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, items]);

  const handleItemSelect = (outbound_no: string, isChecked: boolean) => {
    if (mode === "edit") {
      setSelectedOutboundNo(isChecked ? [outbound_no] : []);
    } else {
      setSelectedOutboundNo((prev) =>
        isChecked
          ? [...prev, outbound_no]
          : prev.filter((no) => no !== outbound_no)
      );
    }
  };

  const handleRowClick = (outbound_no: string) => {
    console.log("Row Outbound No:", outbound_no);
    const isCurrentlySelected = selectedOutboundNo.includes(outbound_no);
    handleItemSelect(outbound_no, !isCurrentlySelected);
  };

  const handleApply = () => {

    console.log("items ; ", items);
    console.log("selectedItem:", selectedItems);
    console.log("selectedOutboundNo:", selectedOutboundNo);

    const currentSelectedOutboundNo = selectedItems.map((item) => item.outbound_no);

    // console.log("Current Selected IDs:", currentSelectedOutboundNo);
    // console.log("Applying selected items:", selectedOutboundNo);

    const newSelectedOutboundNo = selectedOutboundNo.filter(
      (no) => !currentSelectedOutboundNo.includes(no)
    );

    console.log("New Selected Outbound No:", newSelectedOutboundNo);

    const newSelectedItemsData = items.filter((item) =>
      newSelectedOutboundNo.includes(item.outbound_no)
    );

    console.log("New Selected Items Data:", newSelectedItemsData);

    onApply(newSelectedItemsData);
    onClose();
  };

  const handleCancel = () => {
    setSelectedOutboundNo([]);
    setSearchTerm("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && selectedOutboundNo.length > 0) {
      handleApply();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {mode === "edit" ? "Edit DO Item Selection" : "Select DO Items"}
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

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by picking no, DO, or Delivery To..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

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
                  <th className="p-2 border w-12">#</th>
                  <th className="p-2 border w-12">Picking No</th>
                  <th className="p-2 border">DO No</th>
                  <th className="p-2 border">Delivery To</th>
                  <th className="p-2 border">Delivery City</th>
                  {/* <th className="p-2 border">Total Koli</th> */}
                  <th className="p-2 border">Total Item</th>
                  <th className="p-2 border">Total Qty</th>
                  <th className="p-2 border">Total CBM</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => {
                  const isSelected = selectedOutboundNo.includes(item.outbound_no);
                  return (
                    <tr
                      key={item.outbound_no}
                      className={`border-t cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-blue-50 border-blue-200" : ""
                      }`}
                      onClick={() => handleRowClick(item.outbound_no)}
                    >
                      <td className="p-2 border text-center">
                        <input
                          type={mode === "edit" ? "radio" : "checkbox"}
                          name={mode === "edit" ? "selectedItem" : undefined}
                          checked={isSelected}
                          //   onChange={(e) =>
                          //     handleItemSelect(item.ID, e.target.checked)
                          //   }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="p-2 border font-medium">
                        {item.outbound_no}
                      </td>
                      <td className="p-2 border">{item.shipment_id}</td>
                      <td className="p-2 border">{item.deliv_to_name}</td>
                      <td className="p-2 border text-center">
                        {item.deliv_city}
                      </td>
                      {/* <td className="p-2 border text-center">
                        {item.qty_koli}
                      </td> */}
                      <td className="p-2 border text-center">
                        {item?.total_item}
                      </td>
                      <td className="p-2 border text-center">
                        {item?.total_qty}
                      </td>
                      <td className="p-2 border text-center">
                        {item?.total_cbm}
                      </td>
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

        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedOutboundNo.length} item
            {selectedOutboundNo.length !== 1 ? "s" : ""} selected
            {mode === "edit" && selectedOutboundNo.length > 1 && (
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
              disabled={selectedOutboundNo.length === 0}
              className="min-w-[100px]"
            >
              Apply ({selectedOutboundNo.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemSelectionModal;
