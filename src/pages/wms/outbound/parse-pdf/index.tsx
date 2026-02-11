/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Layout from "@/components/layout";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import router from "next/router";
import { useState } from "react";

interface OutboundForm {
    docNo: string;
    vendor: string;
    itemName: string;
    sku: string;
    batchNo: string;
    qty: string;
    location: string;
    consignmentPeriod?: string;
}

interface ValidationError {
    field: string;
    message: string;
}

export default function CreateOutboundPage() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState<string>("");
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pdfZoom, setPdfZoom] = useState(1);
    const [showPdfModal, setShowPdfModal] = useState(false);

    const [form, setForm] = useState<OutboundForm>({
        docNo: "",
        vendor: "",
        itemName: "",
        sku: "",
        batchNo: "",
        qty: "",
        location: "",
        consignmentPeriod: "",
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== "application/pdf") {
                setParseError("Please upload a PDF file");
                return;
            }
            setPdfFile(file);
            setParseError("");
            setValidationErrors([]);

            // Create preview URL
            const url = URL.createObjectURL(file);
            setPdfPreviewUrl(url);
        }
    };

    const parsePdf = async () => {
        if (!pdfFile) {
            setParseError("Please select a PDF file first");
            return;
        }

        setIsParsing(true);
        setParseError("");
        setValidationErrors([]);

        try {
            const formData = new FormData();
            formData.append("pdf", pdfFile);

            const response = await api.post("/outbound/parse-pdf", formData);

            const result = await response.data;

            if (result.success) {
                setForm({
                    docNo: result.data.docNo || "",
                    vendor: result.data.vendor || "",
                    itemName: result.data.itemName || "",
                    sku: result.data.sku || "",
                    batchNo: result.data.batchNo || "",
                    qty: result.data.qty || "",
                    location: result.data.location || "",
                    consignmentPeriod: result.data.consignmentPeriod || "",
                });
                setParseError("");
                setValidationErrors([]);
            } else {
                setParseError(result.error || "Failed to parse PDF");
            }
        } catch (error) {
            setParseError(
                error instanceof Error ? error.message : "Failed to parse PDF"
            );
        } finally {
            setIsParsing(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));

        // Clear validation error for this field
        setValidationErrors((prev) =>
            prev.filter((error) => error.field !== name)
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setValidationErrors([]);
        setParseError("");

        try {
            const formData = new FormData();

            if (pdfFile) {
                formData.append("pdf", pdfFile);
            }

            formData.append("docNo", form.docNo);
            formData.append("vendor", form.vendor);
            formData.append("itemName", form.itemName);
            formData.append("sku", form.sku);
            formData.append("batchNo", form.batchNo);
            formData.append("qty", form.qty);
            formData.append("location", form.location);

            if (form.consignmentPeriod) {
                formData.append("consignmentPeriod", form.consignmentPeriod);
            }

            const response = await api.post("/outbound/create-from-pdf", formData);

            const result = await response.data;

            if (result.success) {
                // alert("Outbound order created successfully!");

                // Reset form
                resetForm();
                eventBus.emit("showAlert", {
                    title: "Success!",
                    description: result.message || "Outbound order created successfully!",
                    type: "success",
                });

                router.push("/wms/outbound/data");
            } else {
                // Handle validation errors
                if (result.errors && Array.isArray(result.errors)) {
                    setValidationErrors(result.errors);
                } else {
                    setParseError(result.message || "Failed to create outbound order");
                }
            }
        } catch (error: any) {
            // Handle validation errors from server
            if (error.response && error.response.data) {
                const errorData = error.response.data;

                if (errorData.errors && Array.isArray(errorData.errors)) {
                    setValidationErrors(errorData.errors);
                } else {
                    setParseError(errorData.message || "Failed to create outbound order");
                }
            } else {
                setParseError(
                    error instanceof Error ? error.message : "Failed to create outbound order"
                );
            }
        } finally {
            setIsSubmitting(false);

        }
    };

    const resetForm = () => {
        setForm({
            docNo: "",
            vendor: "",
            itemName: "",
            sku: "",
            batchNo: "",
            qty: "",
            location: "",
            consignmentPeriod: "",
        });
        setPdfFile(null);
        setParseError("");
        setValidationErrors([]);

        if (pdfPreviewUrl) {
            URL.revokeObjectURL(pdfPreviewUrl);
            setPdfPreviewUrl(null);
        }
    };

    const zoomIn = () => setPdfZoom((prev) => Math.min(prev + 0.25, 3));
    const zoomOut = () => setPdfZoom((prev) => Math.max(prev - 0.25, 0.5));
    const resetZoom = () => setPdfZoom(1);

    const getFieldError = (fieldName: string) => {
        return validationErrors.find((error) => error.field === fieldName);
    };

    return (

        <Layout title="Outbound" subTitle="Import from PDF">
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Side - Form */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            {/* <h1 className="text-3xl font-bold text-gray-900 mb-6">
                                Create Outbound Order
                            </h1> */}

                            {/* PDF Upload Section */}
                            <div className="mb-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Upload Consignment Memo PDF
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select PDF File
                                        </label>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handleFileChange}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        {pdfFile && (
                                            <p className="mt-2 text-sm text-gray-600">
                                                Selected: {pdfFile.name}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={parsePdf}
                                        disabled={!pdfFile || isParsing}
                                        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isParsing ? (
                                            <span className="flex items-center">
                                                <svg
                                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                Parsing PDF...
                                            </span>
                                        ) : (
                                            "Parse PDF"
                                        )}
                                    </button>

                                    {parseError && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm font-semibold text-red-700 mb-2">Error:</p>
                                            <p className="text-sm text-red-700">{parseError}</p>
                                        </div>
                                    )}

                                    {validationErrors.length > 0 && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm font-semibold text-red-700 mb-2">
                                                Validation Errors ({validationErrors.length}):
                                            </p>
                                            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                                                {validationErrors.map((error, index) => (
                                                    <li key={index}>
                                                        <strong>{error.field}:</strong> {error.message}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form Section */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label
                                            htmlFor="docNo"
                                            className="block text-sm font-medium text-gray-700 mb-2"
                                        >
                                            Document No *
                                        </label>
                                        <input
                                            id="docNo"
                                            name="docNo"
                                            type="text"
                                            required
                                            placeholder="e.g., PT26020609"
                                            value={form.docNo}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getFieldError("docNo")
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-300"
                                                }`}
                                        />
                                        {getFieldError("docNo") && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {getFieldError("docNo")?.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="vendor"
                                            className="block text-sm font-medium text-gray-700 mb-2"
                                        >
                                            Vendor / Goods Owner *
                                        </label>
                                        <input
                                            id="vendor"
                                            name="vendor"
                                            type="text"
                                            required
                                            placeholder="e.g., PT Anugerah Rejeki Inti Niaga"
                                            value={form.vendor}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getFieldError("vendor")
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-300"
                                                }`}
                                        />
                                        {getFieldError("vendor") && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {getFieldError("vendor")?.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label
                                            htmlFor="itemName"
                                            className="block text-sm font-medium text-gray-700 mb-2"
                                        >
                                            Item Name *
                                        </label>
                                        <input
                                            id="itemName"
                                            name="itemName"
                                            type="text"
                                            required
                                            placeholder="e.g., GLUCO STRIP YUWELL Y330 BOX '25s"
                                            value={form.itemName}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getFieldError("itemName")
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-300"
                                                }`}
                                        />
                                        {getFieldError("itemName") && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {getFieldError("itemName")?.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="sku"
                                            className="block text-sm font-medium text-gray-700 mb-2"
                                        >
                                            SKU *
                                        </label>
                                        <input
                                            id="sku"
                                            name="sku"
                                            type="text"
                                            required
                                            placeholder="e.g., 30031182"
                                            value={form.sku}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getFieldError("sku")
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-300"
                                                }`}
                                        />
                                        {getFieldError("sku") && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {getFieldError("sku")?.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="batchNo"
                                            className="block text-sm font-medium text-gray-700 mb-2"
                                        >
                                            Batch No *
                                        </label>
                                        <input
                                            id="batchNo"
                                            name="batchNo"
                                            type="text"
                                            required
                                            placeholder="e.g., RE20260112"
                                            value={form.batchNo}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getFieldError("batchNo")
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-300"
                                                }`}
                                        />
                                        {getFieldError("batchNo") && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {getFieldError("batchNo")?.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="qty"
                                            className="block text-sm font-medium text-gray-700 mb-2"
                                        >
                                            Quantity *
                                        </label>
                                        <input
                                            id="qty"
                                            name="qty"
                                            type="number"
                                            required
                                            min="1"
                                            placeholder="e.g., 360"
                                            value={form.qty}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getFieldError("qty")
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-300"
                                                }`}
                                        />
                                        {getFieldError("qty") && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {getFieldError("qty")?.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="consignmentPeriod"
                                            className="block text-sm font-medium text-gray-700 mb-2"
                                        >
                                            Consignment Period
                                        </label>
                                        <input
                                            id="consignmentPeriod"
                                            name="consignmentPeriod"
                                            type="text"
                                            placeholder="e.g., Feb - June 2026"
                                            value={form.consignmentPeriod}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getFieldError("consignmentPeriod")
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-300"
                                                }`}
                                        />
                                        {getFieldError("consignmentPeriod") && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {getFieldError("consignmentPeriod")?.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label
                                            htmlFor="location"
                                            className="block text-sm font-medium text-gray-700 mb-2"
                                        >
                                            Storage Location *
                                        </label>
                                        <textarea
                                            id="location"
                                            name="location"
                                            required
                                            rows={3}
                                            placeholder="e.g., Jl. Srikaya No.16 11, RT.11/RW.6, Utan Kayu Utara, Jakarta Timur"
                                            value={form.location}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${getFieldError("location")
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-300"
                                                }`}
                                        />
                                        {getFieldError("location") && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {getFieldError("location")?.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-6 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center">
                                                <svg
                                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                Submitting...
                                            </span>
                                        ) : (
                                            "Submit Outbound Order"
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Reset Form
                                    </button>
                                </div>
                            </form>

                            {/* Info Box */}
                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h3 className="text-sm font-semibold text-yellow-900 mb-2">
                                    📋 How to use:
                                </h3>
                                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                                    <li>Upload a Goods Consignment Memo PDF file</li>
                                    <li>Click &quot;Parse PDF&quot; to automatically extract information</li>
                                    <li>Review and edit the extracted data if needed</li>
                                    <li>Submit the outbound order</li>
                                </ul>
                            </div>
                        </div>

                        {/* Right Side - PDF Preview */}
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-6 h-fit">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    PDF Preview
                                </h2>
                                {pdfPreviewUrl && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={zoomOut}
                                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                            title="Zoom Out"
                                        >
                                            <svg
                                                className="w-5 h-5 text-gray-700"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                                                />
                                            </svg>
                                        </button>
                                        <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                                            {Math.round(pdfZoom * 100)}%
                                        </span>
                                        <button
                                            onClick={zoomIn}
                                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                            title="Zoom In"
                                        >
                                            <svg
                                                className="w-5 h-5 text-gray-700"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={resetZoom}
                                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                            title="Reset Zoom"
                                        >
                                            <svg
                                                className="w-5 h-5 text-gray-700"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setShowPdfModal(true)}
                                            className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                                            title="Fullscreen"
                                        >
                                            <svg
                                                className="w-5 h-5 text-blue-700"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                                {pdfPreviewUrl ? (
                                    <div className="overflow-auto max-h-[calc(100vh-200px)]">
                                        <iframe
                                            src={pdfPreviewUrl}
                                            className="w-full min-h-[600px] bg-white"
                                            style={{ transform: `scale(${pdfZoom})`, transformOrigin: 'top left' }}
                                            title="PDF Preview"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-96 text-gray-400">
                                        <div className="text-center">
                                            <svg
                                                className="w-24 h-24 mx-auto mb-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1}
                                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                />
                                            </svg>
                                            <p className="text-lg font-medium">No PDF selected</p>
                                            <p className="text-sm mt-2">Upload a PDF to see preview</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fullscreen PDF Modal */}
                {showPdfModal && pdfPreviewUrl && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                        <div className="relative w-full h-full max-w-7xl max-h-screen">
                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-white rounded-lg p-2 shadow-lg">
                                <button
                                    onClick={zoomOut}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                    </svg>
                                </button>
                                <span className="text-sm font-medium min-w-[60px] text-center">
                                    {Math.round(pdfZoom * 100)}%
                                </span>
                                <button
                                    onClick={zoomIn}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={resetZoom}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setShowPdfModal(false)}
                                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors ml-2"
                                >
                                    <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="bg-white rounded-lg h-full overflow-auto">
                                <iframe
                                    src={pdfPreviewUrl}
                                    className="w-full h-full"
                                    style={{ transform: `scale(${pdfZoom})`, transformOrigin: 'top left' }}
                                    title="PDF Fullscreen Preview"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}