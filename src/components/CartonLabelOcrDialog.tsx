/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  ScanText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CartonOcrResult,
  getCartonOcrErrorMessage,
  isCartonOcrComplete,
  parseCartonLabelOcr,
} from "@/utils/cartonLabelOcr";

export interface CartonOcrPayload {
  case_number: string | null;
  ctn_no: number | null;
  total_ctn: number | null;
}

interface CartonLabelOcrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (payload: CartonOcrPayload) => void;
}

type OcrStatus = "idle" | "processing" | "done" | "error";

const MAX_IMAGE_SIZE = 2200;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image."));
    };

    image.src = url;
  });
}

function applyGrayscaleContrast(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  threshold = false,
) {
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray =
      data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

    const contrast = (gray - 128) * 1.65 + 128;
    const value = Math.max(0, Math.min(255, contrast));

    if (threshold) {
      const binary = value >= 165 ? 255 : 0;
      data[i] = binary;
      data[i + 1] = binary;
      data[i + 2] = binary;
    } else {
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }
  }

  context.putImageData(imageData, 0, 0);
}

async function preprocessImage(file: File, threshold = false) {
  const image = await loadImage(file);

  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;

  const scale = Math.min(
    1,
    MAX_IMAGE_SIZE / Math.max(sourceWidth, sourceHeight),
  );

  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas is not supported by this browser.");
  }

  context.drawImage(image, 0, 0, width, height);
  applyGrayscaleContrast(context, width, height, threshold);

  return canvas;
}

/**
 * Crop the C/NO line from the original image.
 *
 * Preferred mode:
 * - use Tesseract word bounding boxes to locate C/NO.
 *
 * Fallback mode:
 * - use a broad lower-middle crop that matches the supplied Furuno label.
 */
async function createCartonLineCrop(
  file: File,
  words: any[] = [],
  threshold = false,
) {
  const image = await loadImage(file);

  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;

  const scale = Math.min(
    1,
    MAX_IMAGE_SIZE / Math.max(sourceWidth, sourceHeight),
  );

  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const scaled = document.createElement("canvas");
  scaled.width = width;
  scaled.height = height;

  const scaledContext = scaled.getContext("2d", {
    willReadFrequently: true,
  });

  if (!scaledContext) {
    throw new Error("Canvas is not supported by this browser.");
  }

  scaledContext.drawImage(image, 0, 0, width, height);

  const normalizeWord = (value: string) =>
    value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .replace(/1/g, "I");

  const cartonWord = words.find((word) => {
    const text = normalizeWord(String(word?.text ?? ""));
    return (
      text.includes("CNO") ||
      text.includes("INO") ||
      text === "CNO" ||
      text === "NO"
    );
  });

  let cropX: number;
  let cropY: number;
  let cropWidth: number;
  let cropHeight: number;

  if (
    cartonWord?.bbox &&
    Number.isFinite(cartonWord.bbox.x0) &&
    Number.isFinite(cartonWord.bbox.y0) &&
    Number.isFinite(cartonWord.bbox.x1) &&
    Number.isFinite(cartonWord.bbox.y1)
  ) {
    // Tesseract coordinates belong to the scaled image because the first
    // OCR pass also receives the scaled canvas.
    const box = cartonWord.bbox;

    cropX = Math.max(0, box.x0 - 30);
    cropY = Math.max(0, box.y0 - 25);
    cropWidth = Math.min(width - cropX, width - cropX - 5);
    cropHeight = Math.min(height - cropY, Math.max(100, box.y1 - box.y0 + 55));
  } else {
    // Fallback for the supplied Furuno label layout.
    cropX = Math.round(width * 0.16);
    cropY = Math.round(height * 0.42);
    cropWidth = Math.round(width * 0.70);
    cropHeight = Math.round(height * 0.23);
  }

  cropWidth = Math.max(1, Math.min(cropWidth, width - cropX));
  cropHeight = Math.max(1, Math.min(cropHeight, height - cropY));

  // Upscale the crop so the final digits have more pixels for OCR.
  const upscale = 3;
  const crop = document.createElement("canvas");
  crop.width = cropWidth * upscale;
  crop.height = cropHeight * upscale;

  const cropContext = crop.getContext("2d", { willReadFrequently: true });

  if (!cropContext) {
    throw new Error("Canvas is not supported by this browser.");
  }

  cropContext.imageSmoothingEnabled = false;
  cropContext.drawImage(
    scaled,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    crop.width,
    crop.height,
  );

  applyGrayscaleContrast(cropContext, crop.width, crop.height, threshold);

  return crop;
}

