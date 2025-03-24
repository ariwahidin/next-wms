import { authMiddleware } from './middleware/auth';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    console.log('🛑 Middleware berjalan untuk:', req.nextUrl.pathname);

    // Periksa apakah pengguna mengakses root URL `/`
    if (req.nextUrl.pathname === '/') {
        const url = new URL('/dashboard', req.nextUrl.origin); // Redirect ke /dashboard
        return NextResponse.redirect(url);
    }

    return authMiddleware(req) || NextResponse.next(); // Pastikan selalu mengembalikan response
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/master/:path*',
        '/inbound/:path*',
        '/outbound/:path*',
        '/rf/:path*',
    ],
};
