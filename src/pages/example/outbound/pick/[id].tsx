/* eslint-disable prefer-const */
// import { OutboundItem } from "@/types/example";
// import { useRouter } from "next/router";
// import { useState, useEffect } from "react";

// interface Outbound {
//   id: string;
//   items: OutboundItem[];
//   status: string;
// }

// export default function OutboundPickPage() {
//   const router = useRouter();
//   const { id } = router.query;

//   const [outbound, setOutbound] = useState<Outbound | null>(null);
//   const [pickedQtys, setPickedQtys] = useState<{ [key: string]: number }>({});
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!id) return;

//     // Ambil data outbound dari localStorage
//     const stored = localStorage.getItem("outbound_orders");
//     if (!stored) {
//       setLoading(false);
//       return;
//     }
//     const outbounds: Outbound[] = JSON.parse(stored);

//     // Cari outbound sesuai id
//     const found = outbounds.find((o) => o.id === id);
//     if (found) {
//       setOutbound(found);

//       // Init picked qty dengan 0
//       const initPicked: { [key: string]: number } = {};
//       found.items.forEach((item) => {
//         initPicked[item.productId] = 0;
//       });
//       setPickedQtys(initPicked);
//     }
//     setLoading(false);
//   }, [id]);

//   if (loading) return <div>Loading...</div>;
//   if (!outbound) return <div>Outbound with id "{id}" not found.</div>;

//   function handleChange(productId: string, value: string) {
//     let val = parseInt(value);
//     if (isNaN(val) || val < 0) val = 0;
//     const max =
//       outbound.items.find((i) => i.productId === productId)?.qty || 0;
//     if (val > max) val = max;

//     setPickedQtys((prev) => ({
//       ...prev,
//       [productId]: val,
//     }));
//   }

//   function handleSubmit() {
//     // Prepare record to save
//     const pickingRecord = {
//       id: crypto.randomUUID(),
//       outboundId: outbound.id,
//       date: new Date().toISOString().split("T")[0],
//       items: outbound.items.map((item) => ({
//         productId: item.productId,
//         qtyPicked: pickedQtys[item.productId] || 0,
//       })),
//     };

//     // Load existing picking records
//     const existing = localStorage.getItem("picking_records");
//     let pickingRecords = existing ? JSON.parse(existing) : [];
//     pickingRecords.push(pickingRecord);
//     localStorage.setItem("picking_records", JSON.stringify(pickingRecords));

//     alert("Picking saved!");
//     router.push("/outbound");
//   }

//   return (
//     <div className="max-w-3xl mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">
//         Picking for Outbound {outbound.id}
//       </h1>
//       <table className="min-w-full border border-gray-300">
//         <thead className="bg-gray-100">
//           <tr>
//             <th className="border border-gray-300 px-4 py-2 text-left">
//               Product
//             </th>
//             <th className="border border-gray-300 px-4 py-2 text-right">
//               Qty Order
//             </th>
//             <th className="border border-gray-300 px-4 py-2 text-right">
//               Qty Picked
//             </th>
//           </tr>
//         </thead>
//         <tbody>
//           {outbound.items.map((item) => (
//             <tr key={item.productId}>
//               <td className="border border-gray-300 px-4 py-2">
//                 {item.productId}
//               </td>
//               <td className="border border-gray-300 px-4 py-2 text-right">
//                 {item.qty}
//               </td>
//               <td className="border border-gray-300 px-4 py-2 text-right">
//                 <input
//                   type="number"
//                   min={0}
//                   max={item.qty}
//                   value={pickedQtys[item.productId]}
//                   onChange={(e) => handleChange(item.productId, e.target.value)}
//                   className="w-20 border rounded px-2 py-1 text-right"
//                 />
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       <button
//         onClick={handleSubmit}
//         className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//       >
//         Save Picking
//       </button>
//     </div>
//   );
// }

import { PutawayRecord } from "@/types/example"; // asumsi path benar
import { OutboundItem } from "@/types/example";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

interface Outbound {
  id: string;
  items: OutboundItem[];
  status: string;
}

