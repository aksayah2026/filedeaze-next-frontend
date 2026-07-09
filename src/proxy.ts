import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect bare root to unified login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 1. Super Admin Route Protection
  if (pathname.startsWith('/super-admin')) {
    const isSuperAdminLogin = pathname === '/super-admin/login';
    if (!isSuperAdminLogin) {
      const token = request.cookies.get('sa_accessToken')?.value;
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      const payload = decodeJwt(token);
      if (!payload || payload.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  // 2. Tenant / Manager Route Protection
  if (pathname.startsWith('/admin') || pathname.startsWith('/manager')) {
    const isPublicAdmin =
      pathname === '/admin' ||
      pathname === '/admin/login' ||
      /^\/admin\/[^/]+\/login$/.test(pathname) ||
      pathname === '/manager/login';
      
    if (!isPublicAdmin) {
      const token = request.cookies.get('tenant_accessToken')?.value;
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      const payload = decodeJwt(token);
      if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'MANAGER')) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
};
