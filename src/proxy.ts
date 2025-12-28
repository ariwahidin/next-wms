import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {

    const allCookies = req.cookies.getAll();
    console.log("✅ All cookies received in middleware:", allCookies);

    const token = req.cookies.get('wms-auth-token')?.value;

    if (!token) {
        const url = new URL('/auth/login', req.nextUrl.origin);
        return NextResponse.redirect(url);
    }

    const response = NextResponse.next();

    // Tambahkan custom header untuk response
    response.headers.set('x-custom-headerx', token ?? 'no-token');
    console.log('🔐 All cookies:', allCookies);
    return response;
}

export const config = {
    matcher: [
        '/wms/:path*',
        '/mobile/:path*',
    ],
};
