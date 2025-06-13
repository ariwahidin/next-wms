// import { authMiddleware } from './middleware/auth';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    // if (req.nextUrl.pathname === '/') {
    //     const url = new URL('/dashboard', req.nextUrl.origin);
    //     return NextResponse.redirect(url);
    // }
    // return authMiddleware(req) || NextResponse.next();

    const allCookies = req.cookies.getAll();
    console.log("✅ All cookies received in middleware:", allCookies);

    const token = req.cookies.get('next-auth-token')?.value;
    // const tokenPublic = req.cookies.get('token_public')?.value;

    if (!token) {
        const url = new URL('/auth/login', req.nextUrl.origin);
        return NextResponse.redirect(url);
    }

    const response = NextResponse.next();

    // Tambahkan custom header untuk response
    response.headers.set('x-custom-headerx', token ?? 'no-token');
    // console.log('🛑 Middleware berjalan untuk:', req.nextUrl.pathname);
    // console.log('🔐 Token Public:', tokenPublic);
    // console.log('🔐 Token:', token);
    console.log('🔐 All cookies:', allCookies);
    return response;
}

export const config = {
    matcher: [
        '/wms/:path*',
        '/mobile/:path*',
        // '/dashboard/:path*',
        // '/inbound/:path*',
        // '/outbound/:path*',
        // '/rf/:path*',
    ],
};
