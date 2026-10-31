import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response, NextFunction } from 'express';

export const ADMIN_EMAIL = 'Youceftalamali@gmail.com';

export interface ServerUser {
  id: string;
  email: string;
  passwordHash?: string;
  salt?: string;
  role: 'admin' | 'user';
  plan: 'free' | 'starter' | 'pro' | 'business';
  trialGenerationsUsed: number;
  trialGenerationsLimit: number;
  monthlyGenerationsUsed: number;
  monthlyGenerationsLimit: number;
  createdAt: string;
  lastLoginAt: string;
}

export interface ServerSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  ip: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const AUTH_FILE = path.join(DATA_DIR, 'server-auth.json');

// In-Memory Data Store (backed by persistent JSON file)
let users: Map<string, ServerUser> = new Map();
let sessions: Map<string, ServerSession> = new Map();
const rateLimitMap: Map<string, RateLimitEntry> = new Map();

// Helper: Ensure Data Directory
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Helper: Load persistent auth data
function loadAuthData() {
  try {
    ensureDataDir();
    if (fs.existsSync(AUTH_FILE)) {
      const raw = fs.readFileSync(AUTH_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.users)) {
        users = new Map(data.users.map((u: ServerUser) => [u.id, u]));
      }
      if (Array.isArray(data.sessions)) {
        const now = Date.now();
        // Filter out expired sessions
        const validSessions = data.sessions.filter((s: ServerSession) => s.expiresAt > now);
        sessions = new Map(validSessions.map((s: ServerSession) => [s.token, s]));
      }
    }
  } catch (err) {
    console.warn('Failed to load auth data from disk, initializing fresh:', err);
  }

  // Ensure default Admin user exists
  ensureAdminUser();
}

