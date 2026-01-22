export const runtime = 'edge';

import { getSessionFromRequest } from '@/lib/auth-edge';

export async function GET(request: Request) {
  const user = await getSessionFromRequest(request);

  if (!user) {
    return Response.json({ user: null });
  }

  return Response.json({
    user,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  });
}