function buildProgressMessage(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("loading")) return "Loading OCR engine...";
  if (normalized.includes("initializing")) return "Initializing OCR...";
  if (normalized.includes("recognizing")) return "Reading label...";
  if (normalized.includes("loaded")) return "OCR engine ready...";

  return "Processing image...";
}

function mergeResults(
  first: CartonOcrResult,
  second: CartonOcrResult,
): CartonOcrResult {
  return {
    case_number: second.case_number ?? first.case_number,
    ctn_no: second.ctn_no ?? first.ctn_no,
    total_ctn: second.total_ctn ?? first.total_ctn,
    raw_text: [first.raw_text, second.raw_text]
      .filter(Boolean)
      .join("\n\n--- CARTON LINE OCR ---\n\n"),
    confidence: second.confidence ?? first.confidence ?? null,
  };
}

export default function CartonLabelOcrDialog({
  open,
  onOpenChange,
  onDetected,
}: CartonLabelOcrDialogProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [status, setStatus] = useState<OcrStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<CartonOcrResult | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const reset = () => {
    setSelectedFile(null);
    setStatus("idle");
    setProgress(0);
    setProgressMessage("");
    setErrorMessage("");
    setResult(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && status !== "processing") {
      reset();
    }

    onOpenChange(nextOpen);
  };

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file.");
      setStatus("error");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("idle");
    setProgress(0);
    setProgressMessage("");
    setErrorMessage("");
    setResult(null);
  };

  const runOcr = async () => {
    if (!selectedFile) return;

    setStatus("processing");
    setProgress(1);
    setProgressMessage("Preparing image...");
    setErrorMessage("");

    let worker: any = null;

    try {
      const { createWorker, PSM } = await import("tesseract.js");

      worker = await createWorker("eng", 1, {
        logger: (message: { status: string; progress: number }) => {
          setProgress(
            Math.max(1, Math.min(99, Math.round(message.progress * 100))),
          );
          setProgressMessage(buildProgressMessage(message.status));
        },
      });

      // First pass: whole label. This is mainly for Case Number and for
      // locating the C/NO line through word bounding boxes.
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
      });

      const enhancedCanvas = await preprocessImage(selectedFile, false);
      const firstPass = await worker.recognize(enhancedCanvas);

      const firstResult = parseCartonLabelOcr(
        firstPass.data.text,
        typeof firstPass.data.confidence === "number"
          ? firstPass.data.confidence
          : null,
      );

      let finalResult = firstResult;

      // Second pass: specifically OCR the C/NO line at a much larger size.
      // This addresses cases such as 156 being returned as 15.
      if (
        firstResult.ctn_no === null ||
        firstResult.total_ctn === null ||
        firstResult.ctn_no > firstResult.total_ctn
      ) {
        setProgressMessage("Reading carton number...");
        setProgress(70);

        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
          preserve_interword_spaces: "1",
          user_defined_dpi: "300",
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:/.- ",
        });

        const cartonCrop = await createCartonLineCrop(
          selectedFile,
          firstPass.data.words ?? [],
          false,
        );

        const cartonPass = await worker.recognize(cartonCrop);
        const cartonResult = parseCartonLabelOcr(
          cartonPass.data.text,
          typeof cartonPass.data.confidence === "number"
            ? cartonPass.data.confidence
            : null,
        );

        finalResult = mergeResults(firstResult, cartonResult);

        // One additional binary pass only when the enlarged line is still
        // incomplete/invalid. It is intentionally limited to the C/NO crop.
        if (!isCartonOcrComplete(finalResult)) {
          setProgressMessage("Enhancing carton number...");
          setProgress(84);

          const binaryCartonCrop = await createCartonLineCrop(
            selectedFile,
            firstPass.data.words ?? [],
            true,
          );

          const binaryPass = await worker.recognize(binaryCartonCrop);
          const binaryResult = parseCartonLabelOcr(
            binaryPass.data.text,
            typeof binaryPass.data.confidence === "number"
              ? binaryPass.data.confidence
              : null,
          );

          finalResult = mergeResults(finalResult, binaryResult);
        }
      }

      if (isCartonOcrComplete(finalResult)) {
        setProgress(100);
        setProgressMessage("Label read successfully.");

        // Directly push the result into the parent form.
        onDetected({
          case_number: finalResult.case_number,
          ctn_no: finalResult.ctn_no,
          total_ctn: finalResult.total_ctn,
        });

        // No review screen: close immediately after the payload is applied.
        reset();
        onOpenChange(false);
        return;
      }

      // Only stay open when the OCR result cannot be safely verified.
      setResult(finalResult);
      setProgress(100);
      setProgressMessage("Carton label could not be verified.");
      setStatus("done");
      setErrorMessage(getCartonOcrErrorMessage(finalResult));
    } catch (error: any) {
      console.error("Carton OCR error:", error);
      setStatus("error");
      setProgress(0);
      setProgressMessage("");
      setErrorMessage(
        error?.message ||
          "Failed to read the carton label. Please retake the photo.",
      );
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (terminateError) {
          console.warn("Failed to terminate OCR worker:", terminateError);
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto bg-slate-50 p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b bg-white">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <ScanText className="h-4 w-4 text-blue-600" />
            Scan Carton Label
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 p-3">
          {!selectedFile && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Camera className="h-6 w-6" />
                </div>

                <h2 className="mt-3 text-sm font-semibold text-gray-800">
                  Scan carton label
                </h2>

                <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500">
                  Capture the label containing the Case Number and C/NO.
                </p>

                <div className="mt-4 grid w-full grid-cols-2 gap-2">
                  <Button
                    type="button"
                    className="h-10 bg-blue-500 text-sm hover:bg-blue-600"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Camera
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 text-sm"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Gallery
                  </Button>
                </div>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelected}
                />

                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelected}
                />
              </div>
            </div>
          )}

          {selectedFile && previewUrl && (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between gap-2 border-b bg-gray-50 px-3 py-2">
                <span className="truncate text-xs font-medium text-gray-700">
                  {selectedFile.name}
                </span>

                {status !== "processing" && (
                  <button
                    type="button"
                    onClick={reset}
                    className="shrink-0 text-xs font-medium text-gray-500 hover:text-gray-800"
                  >
                    Change
                  </button>
                )}
              </div>

              <div className="bg-gray-100 p-2">
                <img
                  src={previewUrl}
                  alt="Selected carton label"
                  className="max-h-[300px] w-full rounded-md object-contain"
                />
              </div>

              {status === "processing" && (
                <div className="space-y-2 border-t px-3 py-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-gray-700">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      {progressMessage || "Processing..."}
                    </div>
                    <span className="font-mono text-gray-500">
                      {progress}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {status === "idle" && (
                <div className="grid grid-cols-2 gap-2 border-t p-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    onClick={reset}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retake
                  </Button>

                  <Button
                    type="button"
                    className="h-10 bg-blue-500 hover:bg-blue-600"
                    onClick={runOcr}
                  >
                    <ScanText className="mr-2 h-4 w-4" />
                    Read Label
                  </Button>
                </div>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">OCR failed</p>
                <p className="mt-0.5 leading-5">{errorMessage}</p>
              </div>
            </div>
          )}

          {status === "done" && result && (
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-amber-800">
                      Carton label could not be verified
                    </p>
                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={reset}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Scan Again
                </Button>

                <Button
                  type="button"
                  className="h-10 bg-blue-500 hover:bg-blue-600"
                  onClick={() => {
                    onDetected({
                      case_number: result.case_number,
                      ctn_no: result.ctn_no,
                      total_ctn: result.total_ctn,
                    });

                    reset();
                    onOpenChange(false);
                  }}
                >
                  Use This Data
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