// Helper: Save persistent auth data
function saveAuthData() {
  // Fail closed: never report a successful signup/session if persistence failed.
  ensureDataDir();
  const payload = {
    users: Array.from(users.values()),
    sessions: Array.from(sessions.values()),
  };
  const temporaryFile = `${AUTH_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(payload, null, 2), { encoding: 'utf-8', mode: 0o600 });
  fs.renameSync(temporaryFile, AUTH_FILE);
}

// Ensure pre-seeded administrator
function ensureAdminUser() {
  const existingAdmin = Array.from(users.values()).find(
    (u) => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  if (!existingAdmin && process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 16) {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(process.env.ADMIN_PASSWORD, salt);

    const adminUser: ServerUser = {
      id: 'admin-' + crypto.randomBytes(6).toString('hex'),
      email: ADMIN_EMAIL,
      passwordHash,
      salt,
      role: 'admin',
      plan: 'business',
      trialGenerationsUsed: 0,
      trialGenerationsLimit: 999999,
      monthlyGenerationsUsed: 0,
      monthlyGenerationsLimit: 999999,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    users.set(adminUser.id, adminUser);
    saveAuthData();
  }
}

// Initialize on module load
loadAuthData();

// Password Hashing
export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

// Generate Secure Session Token
export function createSession(userId: string, ip: string, maxAgeDays = 7): ServerSession {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const session: ServerSession = {
    token,
    userId,
    createdAt: now,
    expiresAt: now + maxAgeDays * 24 * 60 * 60 * 1000,
    ip,
  };

  sessions.set(token, session);
  saveAuthData();
  return session;
}

export function destroySession(token: string): boolean {
  const existed = sessions.delete(token);
  if (existed) {
    saveAuthData();
  }
  return existed;
}

export function getSession(token?: string | null): ServerSession | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    saveAuthData();
    return null;
  }

  return session;
}

export function getUserById(userId: string): ServerUser | null {
  return users.get(userId) || null;
}

export function getUserByEmail(email: string): ServerUser | null {
  const clean = email.trim().toLowerCase();
  for (const user of users.values()) {
    if (user.email.toLowerCase() === clean) {
      return user;
    }
  }
  return null;
}

export function getAllUsers(): ServerUser[] {
  return Array.from(users.values());
}

export function updateUser(id: string, updates: Partial<ServerUser>): ServerUser | null {
  const user = users.get(id);
  if (!user) return null;

  const updated: ServerUser = { ...user, ...updates };
  users.set(id, updated);
  saveAuthData();
  return updated;
}

export function createUser(email: string, password: string): ServerUser {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('INVALID_EMAIL');
  }
  if (cleanEmail === ADMIN_EMAIL.toLowerCase()) throw new Error('ADMIN_REGISTRATION_DISABLED');
  if (password.length < 10 || password.length > 128) throw new Error('WEAK_PASSWORD');
  if (getUserByEmail(cleanEmail)) throw new Error('ACCOUNT_EXISTS');

  const salt = crypto.randomBytes(16).toString('hex');
  const user: ServerUser = {
    id: 'user-' + crypto.randomBytes(16).toString('hex'),
    email: cleanEmail,
    passwordHash: hashPassword(password, salt),
    salt,
    role: 'user',
    plan: 'free',
    trialGenerationsUsed: 0,
    trialGenerationsLimit: 1,
    monthlyGenerationsUsed: 0,
    monthlyGenerationsLimit: 0,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
  users.set(user.id, user);
  saveAuthData();
  return user;
}

export function authenticateUser(email: string, password: string): ServerUser | null {
  const user = getUserByEmail(email);
  if (!user?.passwordHash || !user.salt) return null;
  if (!verifyPassword(password, user.salt, user.passwordHash)) return null;
  const updated = { ...user, lastLoginAt: new Date().toISOString() };
  users.set(user.id, updated);
  saveAuthData();
  return updated;
}

export function setUserPassword(userId: string, password: string): ServerUser | null {
  if (password.length < 16 || password.length > 128) return null;
  const user = users.get(userId);
  if (!user) return null;
  const salt = crypto.randomBytes(16).toString('hex');
  const updated = { ...user, salt, passwordHash: hashPassword(password, salt) };
  users.set(userId, updated);
  saveAuthData();
  return updated;
}

export function registerOrGetUser(email: string, role: 'admin' | 'user' = 'user'): ServerUser {
  const cleanEmail = email.trim().toLowerCase();
  const existing = getUserByEmail(cleanEmail);
  if (existing) {
    return existing;
  }

  const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
  const newUser: ServerUser = {
    id: 'user-' + crypto.randomBytes(6).toString('hex'),
    email: cleanEmail,
    role: isAdmin ? 'admin' : role,
    plan: isAdmin ? 'business' : 'free',
    trialGenerationsUsed: 0,
    trialGenerationsLimit: 1, // 1 free trial ad strictly enforced by server
    monthlyGenerationsUsed: 0,
    monthlyGenerationsLimit: isAdmin ? 999999 : 1,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  users.set(newUser.id, newUser);
  saveAuthData();
  return newUser;
}

// Cookie Helper
export function setAuthCookie(res: Response, token: string, maxAgeDays = 7) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `dz_session=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeDays * 24 * 60 * 60}`,
    isProd ? 'Secure' : '',
  ].filter(Boolean).join('; ');

  res.setHeader('Set-Cookie', cookieOptions);
}

export function clearAuthCookie(res: Response) {
  res.setHeader(
    'Set-Cookie',
    'dz_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  );
}

// Token extractor from Cookie or Authorization header
export function extractToken(req: Request): string | null {
  // 1. Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // 2. Cookie header: dz_session=<token>
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/dz_session=([^;]+)/);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

// Express Request Augmentation
declare global {
  namespace Express {
    interface Request {
      user?: ServerUser;
      session?: ServerSession;
    }
  }
}

// Middleware: Extract current authenticated session
export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const session = getSession(token);
    if (session) {
      const user = getUserById(session.userId);
      if (user) {
        req.session = session;
        req.user = user;
      }
    }
  }
  next();
}

// Middleware: Require valid authenticated user
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'يرجى تسجيل الدخول للوصول إلى هذه الميزة.',
    });
    return;
  }
  next();
}

// Middleware: Require Administrator role
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'جلسة المستخدم غير صالحة أو منتهية. يرجى تسجيل الدخول أولاً.',
    });
    return;
  }

  if (req.user.role !== 'admin' || req.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    res.status(403).json({
      error: 'FORBIDDEN_ADMIN_REQUIRED',
      message: 'الوصول محصور حصرياً بمالك ومدير المنصة المعتمد.',
    });
    return;
  }

  next();
}

// Server-side usage limit verification
export function checkGenerationAllowance(user?: ServerUser): {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  plan: string;
} {
  if (!user) {
    // Guest gets 1 trial generation checked by IP / session
    return {
      allowed: true,
      remaining: 1,
      plan: 'free',
    };
  }

  // Admin has unlimited allowance
  if (user.role === 'admin') {
    return {
      allowed: true,
      remaining: 999999,
      plan: 'admin_unlimited',
    };
  }

  // Paid plans (starter, pro, business)
  if (user.plan !== 'free') {
    const remaining = user.monthlyGenerationsLimit - user.monthlyGenerationsUsed;
    if (remaining <= 0) {
      return {
        allowed: false,
        reason: 'لقد استنفدت الحصة الشهرية لخطة اشتراكك. يرجى ترقية الخطة للمتابعة.',
        remaining: 0,
        plan: user.plan,
      };
    }
    return {
      allowed: true,
      remaining,
      plan: user.plan,
    };
  }

  // Free trial plan (strictly 1 generation)
  if (user.trialGenerationsUsed >= user.trialGenerationsLimit) {
    return {
      allowed: false,
      reason: 'لقد استهلكت إعلان التجربة المجاني الكامل (1 إعلان). يرجى الاشتراك في إحدى باقات المنصة لتوليد المزيد.',
      remaining: 0,
      plan: 'free',
    };
  }

  return {
    allowed: true,
    remaining: user.trialGenerationsLimit - user.trialGenerationsUsed,
    plan: 'free',
  };
}

// Enforce and consume one server-side generation credit for protected AI endpoints.
export function consumeGenerationAllowance(req: Request, res: Response, next: NextFunction): void {
  const allowance = checkGenerationAllowance(req.user);
  if (!allowance.allowed) {
    res.status(403).json({
      error: 'USAGE_LIMIT_EXCEEDED',
      message: allowance.reason,
      remaining: allowance.remaining,
      plan: allowance.plan,
    });
    return;
  }
  if (req.user) incrementGenerationUsage(req.user);
  next();
}

export function incrementGenerationUsage(user?: ServerUser): void {
  if (!user) return;
  if (user.role === 'admin') return;

  if (user.plan === 'free') {
    user.trialGenerationsUsed += 1;
  } else {
    user.monthlyGenerationsUsed += 1;
  }
  updateUser(user.id, {
    trialGenerationsUsed: user.trialGenerationsUsed,
    monthlyGenerationsUsed: user.monthlyGenerationsUsed,
  });
}

// In-Memory Rate Limiter Middleware
export function rateLimiter(options: { windowMs: number; maxRequests: number; message?: string }) {
  const { windowMs, maxRequests, message } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientKey = req.user ? `user:${req.user.id}` : `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    const now = Date.now();
    const entry = rateLimitMap.get(clientKey);

    if (!entry || now > entry.resetTime) {
      rateLimitMap.set(clientKey, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: message || 'تم تجاوز الحد الأقصى للطلبات مؤقتاً. يرجى الانتظار قليلاً قبل المحاولة مجدداً.',
        retryAfterMs: Math.max(0, entry.resetTime - now),
      });
      return;
    }

    entry.count += 1;
    next();
  };
}
