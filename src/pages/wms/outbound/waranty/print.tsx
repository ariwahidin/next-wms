/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import api from "@/lib/api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface ItemData {
  id: number;
  category: string;
  item_name: string;
  item_code: string;
  serial_number: string;
}

export default function PrintPage() {
  const router = useRouter();
  const { outbound_no, ids } = router.query;
  const [items, setItems] = useState<ItemData[]>([]);

//   useEffect(() => {
//     if (!ids) return;
//     // dummy data seolah-olah diambil dari API
//     const dummyData: ItemData[] = [
//       { id: 1, item_name: "Electronics", item_code: "ELEC-001", serial_number: "SN123456" },
//       { id: 2, item_name: "Furniture", item_code: "FURN-045", serial_number: "SN987654" },
//       { id: 3, item_name: "Tools", item_code: "TOOL-777", serial_number: "SN555999" },
//     ];
//     const selectedIds = String(ids).split(",").map((s) => Number(s));
//     setItems(dummyData.filter((d) => selectedIds.includes(d.id)));
//   }, [ids]);

  useEffect(() => {
    if (outbound_no && ids) {
      fetchData(outbound_no as string);
    } else {
      return;
    }
  }, [outbound_no, ids]);

  const fetchData = async (outbound_no: string) => {
    const res = await api.get(`/outbound/serial/${outbound_no}`);
    const selectedIds = String(ids).split(",").map((s) => Number(s));
    setItems(res.data.data?.items.filter((d: ItemData) => selectedIds.includes(d.id)));
  };

  useEffect(() => {
    if (items.length === 0) return;
    // beri delay kecil supaya DOM siap lalu panggil print
    const t = setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        console.error(e);
      }
    }, 300);

    // setelah print, tutup jendela — ini akan bekerja jika halaman dibuka lewat window.open()
    const onAfter = () => {
      try {
        window.close();
      } catch (e) {
        // some browsers might block close; itu normal
      }
    };

    // set handler
    (window as any).onafterprint = onAfter;

    return () => {
      clearTimeout(t);
      (window as any).onafterprint = null;
    };
  }, [items]);

  return (
    <div className="label-container">
      {items.length > 0 ? (
        items.map((item, idx) =>
          Array.from({ length: 2 }).map((_, i) => (
            <div className="label" key={`${idx}-${i}`}>
              <p style={{ whiteSpace: "nowrap" }}>{item.category}</p>
              <p style={{ whiteSpace: "nowrap" }}>{item.item_code}</p>
              <p style={{ whiteSpace: "nowrap" }}>{item.serial_number}</p>
            </div>
          ))
        )
      ) : (
        <div className="label">
          <p style={{ whiteSpace: "nowrap" }}>Data belum discan</p>
        </div>
      )}

      {/* CSS persis seperti yang kamu minta */}
      <style>{`
        @media print {
            body {
                margin: 0;
                font-size: 8pt;
                font-family: Arial, sans-serif;
                height: fit-content;
            }

            .label {
                padding-top: 10px;
                margin-bottom: 10px;
                text-align: center;
            }

            p {
                margin: 0;
                font-weight: bold;
            }
        }

        /* sedikit styling layar supaya tidak tampil aneh saat preview di tab baru */
        .label {
          padding-top: 10px;
          margin-bottom: 10px;
          text-align: center;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
