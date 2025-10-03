
import Layout from "@/components/layout";
import api from "@/lib/api";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

interface ItemData {
  id: number;
  item_name: string;
  item_code: string;
  category: string;
  serial_number: string;
}

export default function OutboundPage() {
  const router = useRouter();
  const { outbound_no } = router.query;
  const [items, setItems] = useState<ItemData[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    if (outbound_no) {
      fetchData(outbound_no as string);
    } else {
      return;
    }
  }, [outbound_no]);

  const fetchData = async (outbound_no: string) => {
    const res = await api.get(`/outbound/serial/${outbound_no}`);
    setItems(res.data.data?.items);
  };

  if (!outbound_no) return null;

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === items.length) {
      setSelected([]);
    } else {
      setSelected(items.map((item) => item.id));
    }
  };

  const handlePrint = () => {
    if (selected.length === 0) return;
    const query = selected.join(",");
    router.push(
      `/wms/outbound/waranty/print?outbound_no=${outbound_no}&ids=${query}`
    );
  };

  return (
    <Layout
      title="Outbound"
      titleLink="/wms/outbound/data"
      subTitle={`Print Waranty ${outbound_no}`}
    >
      <div className="p-4">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 text-center">
                <input
                  type="checkbox"
                  checked={selected.length === items.length && items.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="border px-2 py-1">Category</th>
              <th className="border px-2 py-1">Item Code</th>
              <th className="border px-2 py-1">Item Name</th>
              <th className="border px-2 py-1">Serial Number</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                  />
                </td>
                <td className="border px-2 py-1">{item.category}</td>
                <td className="border px-2 py-1">{item.item_code}</td>
                <td className="border px-2 py-1">{item.item_name}</td>
                <td className="border px-2 py-1">{item.serial_number}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={handlePrint}
          disabled={selected.length === 0}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white disabled:bg-gray-400"
        >
          Print Selected
        </button>
      </div>
    </Layout>
  );
}
