import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const protectedPaths = ['/dashboard', '/pos', '/products', '/orders', '/staff'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtectedPath) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
      const { payload } = await jwtVerify(token, secret);
      const role = payload.role as string;

      // Role-based access control
      if (pathname.startsWith('/staff') && role !== 'owner') {
        return NextResponse.redirect(new URL('/pos', request.url));
      }

      if (pathname.startsWith('/dashboard') && role !== 'owner') {
        return NextResponse.redirect(new URL('/pos', request.url));
      }

    } catch (err) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect from login if already authenticated
  if (pathname === '/login' && token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
      const { payload } = await jwtVerify(token, secret);
      const role = payload.role as string;
      return NextResponse.redirect(new URL(role === 'owner' ? '/dashboard' : '/pos', request.url));
    } catch (err) {
      // Token invalid, allow login page
    }
  }

  // Root redirect
  if (pathname === '/') {
    if (!token) return NextResponse.redirect(new URL('/login', request.url));
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
      const { payload } = await jwtVerify(token, secret);
      const role = payload.role as string;
      return NextResponse.redirect(new URL(role === 'owner' ? '/dashboard' : '/pos', request.url));
    } catch (err) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/products/:path*',
    '/pos/:path*',
    '/orders/:path*',
    '/staff/:path*',
  ],
};
