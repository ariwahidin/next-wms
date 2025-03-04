import { NextRequest } from 'next/server';

export function getToken(req: NextRequest) {
    return req.cookies.get('token') || null;
}
