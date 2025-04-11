
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect } from "react";
import { useRouter } from "next/router";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import JsBarcode from "jsbarcode";
import api from "@/lib/api";

const loadImageAsBase64 = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

const PickingSheetPrint = () => {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      generatePDF(id);
    }
  }, [id]);

  const generatePDF = async (id: string | string[]) => {
    const data = await api.get(`/outbound/picking/sheet/${id}`, {
      withCredentials: true,
    });

    const pickingSheet = data.data.data;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // HEADER & FOOTER
    const addHeaderFooter = (
      doc: jsPDF,
      pageNumber: number,
      totalPages: number
    ) => {
      // **Tambahkan Logo**
      //   const img = "/images/yusen001.jpeg"; // Pastikan file ada di dalam public/
      //   doc.addImage(img, "JPEG", 15, 10, 30, 15); // (src, format, x, y, width, height)

      const imagePath = "/images/yusen001.jpeg"; // Akses dari public folder
      doc.addImage(imagePath, "JPEG", 15, 5, 30, 30); // (src, format, x, y, width, height)


      const canvas = document.createElement("canvas");
      const barcodeText = pickingSheet[0].outbound_no;

      // 🔥 Generate barcode dari teks
      JsBarcode(canvas, barcodeText, {
        format: "CODE128",
        displayValue: true, // Tampilkan teks di bawah barcode
        width: 2,
        height: 30,
      });

      // 🔥 Konversi ke Data URL (Base64)
      const barcodeBase64 = canvas.toDataURL("image/png");

      // 🔥 Tambahkan barcode ke PDF
      doc.addImage(barcodeBase64, "PNG", 135, 22, 60, 20); // (x, y, width, height)

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Picking Sheet", 105, 20, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Picking ID: ${pickingSheet[0].outbound_no}`, 15, 30);
      doc.text(`Delivery No: ${pickingSheet[0].delivery_no}`, 15, 35);
      doc.text(`Customer: ${pickingSheet[0].customer_name}`, 15, 40);
      doc.text(`Date: ${pickingSheet[0].outbound_date}`, 15, 45);

      // 🔥 Pindahkan Nomor Halaman ke Bawah
      doc.text(`Page ${pageNumber} of ${totalPages}`, 105, 290, {
        align: "center",
      });
    };

    // let pageNumber = 1;
    doc.setFont("helvetica", "bold");
    // addHeaderFooter(doc, pageNumber, 1); // Tambah header pertama sebelum autoTable

    let pageNumber = 1;
    autoTable(doc, {
      startY: 50,
      head: [
        [
          "No",
          "Item Code",
          "Barcode",
          "Item Name",
          "WH Code",
          "Qty",
          "Rec Date",
          "Pallet",
          "Location",
        ],
      ],
      body: pickingSheet.map((item, index) => [
        index + 1,
        item.item_code,
        item.barcode,
        item.item_name,
        item.whs_code,
        item.quantity,
        item.rec_date,
        item.pallet,
        item.location,
      ]),
      margin: { top: 40 },
      styles: {
        fontSize: 8,  // Ukuran font di dalam tabel lebih kecil
        cellPadding: 2  // Mengurangi padding untuk menghemat ruang
      },
      didDrawPage: (data) => {
        //   addHeaderFooter(doc, pageNumber, doc.getCurrentPageInfo().pageNumber);
        addHeaderFooter(doc, pageNumber, doc.getCurrentPageInfo().pageNumber);
        pageNumber++;
      },
    });

    // 🔥 Tanda tangan di halaman terakhir
    // doc.addPage();
    // addHeaderFooter(doc, pageNumber, doc.getCurrentPageInfo().pageNumber);
    doc.setFontSize(10);
    doc.text("Tanda Tangan:", 20, 250);
    doc.line(15, 270, 70, 270);
    doc.text("Manager", 35, 275);
    doc.line(85, 270, 140, 270);
    doc.text("Supervisor", 105, 275);
    doc.line(155, 270, 200, 270);
    doc.text("Staff", 170, 275);

    window.open(doc.output("bloburl"), "_blank");
    window.close();
  };

  return <p>Generating PDF...</p>;
};

export default PickingSheetPrint;
