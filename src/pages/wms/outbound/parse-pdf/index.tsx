"use client";

import { useState } from "react";

export default function CreateOutboundPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    docNo: "",
    vendor: "",
    itemName: "",
    sku: "",
    batchNo: "",
    qty: "",
    location: "",
  });

  // simulasi response backend parse PDF
  const mockParsePdf = () => {
    const parsed = {
      docNo: "PT26020609",
      vendor: "PT Anugerah Rejeki Inti Niaga",
      itemName: "GLUCO STRIP YUWELL Y330 BOX '25s",
      sku: "30031182",
      batchNo: "RE20260112",
      qty: "360",
      location:
        "Jl. Srikaya No.16 11, RT.11/RW.6, Utan Kayu Utara, Jakarta Timur",
    };

    setForm(parsed);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      qty: Number(form.qty),
    };

    console.log("SUBMIT OUTBOUND PAYLOAD:", payload);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Create Outbound Order</h1>

      {/* Upload PDF */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Upload PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
        />

        <button
          type="button"
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
          disabled={!pdfFile}
          onClick={mockParsePdf}
        >
          Parse PDF
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="docNo"
          placeholder="Document No"
          value={form.docNo}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          name="vendor"
          placeholder="Vendor"
          value={form.vendor}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          name="itemName"
          placeholder="Item Name"
          value={form.itemName}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          name="sku"
          placeholder="SKU"
          value={form.sku}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          name="batchNo"
          placeholder="Batch No"
          value={form.batchNo}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          name="qty"
          type="number"
          placeholder="Quantity"
          value={form.qty}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <textarea
          name="location"
          placeholder="Storage Location"
          value={form.location}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Submit Outbound
        </button>
      </form>
    </div>
  );
}
