"use client";

import { useEffect, useState } from "react";
import Select from "react-select";
import Layout from "@/components/layout";
import { toast } from "sonner";
import api from "@/lib/api";

// =========================================================
// TYPES
// =========================================================

type InboundOption = {
  id: number;
  inbound_no: string;
  receipt_id: string;
  inbound_date: string;
  owner_code: string;
  whs_code: string;
  supplier: string;
  status: string;
};

type SelectOption = {
  value: string;
  label: string;
  data: InboundOption;
};

// =========================================================
// COMPONENT
// =========================================================

export default function Page() {
  // =========================================================
  // INBOUND
  // =========================================================

  const [selectedInbound, setSelectedInbound] =
    useState<SelectOption | null>(null);

  const [inboundOptions, setInboundOptions] = useState<SelectOption[]>([]);

  const [searchLoading, setSearchLoading] = useState(false);

  // =========================================================
  // FILE
  // =========================================================

  const [file, setFile] = useState<File | null>(null);

  // =========================================================
  // ACTION LOADING
  // =========================================================

  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // =========================================================
  // LOAD INITIAL OPTIONS
  // =========================================================

  useEffect(() => {
    loadInboundOptions("");
  }, []);

  // =========================================================
  // LOAD INBOUND OPTIONS
  // =========================================================

  const loadInboundOptions = async (search: string) => {
    try {
      setSearchLoading(true);

      const response = await api.get(
        "/inbound/checking/options",
        {
          params: {
            search: search.trim(),
            limit: 20,
          },
        }
      );

      const items: InboundOption[] =
        response?.data?.items || [];

      const options: SelectOption[] = items.map(
        (item) => ({
          value: item.inbound_no,

          // Yang dilihat user
          label: item.receipt_id,

          data: item,
        })
      );

      setInboundOptions(options);
    } catch (error: any) {
      console.error(error);

      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to load inbound list";

      toast.error(message);
    } finally {
      setSearchLoading(false);
    }
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const handleInputChange = (
    inputValue: string,
    actionMeta: {
      action: string;
    }
  ) => {
    if (
      actionMeta.action === "input-change"
    ) {
      loadInboundOptions(inputValue);
    }

    return inputValue;
  };

  // =========================================================
  // SELECT INBOUND
  // =========================================================

  const handleInboundChange = (
    option: SelectOption | null
  ) => {
    setSelectedInbound(option);

    // =======================================================
    // IMPORTANT
    // =======================================================
    //
    // Backend tetap memakai inbound_no.
    //
    // User tidak perlu mengetahui / mengetik inbound_no.
    //

    if (option) {
      console.log(
        "Selected Receipt ID:",
        option.data.receipt_id
      );

      console.log(
        "Selected Inbound No:",
        option.data.inbound_no
      );
    }

    // Kalau ganti inbound, file Excel sebelumnya
    // harus dibuang supaya tidak salah upload.
    setFile(null);

    const fileInput = document.getElementById(
      "checking-file"
    ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // =========================================================
  // DOWNLOAD TEMPLATE
  // =========================================================

  const handleDownload = async () => {
    if (!selectedInbound) {
      toast.error("Please select Receipt ID");
      return;
    }

    const inboundNo =
      selectedInbound.data.inbound_no;

    try {
      setDownloading(true);

      const response = await api.get(
        `/inbound/${encodeURIComponent(
          inboundNo
        )}/checking/download`,
        {
          responseType: "blob",
        }
      );

      // =====================================================
      // CREATE DOWNLOAD
      // =====================================================

      const blob = new Blob(
        [response.data],
        {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `Receiving_Checking_${inboundNo}.xlsx`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success(
        "Checking template downloaded successfully"
      );
    } catch (error: any) {
      console.error(error);

      // =====================================================
      // HANDLE BLOB ERROR RESPONSE
      // =====================================================

      let message =
        "Failed to download template";

      try {
        if (
          error?.response?.data instanceof Blob
        ) {
          const text =
            await error.response.data.text();

          const json =
            JSON.parse(text);

          message =
            json?.error ||
            json?.message ||
            message;
        } else {
          message =
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            message;
        }
      } catch {
        // ignore parsing error
      }

      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  // =========================================================
  // FILE CHANGE
  // =========================================================

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const extension =
      selectedFile.name
        .split(".")
        .pop()
        ?.toLowerCase();

    if (
      extension !== "xlsx" &&
      extension !== "xls"
    ) {
      toast.error(
        "Please select an Excel file (.xlsx / .xls)"
      );

      event.target.value = "";

      setFile(null);

      return;
    }

    setFile(selectedFile);
  };

  // =========================================================
  // REMOVE FILE
  // =========================================================

  const handleRemoveFile = () => {
    setFile(null);

    const fileInput =
      document.getElementById(
        "checking-file"
      ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // =========================================================
  // UPLOAD
  // =========================================================

  const handleUpload = async () => {
    if (!selectedInbound) {
      toast.error("Please select Receipt ID");
      return;
    }

    if (!file) {
      toast.error(
        "Please select an Excel file"
      );
      return;
    }

    const inboundNo =
      selectedInbound.data.inbound_no;

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await api.post(
          `/inbound/${encodeURIComponent(
            inboundNo
          )}/checking/upload`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      if (
        response?.data?.success
      ) {
        toast.success(
          response.data.message ||
            "Checking Excel uploaded successfully"
        );

        console.log(
          "UPLOAD RESULT:",
          response.data
        );

        // ===================================================
        // RESET FILE
        // ===================================================

        setFile(null);

        const fileInput =
          document.getElementById(
            "checking-file"
          ) as HTMLInputElement | null;

        if (fileInput) {
          fileInput.value = "";
        }

        // ===================================================
        // REFRESH SELECTED INBOUND
        // ===================================================

        await loadInboundOptions("");

      }
    } catch (error: any) {
      console.error(error);

      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to upload checking Excel";

      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  // =========================================================
  // SELECT STYLES
  // =========================================================

  const selectStyles = {
    control: (
      base: any,
      state: any
    ) => ({
      ...base,

      minHeight: "42px",

      borderRadius: "8px",

      borderColor: state.isFocused
        ? "#3b82f6"
        : "#d1d5db",

      boxShadow: state.isFocused
        ? "0 0 0 2px rgba(59,130,246,0.1)"
        : "none",

      "&:hover": {
        borderColor: "#9ca3af",
      },
    }),

    option: (
      base: any,
      state: any
    ) => ({
      ...base,

      backgroundColor:
        state.isSelected
          ? "#2563eb"
          : state.isFocused
          ? "#eff6ff"
          : "white",

      color:
        state.isSelected
          ? "white"
          : "#111827",

      cursor: "pointer",
    }),

    menu: (base: any) => ({
      ...base,
      zIndex: 50,
    }),

    placeholder: (
      base: any
    ) => ({
      ...base,
      color: "#9ca3af",
    }),
  };

  // =========================================================
  // CUSTOM OPTION
  // =========================================================

  const formatOptionLabel = (
    option: SelectOption
  ) => {
    const item =
      option.data;

    return (
      <div className="py-1">
        <div className="font-medium text-gray-900">
          {item.receipt_id}
        </div>

        <div className="mt-0.5 text-xs text-gray-500">
          {item.inbound_no}
          {" • "}
          {item.supplier || "-"}
        </div>
      </div>
    );
  };

  // =========================================================
  // SELECTED INBOUND
  // =========================================================

  const selectedData =
    selectedInbound?.data;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Layout
      title="Inbound"
      subTitle="Receiving Excel"
    >
      <div className="p-4">
        <div className="mx-auto max-w-5xl space-y-4">

          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Receiving Excel
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select the Receipt ID, download the
                receiving template, fill in the
                checking result, then upload it back
                to the system.
              </p>
            </div>

            {/* ================================================= */}
            {/* RECEIPT ID */}
            {/* ================================================= */}

            <div className="max-w-2xl">

              <label
                htmlFor="receipt-id"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Receipt ID
              </label>

              <Select<SelectOption, false>
                inputId="receipt-id"

                value={
                  selectedInbound
                }

                options={
                  inboundOptions
                }

                onChange={
                  handleInboundChange
                }

                onInputChange={
                  handleInputChange
                }

                isLoading={
                  searchLoading
                }

                isDisabled={
                  downloading ||
                  uploading
                }

                isClearable

                isSearchable

                placeholder="Search Receipt ID..."

                noOptionsMessage={() =>
                  "No checking inbound found"
                }

                loadingMessage={() =>
                  "Loading inbound..."
                }

                filterOption={
                  () => true
                }

                formatOptionLabel={
                  formatOptionLabel
                }

                styles={
                  selectStyles
                }

                className="text-sm"
              />

            </div>

            {/* ================================================= */}
            {/* SELECTED DETAIL */}
            {/* ================================================= */}

            {selectedData && (
              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-blue-600">
                      Receipt ID
                    </div>

                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {
                        selectedData.receipt_id
                      }
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-blue-600">
                      Inbound No
                    </div>

                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {
                        selectedData.inbound_no
                      }
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-blue-600">
                      Supplier
                    </div>

                    <div className="mt-1 truncate text-sm font-semibold text-gray-900">
                      {
                        selectedData.supplier ||
                        "-"
                      }
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-blue-600">
                      Status
                    </div>

                    <div className="mt-1">

                      <span className="inline-flex rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                        {
                          selectedData.status
                        }
                      </span>

                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* ================================================= */}
          {/* DOWNLOAD */}
          {/* ================================================= */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">

            <div className="mb-4">
              <h3 className="font-semibold text-gray-900">
                1. Download Template
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Download the Excel template based on
                the selected Receipt ID.
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleDownload
              }
              disabled={
                downloading ||
                uploading ||
                !selectedInbound
              }
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {downloading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                  Downloading...
                </>
              ) : (
                <>
                  <span>
                    ↓
                  </span>

                  Download Template
                </>
              )}

            </button>

          </div>

          {/* ================================================= */}
          {/* UPLOAD */}
          {/* ================================================= */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">

            <div className="mb-4">
              <h3 className="font-semibold text-gray-900">
                2. Upload Checking Result
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Fill in Qty Received, Case No,
                Carton No, and Location before
                uploading.
              </p>
            </div>

            {/* ================================================= */}
            {/* FILE */}
            {/* ================================================= */}

            <div className="mb-4">

              <label
                htmlFor="checking-file"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Excel File
              </label>

              <input
                id="checking-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={
                  handleFileChange
                }
                disabled={
                  uploading ||
                  !selectedInbound
                }
                className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-700 file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-2.5 file:text-sm file:font-medium"
              />

            </div>

            {/* ================================================= */}
            {/* SELECTED FILE */}
            {/* ================================================= */}

            {file && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">

                <div className="min-w-0">

                  <div className="truncate text-sm font-medium text-blue-900">
                    {file.name}
                  </div>

                  <div className="mt-1 text-xs text-blue-700">
                    {(
                      file.size /
                      1024
                    ).toFixed(1)}{" "}
                    KB
                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    handleRemoveFile
                  }
                  disabled={
                    uploading
                  }
                  className="ml-4 shrink-0 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>

              </div>
            )}

            {/* ================================================= */}
            {/* UPLOAD BUTTON */}
            {/* ================================================= */}

            <button
              type="button"
              onClick={
                handleUpload
              }
              disabled={
                uploading ||
                downloading ||
                !selectedInbound ||
                !file
              }
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {uploading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                  Uploading...
                </>
              ) : (
                <>
                  <span>
                    ↑
                  </span>

                  Upload Checking
                </>
              )}

            </button>

          </div>

          {/* ================================================= */}
          {/* INFORMATION */}
          {/* ================================================= */}

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">

            <h3 className="font-semibold text-amber-900">
              Important
            </h3>

            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">

              <li>
                Only inbound with status{" "}
                <strong>
                  checking
                </strong>{" "}
                can be selected.
              </li>

              <li>
                Select the inbound using{" "}
                <strong>
                  Receipt ID
                </strong>
                .
              </li>

              <li>
                The system uses the related{" "}
                <strong>
                  Inbound No
                </strong>{" "}
                internally.
              </li>

              <li>
                Do not modify Item Code, Item Name,
                Unit Model, Barcode, Serial Number,
                or Qty Plan.
              </li>

              <li>
                Fill only Qty Received, Case No,
                Carton No, and Location.
              </li>

              <li>
                Qty Received cannot exceed the
                planned quantity.
              </li>

              <li>
                Uploading the Excel will replace
                existing pending receiving data
                for this inbound.
              </li>

              <li>
                Data that is already{" "}
                <strong>
                  in stock
                </strong>{" "}
                will not be replaced.
              </li>

            </ul>

          </div>

        </div>
      </div>
    </Layout>
  );
}