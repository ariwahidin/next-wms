/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-page-custom-font */
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function ShopeeNotificationSuccess() {
  const router = useRouter();
  const { status } = router.query;
  const isSuccess = status === "success";

  const [visible, setVisible] = useState(false);
  const [countDown, setCountDown] = useState(5);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isSuccess) return;
    if (countDown === 0) {
      router.push("/wms/dashboard");
      return;
    }
    const t = setTimeout(() => setCountDown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countDown, isSuccess]);

  return (
    <>
      <Head>
        <title>
          {isSuccess ? "Terhubung ke Shopee — Berhasil" : "Otorisasi Gagal"}
        </title>
        <meta
          name="description"
          content="Halaman notifikasi otorisasi seller Shopee"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="page-root">
        {/* Ambient blobs */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="grain" />

        <main className={`card ${visible ? "card--in" : ""}`}>
          {/* Top stripe */}
          <div className={`stripe ${isSuccess ? "stripe--success" : "stripe--error"}`} />

          {/* Icon */}
          <div className={`icon-wrap ${isSuccess ? "icon-wrap--success" : "icon-wrap--error"}`}>
            {isSuccess ? (
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="24" className="icon-circle" />
                <path
                  d="M14 24.5L21 31.5L34 17"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="checkmark"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="24" className="icon-circle" />
                <path
                  d="M16 16L32 32M32 16L16 32"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>

          {/* Badge */}
          <div className="shopee-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
            Shopee Partner
          </div>

          {/* Content */}
          <div className="content">
            <h1 className="title">
              {isSuccess ? "Toko Berhasil Terhubung!" : "Otorisasi Gagal"}
            </h1>
            <p className="desc">
              {isSuccess
                ? "Akun seller Shopee kamu sudah berhasil dihubungkan dengan platform kami. Kamu sekarang dapat mengelola toko, produk, dan pesanan langsung dari dashboard."
                : "Terjadi kesalahan saat menghubungkan akun Shopee kamu. Silakan coba lagi atau hubungi tim support jika masalah berlanjut."}
            </p>

            {isSuccess && (
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-icon">🔐</span>
                  <span>Akses aman</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">🔄</span>
                  <span>Sinkronisasi otomatis</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">📦</span>
                  <span>Manajemen produk</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">📊</span>
                  <span>Laporan penjualan</span>
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="cta-area">
            {isSuccess ? (
              <>
                <button
                  className="btn btn--primary"
                  onClick={() => router.push("/wms/dashboard")}
                >
                  Pergi ke Dashboard
                </button>
                <p className="auto-redirect">
                  Dialihkan otomatis dalam{" "}
                  <span className="countdown">{countDown}s</span>
                </p>
              </>
            ) : (
              <>
                <button
                  className="btn btn--primary btn--error"
                  onClick={() => router.push("/connect/shopee")}
                >
                  Coba Lagi
                </button>
                <button
                  className="btn btn--ghost"
                  onClick={() => router.push("/")}
                >
                  Kembali ke Beranda
                </button>
              </>
            )}
          </div>
        </main>

        <style jsx global>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #0b0d12; font-family: 'Plus Jakarta Sans', sans-serif; }
        `}</style>

        <style jsx>{`
          /* ---------- Layout ---------- */
          .page-root {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0b0d12;
            padding: 24px;
            position: relative;
            overflow: hidden;
          }

          /* ---------- Ambient blobs ---------- */
          .blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.18;
            pointer-events: none;
          }
          .blob-1 {
            width: 500px; height: 500px;
            background: ${isSuccess ? "#f26522" : "#e53e3e"};
            top: -120px; left: -80px;
          }
          .blob-2 {
            width: 400px; height: 400px;
            background: ${isSuccess ? "#ee4d2d" : "#fc8181"};
            bottom: -100px; right: -60px;
          }

          /* ---------- Grain overlay ---------- */
          .grain {
            position: absolute;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
            pointer-events: none;
            opacity: 0.5;
          }

          /* ---------- Card ---------- */
          .card {
            position: relative;
            background: #13161e;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 24px;
            width: 100%;
            max-width: 460px;
            padding: 0 0 36px;
            overflow: hidden;
            box-shadow:
              0 0 0 1px rgba(255,255,255,0.04),
              0 24px 64px rgba(0,0,0,0.5);
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease, transform 0.5s ease;
          }
          .card--in {
            opacity: 1;
            transform: translateY(0);
          }

          /* ---------- Top stripe ---------- */
          .stripe {
            height: 5px;
            width: 100%;
          }
          .stripe--success {
            background: linear-gradient(90deg, #ee4d2d, #f26522, #ffbe00);
          }
          .stripe--error {
            background: linear-gradient(90deg, #e53e3e, #fc8181);
          }

          /* ---------- Icon ---------- */
          .icon-wrap {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 32px auto 0;
            width: 80px;
            height: 80px;
          }
          .icon-wrap svg { width: 80px; height: 80px; }

          .icon-wrap--success .icon-circle { fill: #ee4d2d; }
          .icon-wrap--error .icon-circle { fill: #e53e3e; }

          /* Checkmark draw animation */
          .checkmark {
            stroke-dasharray: 30;
            stroke-dashoffset: 30;
            animation: draw 0.5s ease 0.4s forwards;
          }
          @keyframes draw {
            to { stroke-dashoffset: 0; }
          }

          /* ---------- Shopee badge ---------- */
          .shopee-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin: 20px auto 0;
            padding: 5px 12px;
            border-radius: 999px;
            background: rgba(238, 77, 45, 0.12);
            border: 1px solid rgba(238, 77, 45, 0.3);
            color: #f26522;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            width: fit-content;
            margin-left: auto;
            margin-right: auto;
            display: flex;
          }

          /* ---------- Content ---------- */
          .content {
            padding: 20px 32px 0;
            text-align: center;
          }
          .title {
            font-size: 26px;
            font-weight: 800;
            color: #f0f2f7;
            line-height: 1.2;
            letter-spacing: -0.02em;
            margin-bottom: 12px;
          }
          .desc {
            font-size: 14.5px;
            color: #7a8299;
            line-height: 1.7;
          }

          /* ---------- Info grid ---------- */
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 24px;
          }
          .info-item {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 10px;
            padding: 10px 14px;
            font-size: 13px;
            color: #a0a8bc;
            font-weight: 500;
          }
          .info-icon { font-size: 16px; }

          /* ---------- CTA ---------- */
          .cta-area {
            padding: 28px 32px 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
            align-items: center;
          }
          .btn {
            width: 100%;
            padding: 14px 24px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            border: none;
            font-family: inherit;
            transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
          }
          .btn:hover { transform: translateY(-1px); }
          .btn:active { transform: translateY(0); opacity: 0.85; }

          .btn--primary {
            background: linear-gradient(135deg, #ee4d2d, #f26522);
            color: #fff;
            box-shadow: 0 4px 20px rgba(238, 77, 45, 0.35);
          }
          .btn--primary:hover {
            box-shadow: 0 6px 28px rgba(238, 77, 45, 0.5);
          }
          .btn--error {
            background: linear-gradient(135deg, #e53e3e, #fc8181);
            box-shadow: 0 4px 20px rgba(229, 62, 62, 0.35);
          }
          .btn--ghost {
            background: transparent;
            color: #7a8299;
            border: 1px solid rgba(255,255,255,0.08);
          }
          .btn--ghost:hover { color: #f0f2f7; border-color: rgba(255,255,255,0.18); }

          .auto-redirect {
            font-size: 13px;
            color: #4a5068;
          }
          .countdown {
            color: #f26522;
            font-weight: 700;
          }
        `}</style>
      </div>
    </>
  );
}