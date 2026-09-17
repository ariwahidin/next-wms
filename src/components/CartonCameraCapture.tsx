/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * CartonCameraCapture.tsx
 *
 * Kamera custom (bukan native camera app lewat <input capture>) supaya
 * bisa menampilkan framing guide (garis putus-putus) di atas live preview,
 * membantu user memposisikan carton label sebelum foto diambil.
 *
 * File ini SENGAJA berdiri sendiri dan tidak mengubah
 * CartonLabelOcrDialog.tsx yang sudah ada. Untuk memakainya, tinggal
 * import komponen ini dan render ketika user menekan tombol "Camera",
 * lalu proses File hasil onCapture() persis seperti file dari
 * <input type="file"> yang lama (lihat catatan integrasi di bawah).
 *
 * ── Cara integrasi (tanpa ubah file lama) ──────────────────────────────
 * 1. Import di CartonLabelOcrDialog.tsx:
 *      import CartonCameraCapture from "./CartonCameraCapture";
 * 2. Tambah state: const [customCameraOpen, setCustomCameraOpen] = useState(false);
 * 3. Ganti onClick tombol "Camera" jadi: () => setCustomCameraOpen(true)
 *    (atau biarkan tombol lama sebagai fallback kalau getUserMedia gagal)
 * 4. Render:
 *      <CartonCameraCapture
 *        open={customCameraOpen}
 *        onOpenChange={setCustomCameraOpen}
 *        onCapture={(file) => handleFileSelected({ target: { files: [file] } } as any)}
 *      />
 *    Atau, lebih rapi, refactor handleFileSelected agar menerima File
 *    langsung (bukan cuma event) supaya tidak perlu "as any".
 * ------------------------------------------------------------------------
 */

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, X, Zap, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CartonCameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}

// Rasio bidang guide relatif terhadap frame video.
// Carton label biasanya landscape (lebih lebar dari tinggi).
const GUIDE_WIDTH_RATIO = 0.86;
const GUIDE_HEIGHT_RATIO = 0.42;

export default function CartonCameraCapture({
  open,
  onOpenChange,
  onCapture,
}: CartonCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  // ── Start / stop camera stream mengikuti buka-tutup dialog ──────────
  useEffect(() => {
    if (!open) {
      stopStream();
      return;
    }

    let cancelled = false;

    const start = async () => {
      setError("");
      setReady(false);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Cek dukungan torch/flash (tidak semua device/browser support).
        const [track] = stream.getVideoTracks();
        const capabilities = track.getCapabilities?.() as any;
        setTorchSupported(Boolean(capabilities?.torch));

        setReady(true);
      } catch (err: any) {
        console.error("Camera error:", err);
        setError(
          err?.name === "NotAllowedError"
            ? "Izin kamera ditolak. Aktifkan izin kamera di browser untuk melanjutkan."
            : "Tidak bisa mengakses kamera. Coba gunakan tombol Gallery sebagai alternatif.",
        );
      }
    };

    void start();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setReady(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;

    try {
      const next = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: next } as any],
      });
      setTorchOn(next);
    } catch (err) {
      console.warn("Torch not supported:", err);
    }
  };

  // ── Capture: crop persis area yang ditunjukkan guide ─────────────────
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !ready) return;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (!videoWidth || !videoHeight) return;

    // Guide dihitung terhadap "object-fit: cover" area video di layar.
    // Karena video asli bisa punya rasio berbeda dari kotak preview,
    // kita hitung crop langsung dari resolusi asli video memakai
    // rasio yang sama seperti overlay (GUIDE_WIDTH_RATIO / HEIGHT_RATIO).
    const cropWidth = Math.round(videoWidth * GUIDE_WIDTH_RATIO);
    const cropHeight = Math.round(videoHeight * GUIDE_HEIGHT_RATIO);
    const cropX = Math.round((videoWidth - cropWidth) / 2);
    const cropY = Math.round((videoHeight - cropHeight) / 2);

    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(
      video,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `carton-label-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file);
        onOpenChange(false);
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) stopStream();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-hidden bg-black p-0 gap-0 border-0">
        <DialogHeader className="px-4 py-3 bg-black">
          <DialogTitle className="flex items-center justify-between text-sm text-white">
            <span className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Scan Carton Label
            </span>
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close camera"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="relative aspect-[3/4] w-full bg-black">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm text-white/80">{error}</p>
              <Button
                type="button"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => handleClose(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover"
              />

              {/* ── Framing guide (dashed) ── */}
              {ready && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div
                    className="relative rounded-md border-2 border-dashed border-white/85"
                    style={{
                      width: `${GUIDE_WIDTH_RATIO * 100}%`,
                      height: `${GUIDE_HEIGHT_RATIO * 100}%`,
                      boxShadow: "0 0 0 999px rgba(0,0,0,0.45)",
                    }}
                  >
                    {/* Corner accents supaya guide terasa lebih presisi */}
                    {[
                      "top-0 left-0 border-t-2 border-l-2 rounded-tl-md",
                      "top-0 right-0 border-t-2 border-r-2 rounded-tr-md",
                      "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-md",
                      "bottom-0 right-0 border-b-2 border-r-2 rounded-br-md",
                    ].map((cls) => (
                      <span
                        key={cls}
                        className={`absolute h-5 w-5 border-blue-400 ${cls}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {ready && (
                <p className="pointer-events-none absolute bottom-24 left-0 right-0 text-center text-xs font-medium text-white/90 drop-shadow">
                  Posisikan label carton di dalam kotak
                </p>
              )}

              {!ready && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xs text-white/70">Membuka kamera...</p>
                </div>
              )}
            </>
          )}
        </div>

        {!error && (
          <div className="flex items-center justify-center gap-6 bg-black px-4 py-4">
            {torchSupported ? (
              <button
                type="button"
                onClick={toggleTorch}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Toggle flash"
              >
                {torchOn ? (
                  <Zap className="h-5 w-5" />
                ) : (
                  <ZapOff className="h-5 w-5" />
                )}
              </button>
            ) : (
              <div className="h-10 w-10" />
            )}

            <button
              type="button"
              onClick={handleCapture}
              disabled={!ready}
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 disabled:opacity-40"
              aria-label="Capture photo"
            >
              <span className="h-12 w-12 rounded-full bg-white" />
            </button>

            <button
              type="button"
              onClick={() => handleClose(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Cancel"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}