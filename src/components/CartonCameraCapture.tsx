/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  onFallback?: () => void;
}

const GUIDE_WIDTH_RATIO = 0.86;
const GUIDE_HEIGHT_RATIO = 0.42;
const CAMERA_TIMEOUT_MS = 12000;

export default function CartonCameraCapture({
  open,
  onOpenChange,
  onCapture,
  onFallback,
}: CartonCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startRequestRef = useRef(0);

  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setReady(false);
    setCapturing(false);
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  const getCameraErrorMessage = (err: any) => {
    switch (err?.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "Izin kamera ditolak. Aktifkan permission kamera pada browser.";
      case "NotFoundError":
      case "DevicesNotFoundError":
        return "Kamera tidak ditemukan pada device ini.";
      case "NotReadableError":
      case "TrackStartError":
        return "Kamera sedang digunakan aplikasi lain.";
      case "OverconstrainedError":
        return "Konfigurasi kamera tidak didukung. Coba kamera belakang standar.";
      case "SecurityError":
        return "Kamera diblokir. Pastikan website dibuka melalui HTTPS.";
      case "TypeError":
        return "Browser ini tidak mendukung akses kamera langsung.";
      default:
        return "Tidak bisa mengakses kamera pada device ini.";
    }
  };

  useEffect(() => {
    if (!open) {
      stopStream();
      return;
    }

    const requestId = ++startRequestRef.current;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const start = async () => {
      setError("");
      setReady(false);
      setCapturing(false);

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setError(
          "Browser ini tidak mendukung kamera langsung. Gunakan Gallery.",
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 },
          },
        });

        if (cancelled || requestId !== startRequestRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) {
          stream.getTracks().forEach((track) => track.stop());
          throw new Error("Video element is not available.");
        }

        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;

        await new Promise<void>((resolve, reject) => {
          const handleReady = () => resolve();
          const handleError = () =>
            reject(new Error("Video preview failed to load."));

          video.addEventListener("loadedmetadata", handleReady, {
            once: true,
          });
          video.addEventListener("error", handleError, { once: true });

          timeoutId = setTimeout(() => {
            reject(new Error("Camera preview timeout."));
          }, CAMERA_TIMEOUT_MS);

          void video.play().catch(reject);
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (cancelled || requestId !== startRequestRef.current) {
          stopStream();
          return;
        }

        const track = stream.getVideoTracks()[0];
        const capabilities = track?.getCapabilities?.() as any;

        setTorchSupported(Boolean(capabilities?.torch));
        setReady(true);
      } catch (err: any) {
        if (timeoutId) clearTimeout(timeoutId);

        if (!cancelled && requestId === startRequestRef.current) {
          console.error("Camera error:", err);
          stopStream();
          setError(getCameraErrorMessage(err));
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [open, stopStream]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !torchSupported) return;

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

  const handleCapture = () => {
    const video = videoRef.current;

    if (!video || !ready || capturing) return;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (!videoWidth || !videoHeight) {
      setError("Preview kamera belum siap. Tunggu sebentar lalu coba lagi.");
      return;
    }

    setCapturing(true);

    try {
      const cropWidth = Math.max(
        1,
        Math.round(videoWidth * GUIDE_WIDTH_RATIO),
      );
      const cropHeight = Math.max(
        1,
        Math.round(videoHeight * GUIDE_HEIGHT_RATIO),
      );
      const cropX = Math.max(0, Math.round((videoWidth - cropWidth) / 2));
      const cropY = Math.max(0, Math.round((videoHeight - cropHeight) / 2));

      const canvas = document.createElement("canvas");
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas tidak didukung browser ini.");

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
          if (!blob) {
            setCapturing(false);
            setError("Foto gagal dibuat. Silakan coba capture ulang.");
            return;
          }

          const file = new File(
            [blob],
            `carton-label-${Date.now()}.jpg`,
            { type: "image/jpeg" },
          );

          onCapture(file);
          stopStream();
          onOpenChange(false);
        },
        "image/jpeg",
        0.92,
      );
    } catch (err) {
      console.error("Capture error:", err);
      setCapturing(false);
      setError("Gagal mengambil foto. Silakan coba lagi.");
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) stopStream();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-md flex-col gap-0 overflow-hidden border-0 bg-black p-0"
      >
        <DialogHeader className="shrink-0 bg-black px-4 py-3 text-white">
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

        <div className="relative min-h-0 flex-1 bg-black">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm text-white/85">{error}</p>

              <div className="flex flex-wrap justify-center gap-2">
                {onFallback && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                    onClick={() => {
                      stopStream();
                      onOpenChange(false);
                      onFallback();
                    }}
                  >
                    Use Gallery
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => handleClose(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />

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
                <p className="pointer-events-none absolute bottom-5 left-0 right-0 px-4 text-center text-xs font-medium text-white/90 drop-shadow">
                  Posisikan label carton di dalam kotak
                </p>
              )}

              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xs text-white/70">Membuka kamera...</p>
                </div>
              )}
            </>
          )}
        </div>

        {!error && (
          <div className="flex min-h-[96px] shrink-0 items-center justify-center gap-6 bg-black px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {torchSupported ? (
              <button
                type="button"
                onClick={toggleTorch}
                disabled={!ready || capturing}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
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
              disabled={!ready || capturing}
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white bg-white/20 disabled:opacity-40"
              aria-label="Capture photo"
            >
              <span className="h-12 w-12 rounded-full bg-white" />
            </button>

            <button
              type="button"
              onClick={() => handleClose(false)}
              disabled={capturing}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
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
