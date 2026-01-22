export const runtime = 'edge';

import { authenticateUser, getSafeUser } from '@/lib/auth-d1';
import { createSessionToken, createSessionCookie, type UserSession } from '@/lib/auth-edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const safeUser = getSafeUser(user);

    const sessionUser: UserSession = {
      id: safeUser.id.toString(),
      email: safeUser.email,
      name: safeUser.name,
      role: safeUser.role,
      organization: safeUser.organization,
      phone: safeUser.phone,
      region: safeUser.region,
      verified: safeUser.verified,
      image: safeUser.avatar_url,
    };

    const token = await createSessionToken(sessionUser);
    const isSecure = request.url.startsWith('https://');
    const cookie = createSessionCookie(token, isSecure);

    return Response.json(
      {
        success: true,
        user: sessionUser,
        token // Also return token for clients that prefer header-based auth
      },
      {
        headers: {
          'Set-Cookie': cookie,
        },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
