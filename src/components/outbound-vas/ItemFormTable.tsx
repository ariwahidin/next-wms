/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select from "react-select";
import { Pencil, Trash, X } from "lucide-react";
import {
  CombinedOutboundProps,
  ItemFormProps,
  ItemOptions,
} from "@/types/outbound";
import { Product } from "@/types/item";
import api from "@/lib/api";
import ItemSelectionModal from "@/components/outbound/create-manual/ItemSelectionModal";
import { useRouter } from "next/router";

export default function ItemFormTable({
  muatan,
  setMuatan,
  headerForm,
  setHeaderForm,
}: CombinedOutboundProps) {
  const [vasItems, setVasItems] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vasPages, setVasPages] = useState<any[]>([]);
  const [vasOptions, setVasOptions] = useState<any[]>([]);
  const [itemCodeOptions, setItemCodeOptions] = useState<ItemOptions[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<{
    [id: number]: { [key: string]: string };
  }>({});
  const [defaultUoms, setDefaultUoms] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<ItemFormProps | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const router = useRouter();
  const { outbound_no } = router.query;
  console.log("outbound_no", outbound_no);


  useEffect(() => {
    if (outbound_no) {
      const fetchOutbound = async () => {
        try {
          const [vasItems, outboundDetail] = await Promise.all([
            api.get(`/outbound/${outbound_no}/vas-items`),
            api.get(`/outbound/${outbound_no}`),
          ])
          if (vasItems.data.success && outboundDetail.data.success) {
            setVasItems(vasItems.data.data);
            setMuatan(outboundDetail.data.data.items);
          }
        } catch (error) {
          console.error("Error fetching outbound:", error);
        }
      };
      fetchOutbound();
    }
  }, [outbound_no]);




  return (
    <div className="space-y-2">
      <h4 className="text-lg font-semibold">Summary Vas Items</h4>
      <table className="w-full border font-normal text-xs">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border w-12 text-center">No.</th>
            <th className="p-2 border" style={{ width: "300px" }}>
              Vas Name
            </th>
            <th className="p-2 border" style={{ width: "300px" }}>
              Is Koli
            </th>
            <th className="p-2 border" style={{ width: "150px" }}>
              Price
            </th>
            <th className="p-2 border" style={{ width: "100px" }}>
              Qty
            </th>
            <th className="p-2 border" style={{ width: "100px" }}>
              VAS Koli
            </th>
            <th className="p-2 border" style={{ width: "100px" }}>
              Total Price
            </th>
          </tr>
        </thead>
        <tbody>
          {vasItems.map((item, index) => {
            // cek apakah row pertama dari group qty_koli
            const isFirst =
              index === 0 || item.qty_koli !== vasItems[index - 1].qty_koli;

            // cek berapa panjang group qty_koli
            let rowSpan = 1;
            if (isFirst) {
              rowSpan = vasItems.filter(
                (x) => x.qty_koli === item.qty_koli
              ).length;
            }

            return (
              <tr key={item.ID} className="border-t">
                <td className="p-2 border text-center">{index + 1}</td>
                <td className="p-2 border">{item.main_vas_name}</td>
                <td className="p-2 border">{item.is_koli ? "YES" : "NO"}</td>
                <td className="p-2 border" style={{ textAlign: "right" }}>
                  {item.default_price}
                </td>
                <td className="p-2 border" style={{ textAlign: "center" }}>
                  {item.qty_item}
                </td>
                {/* hanya render qty_koli di baris pertama group */}
                {isFirst && (
                  <td
                    className="p-2 border"
                    style={{ textAlign: "center" }}
                    rowSpan={rowSpan}
                  >
                    {item.qty_koli}
                  </td>
                )}
                <td className="p-2 border" style={{ textAlign: "right" }}>
                  {item.total_price}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-semibold">
            <td className="p-2 border" colSpan={4}>
              Total
            </td>
            <td className="p-2 border" style={{ textAlign: "center" }}>{vasItems.reduce((acc, item) => acc + item.qty_item, 0)}</td>
            <td className="p-2 border"></td>
            <td
              className="p-2 border text-center"
              style={{ textAlign: "right" }}
            >
              {vasItems.reduce((acc, item) => acc + item.total_price, 0)}
            </td>
          </tr>
        </tfoot>
      </table>

      <h4 className="text-lg font-semibold" style={{ marginTop: "20px" }}>Outbound Detail</h4>
      <table className="w-full border font-normal text-xs">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border w-12 text-center">No.</th>
            <th className="p-2 border" style={{ width: "300px" }}>
              Item Code
            </th>
            <th className="p-2 border" style={{ width: "300px" }}>
              Barcode
            </th>
            <th className="p-2 border" style={{ width: "100px" }}>
              Qty
            </th>
            <th className="p-2 border" style={{ width: "180px" }}>
              Vas Name
            </th>
          </tr>
        </thead>
        <tbody>
          {muatan.map((item, index) => {

            return (
              <tr key={item.ID} className="border-t">
                <td className="p-2 border text-center">{index + 1}</td>
                <td className="p-2 border">{item.item_code}</td>
                <td className="p-2 border">{item.barcode}</td>
                <td className="p-2 border" style={{ textAlign: "center" }}>
                  {item.quantity}
                </td>
                <td className="p-2 border" style={{ textAlign: "left" }}>
                  {item.vas_name}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-semibold">
            <td className="p-2 border" colSpan={3}>
              Total
            </td>
            <td
              className="p-2 border text-center"
              style={{ textAlign: "right" }}
            >
              {muatan.reduce((acc, item) => acc + item.quantity, 0)}
            </td>
            <td className="p-2 border"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
