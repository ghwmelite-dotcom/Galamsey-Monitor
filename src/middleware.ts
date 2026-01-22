import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, type SessionPayload } from '@/lib/auth-edge';

// Routes that require authentication
const protectedRoutes = ['/admin', '/settings', '/profile'];

// Routes that require specific roles
const adminRoutes = ['/admin'];
const moderatorRoutes = ['/admin/incidents'];

async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  // Check cookies for session token
  const sessionToken = request.cookies.get('session-token')?.value;

  if (sessionToken) {
    return verifySessionToken(sessionToken);
  }

  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifySessionToken(token);
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get the session
  const session = await getSession(request);

  // If no session, redirect to login
  if (!session || !session.user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access for admin routes
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isModeratorRoute = moderatorRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const userRole = session.user.role;

  if (isAdminRoute && !['admin', 'moderator', 'authority'].includes(userRole)) {
    // Redirect to home if user doesn't have access
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (
    isModeratorRoute &&
    !['admin', 'moderator', 'authority'].includes(userRole)
  ) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/settings/:path*',
    '/profile/:path*',
  ],
};
