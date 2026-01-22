import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getRequestContext } from '@cloudflare/next-on-pages';
import type { User, SafeUser, UserInput, UserRole } from '@/types';

// Helper to get the D1 database binding
function getDb(): D1Database {
  const { env } = getRequestContext();
  return env.DB;
}

// ============================================
// Password utilities
// ============================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ============================================
// User CRUD operations
// ============================================

export async function getUserById(id: number): Promise<User | null> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
  return result;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first<User>();
  return result;
}

export function getSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organization: user.organization,
    phone: user.phone,
    region: user.region,
    avatar_url: user.avatar_url,
    verified: Boolean(user.verified),
    created_at: user.created_at,
  };
}

export async function createUser(input: UserInput): Promise<User> {
  const existingUser = await getUserByEmail(input.email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);

  const db = getDb();
  const result = await db.prepare(`
    INSERT INTO users (email, password_hash, name, role, organization, phone, region)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(
    input.email.toLowerCase(),
    passwordHash,
    input.name,
    input.role || 'citizen',
    input.organization || null,
    input.phone || null,
    input.region || null
  ).first<User>();

  return result!;
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  return user;
}

export async function updateUser(id: number, updates: Partial<Omit<User, 'id' | 'password_hash' | 'created_at'>>): Promise<User | null> {
  const allowedFields = ['name', 'organization', 'phone', 'region', 'avatar_url', 'verified', 'email_verified', 'role'];
  const updateFields: string[] = [];
  const values: (string | boolean | number | null)[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      updateFields.push(`${key} = ?`);
      values.push(value as string | boolean | number | null);
    }
  }

  if (updateFields.length === 0) {
    return getUserById(id);
  }

  updateFields.push("updated_at = datetime('now')");
  values.push(id);

  const db = getDb();
  const result = await db.prepare(`
    UPDATE users SET ${updateFields.join(', ')} WHERE id = ?
    RETURNING *
  `).bind(...values).first<User>();

  return result;
}

export async function updatePassword(id: number, newPassword: string): Promise<boolean> {
  const passwordHash = await hashPassword(newPassword);
  const db = getDb();
  const result = await db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").bind(passwordHash, id).run();
  return result.meta.changes > 0;
}

export async function deleteUser(id: number): Promise<boolean> {
  const db = getDb();
  const result = await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  return result.meta.changes > 0;
}

export async function getAllUsers(): Promise<User[]> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM users ORDER BY created_at DESC').all<User>();
  return result.results ?? [];
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
  const db = getDb();
  const result = await db.prepare('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC').bind(role).all<User>();
  return result.results ?? [];
}

// ============================================
// Session management
// ============================================

export async function createSession(userId: number, expiresInHours: number = 24 * 7): Promise<string> {
  const sessionToken = uuidv4();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

  const db = getDb();
  await db.prepare(`
    INSERT INTO sessions (id, session_token, user_id, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind(uuidv4(), sessionToken, userId, expiresAt).run();

  return sessionToken;
}

export async function getSessionByToken(token: string): Promise<{ user_id: number; expires_at: string } | null> {
  const db = getDb();
  const result = await db.prepare('SELECT user_id, expires_at FROM sessions WHERE session_token = ?').bind(token).first<{ user_id: number; expires_at: string }>();
  return result;
}

export async function deleteSession(token: string): Promise<boolean> {
  const db = getDb();
  const result = await db.prepare('DELETE FROM sessions WHERE session_token = ?').bind(token).run();
  return result.meta.changes > 0;
}

export async function deleteExpiredSessions(): Promise<number> {
  const db = getDb();
  const result = await db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
  return result.meta.changes;
}

export async function deleteUserSessions(userId: number): Promise<number> {
  const db = getDb();
  const result = await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
  return result.meta.changes;
}

// ============================================
// Verification token management
// ============================================

export async function createVerificationToken(identifier: string, expiresInHours: number = 24): Promise<string> {
  const token = uuidv4();
  const expires = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

  const db = getDb();
  await db.prepare(`
    INSERT OR REPLACE INTO verification_tokens (identifier, token, expires)
    VALUES (?, ?, ?)
  `).bind(identifier, token, expires).run();

  return token;
}

export async function getVerificationToken(identifier: string, token: string): Promise<{ identifier: string; token: string; expires: string } | null> {
  const db = getDb();
  const result = await db.prepare("SELECT * FROM verification_tokens WHERE identifier = ? AND token = ? AND expires > datetime('now')").bind(identifier, token).first<{ identifier: string; token: string; expires: string }>();
  return result;
}

export async function deleteVerificationToken(identifier: string, token: string): Promise<boolean> {
  const db = getDb();
  const result = await db.prepare('DELETE FROM verification_tokens WHERE identifier = ? AND token = ?').bind(identifier, token).run();
  return result.meta.changes > 0;
}

// ============================================
// Role-based access control
// ============================================

export function hasRole(user: User | SafeUser, roles: UserRole[]): boolean {
  return roles.includes(user.role);
}

export function isAdmin(user: User | SafeUser): boolean {
  return user.role === 'admin';
}

export function isModerator(user: User | SafeUser): boolean {
  return user.role === 'moderator' || user.role === 'admin';
}

export function isAuthority(user: User | SafeUser): boolean {
  return user.role === 'authority' || user.role === 'admin';
}

export function canVerifyIncidents(user: User | SafeUser): boolean {
  return ['moderator', 'admin', 'authority'].includes(user.role);
}

export function canManageUsers(user: User | SafeUser): boolean {
  return user.role === 'admin';
}
