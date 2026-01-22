/**
 * API Utilities - Rate limiting, API key validation, and response helpers
 */

import type { ApiKey, ApiTier, ApiPermission } from '@/types';

// D1Database interface for typing
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<unknown>>;
}

interface D1Result<T> {
  results?: T[];
  success: boolean;
  meta?: Record<string, unknown>;
}

// Rate limit configuration by tier
export const RATE_LIMITS: Record<ApiTier, { daily: number; minute: number }> = {
  free: { daily: 100, minute: 10 },
  standard: { daily: 10000, minute: 100 },
  professional: { daily: 100000, minute: 1000 },
  enterprise: { daily: -1, minute: -1 }, // Unlimited
};

// API response helpers
export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return Response.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
}

export function apiError(message: string, status: number = 400, details?: Record<string, unknown>) {
  return Response.json(
    {
      success: false,
      error: message,
      details,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  rateLimitRemaining?: number
) {
  return Response.json({
    success: true,
    data,
    meta: {
      total,
      page,
      per_page: limit,
      total_pages: Math.ceil(total / limit),
      has_more: page * limit < total,
      timestamp: new Date().toISOString(),
      ...(rateLimitRemaining !== undefined && { rate_limit_remaining: rateLimitRemaining }),
    },
  });
}

// Generate API key
export function generateApiKey(): { key: string; prefix: string } {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'gm_'; // Galamsey Monitor prefix

  // Generate 32 random characters
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return {
    key,
    prefix: key.substring(0, 11), // "gm_" + 8 chars
  };
}

// Hash API key for storage
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Validate API key and check rate limits
export async function validateApiKey(
  db: D1Database,
  authHeader: string | null
): Promise<{
  valid: boolean;
  apiKey?: ApiKey;
  error?: string;
  rateLimitRemaining?: number;
}> {
  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  // Extract key from "Bearer <key>" format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return { valid: false, error: 'Invalid Authorization header format. Use: Bearer <api_key>' };
  }

  const key = parts[1];

  // Check key format
  if (!key.startsWith('gm_') || key.length < 20) {
    return { valid: false, error: 'Invalid API key format' };
  }

  // Hash the key for lookup
  const keyHash = await hashApiKey(key);

  // Look up the key
  const result = await db
    .prepare(
      `SELECT
        id, user_id, key_prefix, name, tier, rate_limit_daily, rate_limit_minute,
        permissions, allowed_origins, last_used_at, requests_today, requests_total,
        is_active, expires_at, created_at
       FROM api_keys
       WHERE key_hash = ?`
    )
    .bind(keyHash)
    .first() as {
      id: number;
      user_id: number;
      key_prefix: string;
      name: string;
      tier: string;
      rate_limit_daily: number | null;
      rate_limit_minute: number | null;
      permissions: string;
      allowed_origins: string | null;
      last_used_at: string | null;
      requests_today: number;
      requests_total: number;
      is_active: number;
      expires_at: string | null;
      created_at: string;
    } | null;

  if (!result) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Check if key is active
  if (!result.is_active) {
    return { valid: false, error: 'API key is inactive' };
  }

  // Check expiration
  if (result.expires_at && new Date(result.expires_at as string) < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  const tier = result.tier as ApiTier;
  const rateLimits = RATE_LIMITS[tier];

  // Check daily rate limit (skip for enterprise)
  if (rateLimits.daily !== -1) {
    // Reset counter if it's a new day
    const lastUsed = result.last_used_at ? new Date(result.last_used_at as string) : null;
    const today = new Date();
    const isNewDay = !lastUsed || lastUsed.toDateString() !== today.toDateString();

    const requestsToday = isNewDay ? 0 : (result.requests_today as number);

    if (requestsToday >= rateLimits.daily) {
      return { valid: false, error: 'Daily rate limit exceeded' };
    }

    // Update usage stats
    await db
      .prepare(
        `UPDATE api_keys SET
          requests_today = ?,
          requests_total = requests_total + 1,
          last_used_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(isNewDay ? 1 : requestsToday + 1, result.id)
      .run();

    const apiKey: ApiKey = {
      id: result.id as number,
      user_id: result.user_id as number | undefined,
      key_prefix: result.key_prefix as string,
      name: result.name as string,
      tier,
      rate_limit_daily: result.rate_limit_daily as number,
      rate_limit_minute: result.rate_limit_minute as number,
      permissions: JSON.parse(result.permissions as string),
      allowed_origins: result.allowed_origins ? JSON.parse(result.allowed_origins as string) : undefined,
      last_used_at: result.last_used_at as string | undefined,
      requests_today: (isNewDay ? 1 : requestsToday + 1),
      requests_total: (result.requests_total as number) + 1,
      is_active: result.is_active === 1,
      expires_at: result.expires_at as string | undefined,
      created_at: result.created_at as string,
    };

    return {
      valid: true,
      apiKey,
      rateLimitRemaining: rateLimits.daily - apiKey.requests_today,
    };
  }

  // Enterprise tier (unlimited)
  await db
    .prepare(
      `UPDATE api_keys SET
        requests_total = requests_total + 1,
        last_used_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(result.id)
    .run();

  return {
    valid: true,
    apiKey: {
      id: result.id as number,
      user_id: result.user_id as number | undefined,
      key_prefix: result.key_prefix as string,
      name: result.name as string,
      tier,
      rate_limit_daily: -1,
      rate_limit_minute: -1,
      permissions: JSON.parse(result.permissions as string),
      allowed_origins: result.allowed_origins ? JSON.parse(result.allowed_origins as string) : undefined,
      last_used_at: result.last_used_at as string | undefined,
      requests_today: 0,
      requests_total: (result.requests_total as number) + 1,
      is_active: true,
      expires_at: result.expires_at as string | undefined,
      created_at: result.created_at as string,
    },
  };
}

// Check if API key has required permission
export function hasPermission(apiKey: ApiKey, required: ApiPermission): boolean {
  return apiKey.permissions.includes(required) || apiKey.permissions.includes('admin');
}

// Log API request
export async function logApiRequest(
  db: D1Database,
  apiKeyId: number | null,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO api_requests (api_key_id, endpoint, method, status_code, response_time_ms, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(apiKeyId, endpoint, method, statusCode, responseTimeMs, ipAddress || null, userAgent || null)
      .run();
  } catch (error) {
    console.error('Failed to log API request:', error);
  }
}

// Create new API key
export async function createApiKey(
  db: D1Database,
  userId: number | null,
  name: string,
  tier: ApiTier = 'free',
  permissions: ApiPermission[] = ['read'],
  allowedOrigins?: string[],
  expiresAt?: string
): Promise<{ apiKey: ApiKey; key: string }> {
  const { key, prefix } = generateApiKey();
  const keyHash = await hashApiKey(key);
  const rateLimits = RATE_LIMITS[tier];

  const result = await db
    .prepare(
      `INSERT INTO api_keys (user_id, key_hash, key_prefix, name, tier, rate_limit_daily, rate_limit_minute, permissions, allowed_origins, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id, created_at`
    )
    .bind(
      userId,
      keyHash,
      prefix,
      name,
      tier,
      rateLimits.daily,
      rateLimits.minute,
      JSON.stringify(permissions),
      allowedOrigins ? JSON.stringify(allowedOrigins) : null,
      expiresAt || null
    )
    .first() as { id: number; created_at: string } | null;

  const apiKey: ApiKey = {
    id: result!.id,
    user_id: userId || undefined,
    key_prefix: prefix,
    name,
    tier,
    rate_limit_daily: rateLimits.daily,
    rate_limit_minute: rateLimits.minute,
    permissions,
    allowed_origins: allowedOrigins,
    requests_today: 0,
    requests_total: 0,
    is_active: true,
    expires_at: expiresAt,
    created_at: result!.created_at,
  };

  return { apiKey, key };
}

// Parse pagination params
export function parsePaginationParams(url: URL): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

// Add CORS headers for API responses
export function addCorsHeaders(response: Response, allowedOrigins?: string[]): Response {
  const headers = new Headers(response.headers);

  if (allowedOrigins && allowedOrigins.length > 0) {
    headers.set('Access-Control-Allow-Origin', allowedOrigins.join(', '));
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }

  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
