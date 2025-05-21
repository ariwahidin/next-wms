import { authMiddleware } from './middleware/auth';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    if (req.nextUrl.pathname === '/') {
        const url = new URL('/dashboard', req.nextUrl.origin);
        return NextResponse.redirect(url);
    }
    return authMiddleware(req) || NextResponse.next();
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