export default function OutboundPickPage() {
  const router = useRouter();
  const { id } = router.query;

  const [outbound, setOutbound] = useState<Outbound | null>(null);
  const [putawayRecords, setPutawayRecords] = useState<PutawayRecord[]>([]);
  const [pickedQtys, setPickedQtys] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  // Hitung total qtyBaseUnit putaway per productId
  function getAvailableQty(productId: string): number {
    return putawayRecords.reduce((acc, record) => {
      const item = record.items.find((i) => i.productId === productId);
      if (item) return acc + item.qtyBaseUnit;
      return acc;
    }, 0);
  }

  // Opsional: Ambil semua lokasi yang ada per produk
  function getLocations(productId: string): string[] {
    const locations = new Set<string>();
    putawayRecords.forEach((record) => {
      record.items.forEach((item) => {
        if (item.productId === productId) {
          locations.add(item.location);
        }
      });
    });
    return Array.from(locations);
  }

  useEffect(() => {
    if (!id) return;

    // Load outbound orders
    const storedOutbound = localStorage.getItem("outbound_orders");
    if (!storedOutbound) {
      setLoading(false);
      return;
    }
    const outbounds: Outbound[] = JSON.parse(storedOutbound);
    const found = outbounds.find((o) => o.id === id);
    if (found) {
      setOutbound(found);

      const initPicked: { [key: string]: number } = {};
      found.items.forEach((item) => {
        initPicked[item.productId] = 0;
      });
      setPickedQtys(initPicked);
    }

    // Load putaway records
    const storedPutaway = localStorage.getItem("putaway_records");
    const putaways: PutawayRecord[] = storedPutaway
      ? JSON.parse(storedPutaway)
      : [];
    setPutawayRecords(putaways);

    setLoading(false);
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!outbound) return <div>Outbound with id {id} not found.</div>;

  function handleChange(productId: string, value: string) {
    let val = parseInt(value);
    if (isNaN(val) || val < 0) val = 0;

    const maxOrderQty =
      outbound.items.find((i) => i.productId === productId)?.qty || 0;
    const maxPutawayQty = getAvailableQty(productId);

    if (val > maxOrderQty) val = maxOrderQty;
    if (val > maxPutawayQty) val = maxPutawayQty;

    setPickedQtys((prev) => ({
      ...prev,
      [productId]: val,
    }));
  }

  function handleSubmit() {
    const pickingRecord = {
      id: crypto.randomUUID(),
      outboundId: outbound.id,
      date: new Date().toISOString().split("T")[0],
      items: outbound.items.map((item) => ({
        productId: item.productId,
        qtyPicked: pickedQtys[item.productId] || 0,
      })),
    };

    const existing = localStorage.getItem("picking_records");
    let pickingRecords = existing ? JSON.parse(existing) : [];
    pickingRecords.push(pickingRecord);
    localStorage.setItem("picking_records", JSON.stringify(pickingRecords));

    alert("Picking saved!");
    router.push("/example/outbound");
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Picking for Outbound {outbound.id}
      </h1>
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Product
            </th>
            <th className="border border-gray-300 px-4 py-2 text-right">
              Qty Order
            </th>
            <th className="border border-gray-300 px-4 py-2 text-right">
              Qty Available (Putaway)
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left">
              Locations
            </th>
            <th className="border border-gray-300 px-4 py-2 text-right">
              Qty Picked
            </th>
          </tr>
        </thead>
        <tbody>
          {outbound.items.map((item) => {
            const availableQty = getAvailableQty(item.productId);
            const locations = getLocations(item.productId).join(", ");
            return (
              <tr key={item.productId}>
                <td className="border border-gray-300 px-4 py-2">
                  {item.productId}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  {item.qty}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  {availableQty}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {locations}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    max={Math.min(item.qty, availableQty)}
                    value={pickedQtys[item.productId]}
                    onChange={(e) =>
                      handleChange(item.productId, e.target.value)
                    }
                    className="w-20 border rounded px-2 py-1 text-right"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        onClick={handleSubmit}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Save Picking
      </button>
    </div>
  );
}
