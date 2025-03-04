import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '../utils/cookies'; // 🔗 Panggil helper untuk baca token
export function authMiddleware(req: NextRequest) {
    const token = getToken(req); // 🍪 Ambil token dari cookie
    console.log('🛑 Middleware auth berjalan untuk:', req.nextUrl.pathname);
    console.log('🔐 Token:', token);

    if (!token) {
        // 🚨 Jika user belum login, redirect ke halaman login
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    return NextResponse.next(); // ✅ Lanjutkan ke halaman yang diminta
}
