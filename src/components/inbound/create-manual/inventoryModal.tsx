/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Product } from "@/types/item";
import { useRouter } from "next/router";
import api from "@/lib/api";

interface ItemSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
}

interface ItemInventory {
  item_code: string;
  item_name: string;
  location : string;
  barcode : string;
  qty_in : number;
  qty_onhand : number;
  qty_allocated : number;
  qty_available : number;
  qty_out : number;
  cbm_pcs : number;
  cbm_total : number;
}

const InventoryModal = ({
  isOpen,
  onClose,
  products = [],
}: ItemSelectionModalProps) => {
  const [items, setItems] = useState<ItemInventory[]>([]);
  const [filteredItems, setFilteredItems] = useState<ItemInventory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const router = useRouter();
  const { no } = router.query;
  console.log("inbound_no", no);

  const fetchItems = async () => {
    console.log("GET INVENTORY FROM INBOUND NO : ", no);

    setLoading(true);
    const res = await api.get(`/inbound/inventory/${no}`);
    const products = res.data.data;
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

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = items.filter(
        (item) =>
          (item.location?.toLowerCase() || "").includes(searchLower) ||
          (item.item_code?.toLowerCase() || "").includes(searchLower) ||
          (item.item_name?.toLowerCase() || "").includes(searchLower) ||
          (item.barcode?.toLowerCase() || "").includes(searchLower)
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, items]);

  const handleCancel = () => {
    setSelectedItemIds([]);
    setSearchTerm("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            <span className="text-md text-gray-500 ml-2">
              Inventory from this inbound
            </span>
          </h2>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X size={16} />
          </Button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by location, item code, or barcode..."
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
                  <th className="p-2 border">Location</th>
                  <th className="p-2 border">Item Code</th>
                  <th className="p-2 border">Barcode</th>
                  {/* <th className="p-2 border w-20">Item Name</th> */}
                  <th className="p-2 border w-20">In</th>
                  <th className="p-2 border w-20">On Hand</th>
                  <th className="p-2 border w-20">Avail</th>
                  <th className="p-2 border w-20">Allocated</th>
                  <th className="p-2 border w-20">Out</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => {
                  return (
                    <tr
                      key={index}
                      className={`border-t cursor-pointer hover:bg-gray-50 transition-colors`}
                    >
                      <td className="p-2 border text-center">{index + 1}</td>
                      <td className="p-2 border font-medium">
                        {item.location}
                      </td>
                      <td className="p-2 border">{item.item_code}</td>
                      <td className="p-2 border">{item.barcode}</td>
                      {/* <td className="p-2 border text-center">{item.item_name}</td> */}
                      <td className="p-2 border text-center">{item.qty_in}</td>
                      <td className="p-2 border text-center">
                        {item.qty_onhand}
                      </td>
                      <td className="p-2 border text-center">
                        {item.qty_available}
                      </td>
                      <td className="p-2 border text-center">
                        {item.qty_allocated}
                      </td>
                      <td className="p-2 border text-center">
                        {item.qty_out}
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
            {filteredItems.length} item, total qty in {filteredItems.reduce(
              (total, item) => total + item.qty_in,
              0
            )}
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;
