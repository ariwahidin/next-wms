// import { authMiddleware } from './middleware/auth';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    // if (req.nextUrl.pathname === '/') {
    //     const url = new URL('/dashboard', req.nextUrl.origin);
    //     return NextResponse.redirect(url);
    // }
    // return authMiddleware(req) || NextResponse.next();

    const token = req.cookies.get('token')?.value;
    const response = NextResponse.next();

    // Tambahkan custom header untuk response
    response.headers.set('x-custom-headerx', token ?? 'no-token');
    console.log('🛑 Middleware berjalan untuk:', req.nextUrl.pathname);
    return response;
}

export const config = {
    matcher: [
        // '/dashboard/:path*',
        '/master/:path*',
        // '/inbound/:path*',
        // '/outbound/:path*',
        // '/rf/:path*',
    ],
};
