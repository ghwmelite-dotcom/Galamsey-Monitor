export const runtime = 'edge';

import { createLogoutCookie } from '@/lib/auth-edge';

export async function POST() {
  const cookie = createLogoutCookie();

  return Response.json(
    { success: true },
    {
      headers: {
        'Set-Cookie': cookie,
      },
    }
  );
}
