# CONTEXT.md — WMS Picking Feature

## Stack
- Backend: Go + Fiber
- Frontend: Next.js + TypeScript
- Database: SQL Server
- Pattern: Handler → Service → Repository

## Fitur yang Dibangun
Outbound Picking — operator scan barcode/QR produk untuk memenuhi picking order.

## Alur Picking
1. Operator buka halaman picking, pilih shipment/order
2. Sistem tampilkan list item yang harus dipick
3. Operator scan QR/barcode per unit atau carton
4. Sistem validasi: SKU cocok, qty belum over-pick, stok tersedia
5. Hanya scan lokasi, dan item saja (performa harus super cepat)
6. Progress terupdate realtime per item
7. Setelah semua item complete → picking order bisa di-confirm

## QR Format 
- Parenthesis-style: (01)06933257941045(10)BATCH(17)260312(30)20
- 12-segment dash-separated
- Label type: UNIT | CARTON
- Fungsi parser: `parseQRCode` — jangan dibuat ulang, pakai yang sudah ada

## Struktur Data Utama
- OutboundHeader
- OutboundDetail
- OutboundPicking (ini adalah table item yang harus dipicking harus sesuai, karena ini system yang generate berdasarkan alur yang berlaku)
- OutboundPickingScan (belum di buat, ini yang kamu harus buat, tempat menyimpan hasil scan picking)

## Konvensi Frontend
- Komponen: `OutboundPickingPage.tsx`
- Scan handler: debounce 300ms, cek duplikat scan
- Over-pick harus ditolak dengan pesan jelas
- Progress tampil per item (qty_picked / qty_required)
- Error: toast notification, bukan alert/modal
- Loading state saat hit API

## Konvensi Backend (Go/Fiber)
- Route prefix: `/api/wms/picking`
- Handler di `/controller/mobile/outbound_controller.go`

## Model, Controller, frontend
- model, controller, format frontend yang existing akan saya share, setelah kamu paham, agar tidak bikin format baru
