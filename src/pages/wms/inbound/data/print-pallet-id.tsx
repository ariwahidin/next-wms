/* eslint-disable @next/next/no-img-element */
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

const LabelCard = ({ palletID, date }) => {
    const barcodeRef = useRef(null);

    useEffect(() => {
        if (barcodeRef.current) {
            try {
                JsBarcode(barcodeRef.current, palletID, {
                    format: 'CODE128',
                    width: 2,
                    height: 60,
                    displayValue: false,
                    margin: 10,
                });
            } catch (error) {
                console.error('Error generating barcode:', error);
            }
        }
    }, [palletID]);

    return (
        <div className="relative border-2 border-black p-4 h-[14.8cm] flex flex-col">
            {/* Cutting guides - dashed lines */}
            <div className="absolute top-0 left-0 right-0 h-0 border-t-2 border-dashed border-gray-400" style={{ top: '-1px' }}></div>
            <div className="absolute bottom-0 left-0 right-0 h-0 border-b-2 border-dashed border-gray-400" style={{ bottom: '-1px' }}></div>
            <div className="absolute top-0 bottom-0 left-0 w-0 border-l-2 border-dashed border-gray-400" style={{ left: '-1px' }}></div>
            <div className="absolute top-0 bottom-0 right-0 w-0 border-r-2 border-dashed border-gray-400" style={{ right: '-1px' }}></div>
            
            <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-black">
                <div className="flex items-center gap-2">
                    {/* <Package className="h-8 w-8" />
                    <div>
                        <div className="font-bold text-lg">WMS SYSTEM</div>
                        <div className="text-xs text-gray-600">Warehouse Management</div>
                    </div> */}
                    <div>
                        <img src="/images/yl-logo.jpeg" alt="Logo" width="80" />
                        <span style={{ fontSize: "11px" }}>PT Yusen Logistics Interlink Indonesia</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-gray-600" style={{ fontSize: "10px" }}>Generated:</div>
                    <div className="font-semibold" style={{ fontSize: "10px" }}>{date}</div>
                </div>
            </div>

            {/* Barcode Area */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="mb-2">
                    <svg ref={barcodeRef} className="w-full max-w-[250px]"></svg>
                </div>
                <div className="font-bold text-2xl tracking-wider mb-1">{palletID}</div>
                <div className="text-sm text-gray-600">PALLET ID</div>
            </div>

            <div className="border-2 border-gray-400 rounded p-3 mt-3">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Qty Carton:</span>
                    <div className="border-b-2 border-gray-400 w-32 h-8"></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">Fill manually</div>
            </div>
        </div>
    );
};

export default function PrintPalletID() {
    const router = useRouter();
    const { inbound_no, start, end } = router.query;

    useEffect(() => {
        // Auto print setelah halaman load
        if (inbound_no && start && end) {
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [inbound_no, start, end]);

    if (!inbound_no || !start || !end) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    const startNum = parseInt(start as string);
    const endNum = parseInt(end as string);
    const palletIDs = [];

    for (let i = startNum; i <= endNum; i++) {
        palletIDs.push(`${inbound_no}-${i}`);
    }

    const currentDate = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    // Group into pages (4 labels per page)
    const pages = [];
    for (let i = 0; i < palletIDs.length; i += 4) {
        pages.push(palletIDs.slice(i, i + 4));
    }

    return (
        <>
            <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none;
          }
          .print-page {
            page-break-after: always;
          }
        }
        @media screen {
          body {
            background: #f5f5f5;
            padding: 20px;
          }
        }
      `}</style>

            <div className="no-print mb-4 bg-white p-4 rounded shadow">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Pallet ID Labels</h1>
                        <p className="text-gray-600">
                            {palletIDs.length} labels ({pages.length} pages) - {inbound_no}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Print
                        </button>
                        <button
                            onClick={() => window.close()}
                            className="px-4 py-2 border rounded hover:bg-gray-100"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {pages.map((pageLabels, pageIndex) => (
                <div key={pageIndex} className="print-page bg-white mb-4">
                    <div className="grid grid-cols-2">
                        {pageLabels.map((palletID, labelIndex) => (
                            <LabelCard
                                key={`${pageIndex}-${labelIndex}`}
                                palletID={palletID}
                                date={currentDate}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </>
    );
}