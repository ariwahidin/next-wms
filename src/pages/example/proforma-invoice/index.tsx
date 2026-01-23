import React, { useState } from 'react';
import { Printer, Download } from 'lucide-react';

interface InvoiceItem {
    code: string;
    uom: string;
    description: string;
    unitPrice: number;
    qty: number;
    vat: string;
    lineTotal: number;
}

interface InvoiceData {
    invoiceNumber: string;
    date: string;
    expiryDate: string;
    billTo: {
        company: string;
        address: string;
        city: string;
        phone: string;
    };
    shipTo: {
        company: string;
        address: string;
        city: string;
        phone: string;
    };
    shipping: {
        poNumber: string;
        poDate: string;
        currency: string;
        terms: string;
        shipDate: string;
        transportMode: string;
        transportTerms: string;
        grossWeight: string;
        netWeight: string;
        carrier: string;
    };
    customsInfo: {
        reasonForExport: string;
        portOfEmbarkation: string;
        portOfDischarge: string;
        countryOfOrigin: string;
    };
    items: InvoiceItem[];
    specialNotes: string;
    subtotal: number;
    vatRate: number;
    vat: number;
    shippingHandling: number;
    insurance: number;
    total: number;
}

const ProformaInvoice: React.FC = () => {
    const [isProforma, setIsProforma] = useState(true);
    const [invoiceData] = useState<InvoiceData>({
        invoiceNumber: '1100',
        date: 'September 30, 2019',
        expiryDate: 'September 30, 2019',
        billTo: {
            company: 'First Kormarsin',
            address: 'PT Indah Rasa Bangsa',
            city: 'Jl. Rambate, Kemang Pratama, 20100',
            phone: '0897-7654-3210'
        },
        shipTo: {
            company: 'First Kormarsin',
            address: 'PT Indah Rasa Bangsa',
            city: 'Jl. Rambate, Kemang Pratama, 20100',
            phone: '0897-7654-3210'
        },
        shipping: {
            poNumber: 'INV125486-CRN',
            poDate: '30 September 2019',
            currency: 'Dollar',
            terms: '30 Net',
            shipDate: '30 September 2019',
            transportMode: 'Motor lorry',
            transportTerms: 'CIF',
            grossWeight: '920 kg',
            netWeight: '850 kg',
            carrier: 'DHL Express'
        },
        customsInfo: {
            reasonForExport: 'Sale',
            portOfEmbarkation: 'Jakarta Port',
            portOfDischarge: 'Singapore Port',
            countryOfOrigin: 'Indonesia'
        },
        items: [
            { code: '0014', uom: 'Kg', description: 'Salt Drinks Premium Grade A - High Quality', unitPrice: 150.00, qty: 200, vat: '+', lineTotal: 30000.00 },
            { code: '0048', uom: 'Pcs', description: 'Ceramic Plates White Collection 10 inch', unitPrice: 25.00, qty: 50, vat: '+', lineTotal: 1250.00 },
            { code: '0089', uom: 'Box', description: 'Coffee Beans Arabica Premium Roasted', unitPrice: 85.00, qty: 30, vat: '+', lineTotal: 2550.00 },
            { code: '0102', uom: 'Ltr', description: 'Olive Oil Extra Virgin Cold Pressed', unitPrice: 45.00, qty: 100, vat: '+', lineTotal: 4500.00 },
            { code: '0145', uom: 'Kg', description: 'Rice Jasmine Premium Quality AAA', unitPrice: 12.50, qty: 500, vat: '+', lineTotal: 6250.00 },
            { code: '0178', uom: 'Pcs', description: 'Stainless Steel Cutlery Set Premium', unitPrice: 35.00, qty: 75, vat: '+', lineTotal: 2625.00 },
            { code: '0201', uom: 'Box', description: 'Tea Leaves Green Organic Premium', unitPrice: 55.00, qty: 40, vat: '+', lineTotal: 2200.00 },
            { code: '0234', uom: 'Kg', description: 'Sugar Cane Raw Organic Unrefined', unitPrice: 8.75, qty: 600, vat: '+', lineTotal: 5250.00 },
            { code: '0267', uom: 'Pcs', description: 'Glass Storage Containers Set', unitPrice: 28.00, qty: 60, vat: '+', lineTotal: 1680.00 },
            { code: '0298', uom: 'Ltr', description: 'Coconut Oil Virgin Cold Pressed', unitPrice: 38.50, qty: 80, vat: '+', lineTotal: 3080.00 },
            { code: '0312', uom: 'Box', description: 'Chocolate Dark Premium Belgian', unitPrice: 95.00, qty: 25, vat: '+', lineTotal: 2375.00 },
            { code: '0345', uom: 'Kg', description: 'Flour Wheat Premium All Purpose', unitPrice: 6.50, qty: 800, vat: '+', lineTotal: 5200.00 },
            { code: '0378', uom: 'Pcs', description: 'Wooden Cutting Board Large Size', unitPrice: 42.00, qty: 35, vat: '+', lineTotal: 1470.00 },
            { code: '0401', uom: 'Box', description: 'Herbal Tea Chamomile Organic', unitPrice: 48.00, qty: 45, vat: '+', lineTotal: 2160.00 },
            { code: '0434', uom: 'Ltr', description: 'Vinegar Apple Cider Organic Raw', unitPrice: 32.00, qty: 70, vat: '+', lineTotal: 2240.00 },
            { code: '0467', uom: 'Kg', description: 'Honey Pure Natural Wildflower', unitPrice: 75.00, qty: 50, vat: '+', lineTotal: 3750.00 },
            { code: '0490', uom: 'Pcs', description: 'Kitchen Knife Set Professional', unitPrice: 120.00, qty: 20, vat: '+', lineTotal: 2400.00 },
            { code: '0523', uom: 'Box', description: 'Spices Mixed Collection Premium', unitPrice: 65.00, qty: 35, vat: '+', lineTotal: 2275.00 },
            { code: '0556', uom: 'Kg', description: 'Pasta Durum Wheat Italian Style', unitPrice: 15.00, qty: 400, vat: '+', lineTotal: 6000.00 },
            { code: '0589', uom: 'Ltr', description: 'Soy Sauce Premium Aged Naturally', unitPrice: 22.00, qty: 90, vat: '+', lineTotal: 1980.00 }
        ],
        specialNotes: 'Please ensure all items are handled with care during transportation. Temperature-controlled shipping required for perishable items.',
        subtotal: 98285.00,
        vatRate: 10,
        vat: 9828.50,
        shippingHandling: 450.00,
        insurance: 250.00,
        total: 108813.50
    });

    const ITEMS_PER_PAGE = 12;
    const totalPages = Math.ceil(invoiceData.items.length / ITEMS_PER_PAGE);

    const formatCurrency = (amount: number): string => {
        return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const renderPage = (pageNumber: number) => {
        const startIndex = (pageNumber - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, invoiceData.items.length);
        const pageItems = invoiceData.items.slice(startIndex, endIndex);
        const isLastPage = pageNumber === totalPages;

        return (
            <div key={pageNumber} className="bg-white p-8 mb-8 shadow-lg" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', pageBreakAfter: 'always' }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-800">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">PT Sejahtera Bersama</h1>
                        <p className="text-sm text-gray-600 mt-1">Jl. Merdeka No. 123, Jakarta 10110</p>
                        <p className="text-sm text-gray-600">Tel: (021) 1234-5678 | Email: info@sejahtera.com</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-blue-900">
                            {isProforma ? 'PRO FORMA INVOICE' : 'INVOICE'}
                        </h2>
                        <div className="mt-2 text-sm">
                            <p><span className="font-semibold">Page:</span> {pageNumber} of {totalPages}</p>
                            <p><span className="font-semibold">Date:</span> {invoiceData.date}</p>
                            <p><span className="font-semibold">Date of Expiry:</span> {invoiceData.expiryDate}</p>
                            <p><span className="font-semibold">Invoice #:</span> {invoiceData.invoiceNumber}</p>
                            {!isProforma && (
                                <div className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold">
                                    PAID
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bill To and Ship To */}
                {pageNumber === 1 && (
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <div className="bg-blue-900 text-white px-3 py-2 font-semibold">Bill To</div>
                            <div className="border border-gray-300 p-3 text-sm">
                                <p className="font-semibold">{invoiceData.billTo.company}</p>
                                <p>{invoiceData.billTo.address}</p>
                                <p>{invoiceData.billTo.city}</p>
                                <p>{invoiceData.billTo.phone}</p>
                            </div>
                        </div>
                        <div>
                            <div className="bg-blue-900 text-white px-3 py-2 font-semibold">Ship To</div>
                            <div className="border border-gray-300 p-3 text-sm">
                                <p className="font-semibold">{invoiceData.shipTo.company}</p>
                                <p>{invoiceData.shipTo.address}</p>
                                <p>{invoiceData.shipTo.city}</p>
                                <p>{invoiceData.shipTo.phone}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Shipping Information */}
                {pageNumber === 1 && (
                    <div className="mb-6">
                        <div className="bg-blue-900 text-white px-3 py-2 font-semibold">Shipping Information</div>
                        <div className="border border-gray-300 p-3">
                            <div className="grid grid-cols-4 gap-4 text-sm">
                                <div><span className="font-semibold">P.O. #:</span> {invoiceData.shipping.poNumber}</div>
                                <div><span className="font-semibold">Mode of Transportation:</span> {invoiceData.shipping.transportMode}</div>
                                <div><span className="font-semibold">P.O. Date:</span> {invoiceData.shipping.poDate}</div>
                                <div><span className="font-semibold">Transportation Terms:</span> {invoiceData.shipping.transportTerms}</div>
                                <div><span className="font-semibold">Currency:</span> {invoiceData.shipping.currency}</div>
                                <div><span className="font-semibold">Est. Gross Weight:</span> {invoiceData.shipping.grossWeight}</div>
                                <div><span className="font-semibold">Terms:</span> {invoiceData.shipping.terms}</div>
                                <div><span className="font-semibold">Est. Net Weight:</span> {invoiceData.shipping.netWeight}</div>
                                <div><span className="font-semibold">Ship Date:</span> {invoiceData.shipping.shipDate}</div>
                                <div><span className="font-semibold">Carrier:</span> {invoiceData.shipping.carrier}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Customs Information */}
                {pageNumber === 1 && (
                    <div className="mb-6">
                        <div className="bg-blue-900 text-white px-3 py-2 font-semibold">Additional Information for Customs</div>
                        <div className="border border-gray-300 p-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="font-semibold">Reason for Export:</span> {invoiceData.customsInfo.reasonForExport}</div>
                                <div><span className="font-semibold">Port of Discharge:</span> {invoiceData.customsInfo.portOfDischarge}</div>
                                <div><span className="font-semibold">Port of Embarkation:</span> {invoiceData.customsInfo.portOfEmbarkation}</div>
                                <div><span className="font-semibold">Country of Origin:</span> {invoiceData.customsInfo.countryOfOrigin}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Items Table */}
                <div className="mb-6">
                    {pageNumber === 1 && (
                        <div className="bg-blue-900 text-white px-3 py-2 font-semibold mb-0">Items</div>
                    )}
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-2 py-2 text-left">Item/Part #</th>
                                <th className="border border-gray-300 px-2 py-2 text-left">UOM</th>
                                <th className="border border-gray-300 px-2 py-2 text-left">Description</th>
                                <th className="border border-gray-300 px-2 py-2 text-right">Unit Price</th>
                                <th className="border border-gray-300 px-2 py-2 text-right">Qty</th>
                                <th className="border border-gray-300 px-2 py-2 text-center">VAT</th>
                                <th className="border border-gray-300 px-2 py-2 text-right">Line Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.map((item, index) => (
                                <tr key={startIndex + index} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-2 py-2">{item.code}</td>
                                    <td className="border border-gray-300 px-2 py-2">{item.uom}</td>
                                    <td className="border border-gray-300 px-2 py-2">{item.description}</td>
                                    <td className="border border-gray-300 px-2 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                                    <td className="border border-gray-300 px-2 py-2 text-right">{item.qty}</td>
                                    <td className="border border-gray-300 px-2 py-2 text-center">{item.vat}</td>
                                    <td className="border border-gray-300 px-2 py-2 text-right font-semibold">{formatCurrency(item.lineTotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer - Only on last page */}
                {isLastPage && (
                    <>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <div className="bg-blue-900 text-white px-3 py-2 font-semibold">Special Notes, Terms of Sale</div>
                                <div className="border border-gray-300 p-3 text-sm min-h-[100px]">
                                    {invoiceData.specialNotes}
                                </div>
                            </div>
                            <div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between py-1">
                                        <span>Subtotal</span>
                                        <span className="font-semibold">$ {formatCurrency(invoiceData.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span>Subject to VAT</span>
                                        <span className="font-semibold">$ {formatCurrency(invoiceData.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span>VAT Rate</span>
                                        <span className="font-semibold">% {invoiceData.vatRate.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span>VAT</span>
                                        <span className="font-semibold">$ {formatCurrency(invoiceData.vat)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span>S & H</span>
                                        <span className="font-semibold">$ {formatCurrency(invoiceData.shippingHandling)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span>Insurance</span>
                                        <span className="font-semibold">$ {formatCurrency(invoiceData.insurance)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-t-2 border-gray-800 font-bold text-base">
                                        <span>Total</span>
                                        <span>$ {formatCurrency(invoiceData.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t-2 border-gray-300 pt-4 text-sm">
                            <p className="mb-2"><em>I declare that the information mentioned above is true and correct to the best of my knowledge.</em></p>
                            <div className="mt-8">
                                <div className="border-t border-gray-800 w-48 inline-block"></div>
                                <p className="mt-1">Signature</p>
                                <p className="mt-4 text-gray-600">Date: __________________</p>
                            </div>
                        </div>

                        <div className="text-center mt-6 text-xs text-gray-600 border-t pt-4">
                            <p>Should you have any enquiries concerning this invoice, please contact Dedi on 0812-3456-7890</p>
                            <p>12 Jl. Kenangan Bersama, Surabaya, Jawa Timur, Indonesia, 12345</p>
                            <p>Tel: 0812-3456-7890 Fax: - E-mail: info@sejahtera.com Web: sejahterabersama.com</p>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-[210mm] mx-auto mb-4 flex gap-4 print:hidden">
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors shadow-lg"
                >
                    <Printer size={20} />
                    Print Invoice
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors shadow-lg"
                >
                    <Download size={20} />
                    Download PDF
                </button>
            </div>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(renderPage)}

            <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
        </div>
    );
};

export default ProformaInvoice;