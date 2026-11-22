
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "@/lib/api";
import SuratJalanPrint from "@/components/shipping/SuratJalanPrint";

export default function SuratJalanPrintPage() {
    const router = useRouter();
    const { sj_no } = router.query;

    const sjNo = Array.isArray(sj_no) ? sj_no[0] : sj_no;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await api.get(`/order/sj/${sjNo}`, {
                withCredentials: true,
            });

            setData(res.data?.data ?? null);
        } catch (err: any) {
            console.error("Error fetching Surat Jalan:", err);
            setError(
                err?.response?.data?.message ||
                "Failed to load Surat Jalan."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!router.isReady || !sjNo) return;

        fetchData();
    }, [router.isReady, sjNo]);

    const action = async (path: string) => {
        try {
            await api.patch(
                `/order/sj/${sjNo}/${path}`,
                {},
                { withCredentials: true }
            );

            await fetchData();
        } catch (err: any) {
            console.error(`Error ${path} Surat Jalan:`, err);

            alert(
                err?.response?.data?.message ||
                `Failed to ${path} Surat Jalan.`
            );
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                Loading Surat Jalan...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center text-red-600">
                {error}
            </div>
        );
    }

    if (!data?.header) {
        return (
            <div className="p-6 text-center">
                Surat Jalan tidak ditemukan.
            </div>
        );
    }

    // Normalisasi data agar tidak ada array null
    const items = Array.isArray(data.items)
        ? data.items.map((item: any) => ({
            ...item,
            packages: Array.isArray(item.packages)
                ? item.packages
                : [],
        }))
        : [];

    return (
        <main className="mx-auto max-w-5xl p-6">

            <div className="mb-4 flex flex-wrap justify-end gap-2 print:hidden">

                {/* {data.header.status === "DRAFT" && (
                    <button
                        className="rounded border px-4 py-2"
                        onClick={() => action("release")}
                    >
                        Release
                    </button>
                )} */}

                {/* {data.header.status === "RELEASED" && (
                    <button
                        className="rounded border px-4 py-2"
                        onClick={() => action("delivered")}
                    >
                        Mark Delivered
                    </button>
                )}

                {["DRAFT", "RELEASED"].includes(data.header.status) && (
                    <button
                        className="rounded border px-4 py-2"
                        onClick={() => action("cancel")}
                    >
                        Cancel SJ
                    </button>
                )} */}

                <button
                    className="rounded bg-blue-600 px-4 py-2 text-white"
                    onClick={() => window.print()}
                >
                    Print Delivery Notes
                </button>

            </div>

            <SuratJalanPrint
                header={data.header}
                items={items}
            />

        </main>
    );
}
