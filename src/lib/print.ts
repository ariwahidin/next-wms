
import api from "@/lib/api";

export type PrintMethod = "BROWSER" | "AGENT";

export interface PrintDocumentOptions {
  documentType: string;
  documentNo: string;
  module: string;

  printMethod?: PrintMethod;
  printFormat?: string;

  copyCount?: number;
  printerName?: string;
  reason?: string;
}

export interface PrintLogResponse {
  id: number;
  document_type: string;
  document_no: string;
  module: string;
  print_action: "ORIGINAL" | "REPRINT";
  print_method: PrintMethod;
  print_format: string;
  copy_count: number;
  status: string;
}

export const printDocument = async (
  options: PrintDocumentOptions
): Promise<PrintLogResponse> => {
  const response = await api.post(
    "/print/log",
    {
      document_type: options.documentType,
      document_no: options.documentNo,
      module: options.module,

      print_method: options.printMethod ?? "BROWSER",
      print_format: options.printFormat ?? "PDF",

      copy_count: options.copyCount ?? 1,
      printer_name: options.printerName ?? "",
      reason: options.reason ?? "",
    },
    {
      withCredentials: true,
    }
  );

  if (!response.data?.success || !response.data?.data) {
    throw new Error(
      response.data?.message || "Failed to register print activity"
    );
  }

  const printLog: PrintLogResponse = response.data.data;

  // Execute browser printing only after logging succeeds.
  if (options.printMethod === "AGENT") {
    return printLog;
  }

  window.print();

  return printLog;
};
