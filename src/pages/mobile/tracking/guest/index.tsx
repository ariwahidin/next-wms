// "use client";

// import { useEffect, useState } from "react";
// import { Input } from "@/components/ui/input";
// import PageHeader from "@/components/mobile/PageHeader";
// import { Button } from "@/components/ui/button";
// import guestApi from "@/lib/guestApi";
// import OrderCard from "@/components/mobile/shipping/tracking/OrderCard";

// interface OrderItem {
//   ID: number;
//   order_no: string;
//   transporter: string;
//   status: "fully received" | "partial" | "open";
// }

// export default function GuestListOrderPage() {
//   const [search, setSearch] = useState("");
//   const [listOrder, setListOrder] = useState<OrderItem[]>([]);

//   const filtered = listOrder.filter(
//     (item) =>
//       item.order_no.toLowerCase().includes(search.toLowerCase()) ||
//       item.transporter.toLowerCase().includes(search.toLowerCase())
//   );

//   const fetchData = async (spk: string) => {
//     try {
//       const response = await guestApi.get(`/shipping/open/${spk}`);
//       const data = await response.data;

//       if (data.data === null) {
//         return;
//       }
//       setListOrder(data.data);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     }
//   };

//   return (
//     <>
//       <PageHeader title="List Order" showBackButton />
//       <div className="min-h-screen pb-20 px-4 pt-4 bg-gray-50">
//         <div className="space-y-1">
//           <Input
//             placeholder="Search SPK No"
//             type="text"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="mb-4"
//           />

//           <Button className="w-full" onClick={() => fetchData(search)}>
//             Search
//           </Button>
//         </div>

//         <div className="space-y-3 mt-4">
//           {filtered.length > 0 ? (
//             filtered.map((item: OrderItem) => (
//               <OrderCard key={item.ID} data={item} />
//             ))
//           ) : (
//             <p className="text-center text-gray-500">Data not found</p>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/mobile/PageHeader";
import { Button } from "@/components/ui/button";
import guestApi from "@/lib/guestApi";
import OrderCard from "@/components/mobile/shipping/tracking/OrderCard";

interface OrderItem {
  ID: number;
  order_no: string;
  transporter: string;
  status: "fully received" | "partial" | "open";
}

export default function GuestListOrderPage() {
  const searchParams = useSearchParams();
  const spkParam = searchParams.get("spk") || "";

  const [search, setSearch] = useState(spkParam);
  const [listOrder, setListOrder] = useState<OrderItem[]>([]);

  const filtered = listOrder.filter(
    (item) =>
      item.order_no.toLowerCase().includes(search.toLowerCase()) ||
      item.transporter.toLowerCase().includes(search.toLowerCase())
  );

  const fetchData = async (spk: string) => {
    try {
      const response = await guestApi.get(`/shipping/open/${spk}`);
      const data = await response.data;

      if (data.data === null) {
        setListOrder([]); // pastikan kosong jika tidak ada
        return;
      }
      setListOrder(data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (spkParam) {
      fetchData(spkParam);
    }
  }, [spkParam]);

  return (
    <>
      <PageHeader title="List Order" showBackButton />
      <div className="min-h-screen pb-20 px-4 pt-4 bg-gray-50">
        <div className="space-y-1">
          <Input
            placeholder="Search SPK No"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />

          <Button className="w-full" onClick={() => fetchData(search)}>
            Search
          </Button>
        </div>

        <div className="space-y-3 mt-4">
          {filtered.length > 0 ? (
            filtered.map((item: OrderItem) => (
              <OrderCard key={item.ID} data={item} />
            ))
          ) : (
            <p className="text-center text-gray-500">Data not found</p>
          )}
        </div>
      </div>
    </>
  );
}
