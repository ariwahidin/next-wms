/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/picking/index.tsx
import { useEffect, useState } from "react";

export default function PickingListPage() {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    const data = localStorage.getItem("picking_records");
    if (data) {
      setRecords(JSON.parse(data));
    }
  }, []);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Picking Records</h1>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">#</th>
            <th className="border px-2 py-1">Outbound ID</th>
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Item Count</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec, index) => (
            <tr key={rec.id}>
              <td className="border px-2 py-1">{index + 1}</td>
              <td className="border px-2 py-1">{rec.outboundId}</td>
              <td className="border px-2 py-1">{rec.date}</td>
              <td className="border px-2 py-1">{rec.items.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
