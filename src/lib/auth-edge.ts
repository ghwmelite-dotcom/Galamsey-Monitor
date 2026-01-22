// Edge-compatible authentication using jose for JWT operations
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  organization?: string;
  phone?: string;
  region?: string;
  verified: boolean;
  image?: string;
}

export interface SessionPayload extends JWTPayload {
  user: UserSession;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production'
);

const JWT_EXPIRES_IN = '7d';

export async function createSessionToken(user: UserSession): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);

  return token;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(request: Request): Promise<UserSession | null> {
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = await verifySessionToken(token);
    return payload?.user || null;
  }

  // Check cookies
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...val] = c.trim().split('=');
        return [key, val.join('=')];
      })
    );

    // Try session-token cookie (our custom auth)
    const sessionToken = cookies['session-token'];
    if (sessionToken) {
      const payload = await verifySessionToken(sessionToken);
      return payload?.user || null;
    }

    // Try next-auth.session-token for backwards compatibility
    const nextAuthToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];
    if (nextAuthToken) {
      const payload = await verifySessionToken(nextAuthToken);
      return payload?.user || null;
    }
  }

  return null;
}

export function createSessionCookie(token: string, secure: boolean = true): string {
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  const secureFlag = secure ? '; Secure' : '';
  return `session-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureFlag}`;
}

export function createLogoutCookie(): string {
  return 'session-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}

// CSRF token generation using Web Crypto API (edge-compatible)
export async function generateCSRFToken(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Hash password comparison using Web Crypto (edge-compatible alternative to bcrypt)
// Note: For bcrypt compatibility, we need to handle this differently
// This is a simple SHA-256 hash for demonstration
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// For bcrypt passwords stored in DB, we need to use bcryptjs which works on edge
// but we'll handle the comparison in the auth-d1.ts file
