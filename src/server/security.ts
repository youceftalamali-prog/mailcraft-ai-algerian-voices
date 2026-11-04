import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { getDatabasePool, getRequestEnvironmentValue } from './database';

export const ADMIN_EMAIL = 'Youceftalamali@gmail.com';

export interface ServerUser {
  id: string; email: string; passwordHash?: string; salt?: string;
  role: 'admin' | 'user'; plan: 'free' | 'starter' | 'pro' | 'business';
  trialGenerationsUsed: number; trialGenerationsLimit: number;
  monthlyGenerationsUsed: number; monthlyGenerationsLimit: number;
  subscriptionExpiresAt?: string | null;
  createdAt: string; lastLoginAt: string;
}
export interface ServerSession {
  token: string; userId: string; createdAt: number; expiresAt: number; ip: string;
}
interface RateLimitEntry { count: number; resetTime: number }
const rateLimitMap = new Map<string, RateLimitEntry>();

const userFromRow = (r: any): ServerUser => ({
  id: r.id, email: r.email, passwordHash: r.password_hash || undefined,
  salt: r.password_salt || undefined, role: r.role, plan: r.plan,
  trialGenerationsUsed: Number(r.trial_generations_used),
  trialGenerationsLimit: Number(r.trial_generations_limit),
  monthlyGenerationsUsed: Number(r.monthly_generations_used),
  monthlyGenerationsLimit: Number(r.monthly_generations_limit),
  createdAt: new Date(r.created_at).toISOString(),
  subscriptionExpiresAt: r.subscription_expires_at ? new Date(r.subscription_expires_at).toISOString() : null,
  lastLoginAt: new Date(r.last_login_at).toISOString(),
});
const sessionFromRow = (r: any, token: string): ServerSession => ({
  token, userId: r.user_id, createdAt: new Date(r.created_at).getTime(),
  expiresAt: new Date(r.expires_at).getTime(), ip: r.ip,
});

let authStoreInitialization: Promise<void> | null = null;

async function createAuthStoreSchema(): Promise<void> {
  const client = await getDatabasePool().connect();
  try {
    await client.query('BEGIN');
    // Serialize DDL across Worker isolates and test processes, not just this module instance.
    await client.query('SELECT pg_advisory_xact_lock($1)', [7_310_202_611]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY, email TEXT NOT NULL, email_normalized TEXT NOT NULL UNIQUE,
        password_hash TEXT, password_salt TEXT,
        role TEXT NOT NULL CHECK (role IN ('admin','user')),
        plan TEXT NOT NULL CHECK (plan IN ('free','starter','pro','business')),
        trial_generations_used INTEGER NOT NULL DEFAULT 0 CHECK (trial_generations_used >= 0),
        trial_generations_limit INTEGER NOT NULL DEFAULT 1 CHECK (trial_generations_limit >= 0),
        monthly_generations_used INTEGER NOT NULL DEFAULT 0 CHECK (monthly_generations_used >= 0),
        monthly_generations_limit INTEGER NOT NULL DEFAULT 0 CHECK (monthly_generations_limit >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_sessions (
        token_hash CHAR(64) PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL, expires_at TIMESTAMPTZ NOT NULL, ip TEXT NOT NULL DEFAULT 'unknown'
      )`);
    await client.query("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ");
    await client.query("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS monthly_usage_resets_at TIMESTAMPTZ");
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_payment_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        plan TEXT NOT NULL CHECK (plan IN ('starter','pro','business')),
        billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly','annual')),
        amount_dzd INTEGER NOT NULL CHECK (amount_dzd > 0),
        payment_method TEXT NOT NULL CHECK (payment_method IN ('baridimob','edahabia')),
        transaction_reference TEXT NOT NULL,
        sender_name TEXT,
        receipt_note TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
        reviewed_by TEXT,
        reviewed_at TIMESTAMPTZ,
        rejection_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(payment_method, transaction_reference)
      )
    `);
    await client.query('ALTER TABLE subscription_payment_requests ADD COLUMN IF NOT EXISTS receipt_data BYTEA');
    await client.query('ALTER TABLE subscription_payment_requests ADD COLUMN IF NOT EXISTS receipt_mime_type TEXT');
    await client.query('ALTER TABLE subscription_payment_requests ADD COLUMN IF NOT EXISTS receipt_filename TEXT');
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS subscription_payment_requests_one_pending_per_user_idx ON subscription_payment_requests(user_id) WHERE status=\'pending\'');
    await client.query('CREATE INDEX IF NOT EXISTS subscription_payment_requests_status_created_idx ON subscription_payment_requests(status, created_at DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS subscription_payment_requests_user_idx ON subscription_payment_requests(user_id, created_at DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS app_sessions_user_id_idx ON app_sessions(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS app_sessions_expires_at_idx ON app_sessions(expires_at)');
    await client.query(`
      CREATE TABLE IF NOT EXISTS showcase_audio_samples (
        id TEXT PRIMARY KEY,
        persona_id TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        persona_title TEXT NOT NULL,
        avatar_icon TEXT NOT NULL,
        accent_badge TEXT NOT NULL,
        script_text TEXT NOT NULL,
        duration_label TEXT NOT NULL,
        voice_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        audio_data BYTEA,
        audio_mime_type TEXT,
        audio_sha256 TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS showcase_sample_state (
        id SMALLINT PRIMARY KEY CHECK (id = 1),
        initialized BOOLEAN NOT NULL DEFAULT FALSE
      )`);
    await client.query(`
      INSERT INTO showcase_sample_state (id, initialized)
      VALUES (1, FALSE)
      ON CONFLICT (id) DO NOTHING
    `);
    await client.query('CREATE INDEX IF NOT EXISTS showcase_audio_samples_created_at_idx ON showcase_audio_samples(created_at DESC)');
    await client.query('DELETE FROM app_sessions WHERE expires_at <= NOW()');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Share schema initialization across concurrent requests and tests in this
 * process. A rejected attempt clears the cached promise so the next request
 * can retry after a transient database failure.
 */
export function initializeAuthStore(): Promise<void> {
  if (!authStoreInitialization) {
    authStoreInitialization = createAuthStoreSchema().catch((error: unknown) => {
      authStoreInitialization = null;
      throw error;
    });
  }
  return authStoreInitialization;
}

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}
export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const actual = Buffer.from(hashPassword(password, salt), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch { return false; }
}

export async function getUserById(id: string): Promise<ServerUser | null> {
  // Expired subscriptions are downgraded on the server before any session
  // request can use their paid entitlements.
  await getDatabasePool().query(`
    UPDATE app_users SET plan='free', monthly_generations_used=0,
      monthly_generations_limit=0, subscription_expires_at=NULL
    WHERE id=$1 AND role='user' AND plan <> 'free'
      AND subscription_expires_at IS NOT NULL AND subscription_expires_at <= NOW()
  `, [id]);
  await getDatabasePool().query(`
    UPDATE app_users SET monthly_generations_used=0,
      monthly_usage_resets_at=NOW() + INTERVAL '1 month'
    WHERE id=$1 AND role='user' AND plan <> 'free'
      AND monthly_usage_resets_at IS NOT NULL AND monthly_usage_resets_at <= NOW()
  `, [id]);
  const r = await getDatabasePool().query('SELECT * FROM app_users WHERE id=$1', [id]);
  return r.rows[0] ? userFromRow(r.rows[0]) : null;
}
export async function getUserByEmail(email: string): Promise<ServerUser | null> {
  const r = await getDatabasePool().query('SELECT * FROM app_users WHERE email_normalized=$1', [email.trim().toLowerCase()]);
  return r.rows[0] ? userFromRow(r.rows[0]) : null;
}
export async function getAllUsers(): Promise<ServerUser[]> {
  const r = await getDatabasePool().query('SELECT * FROM app_users ORDER BY created_at DESC');
  return r.rows.map(userFromRow);
}
export async function updateUser(id: string, updates: Partial<ServerUser>): Promise<ServerUser | null> {
  const columns: Record<string, string> = {
    email: 'email', passwordHash: 'password_hash', salt: 'password_salt', role: 'role', plan: 'plan',
    trialGenerationsUsed: 'trial_generations_used', trialGenerationsLimit: 'trial_generations_limit',
    monthlyGenerationsUsed: 'monthly_generations_used', monthlyGenerationsLimit: 'monthly_generations_limit',
    lastLoginAt: 'last_login_at',
  };
  const entries = Object.entries(updates).filter(([k, v]) => columns[k] && v !== undefined);
  if (!entries.length) return getUserById(id);
  const values = entries.map(([, v]) => v);
  const sets = entries.map(([k], i) => `${columns[k]}=$${i + 1}`);
  if (updates.email) {
    values.push(updates.email.trim().toLowerCase());
    sets.push(`email_normalized=$${values.length}`);
  }
  values.push(id);
  const r = await getDatabasePool().query(`UPDATE app_users SET ${sets.join(', ')} WHERE id=$${values.length} RETURNING *`, values);
  return r.rows[0] ? userFromRow(r.rows[0]) : null;
}

export async function createUser(email: string, password: string): Promise<ServerUser> {
  const clean = email.trim().toLowerCase();
  if (!clean || clean.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new Error('INVALID_EMAIL');
  if (clean === ADMIN_EMAIL.toLowerCase()) throw new Error('ADMIN_REGISTRATION_DISABLED');
  if (password.length < 10 || password.length > 128) throw new Error('WEAK_PASSWORD');
  const salt = crypto.randomBytes(16).toString('hex');
  const id = 'user-' + crypto.randomBytes(16).toString('hex');
  try {
    const r = await getDatabasePool().query(`INSERT INTO app_users
      (id,email,email_normalized,password_hash,password_salt,role,plan,trial_generations_used,trial_generations_limit,monthly_generations_used,monthly_generations_limit)
      VALUES($1,$2,$3,$4,$5,'user','free',0,1,0,0) RETURNING *`,
      [id, clean, clean, hashPassword(password, salt), salt]);
    return userFromRow(r.rows[0]);
  } catch (e: any) {
    if (e?.code === '23505') throw new Error('ACCOUNT_EXISTS');
    throw e;
  }
}
export async function authenticateUser(email: string, password: string): Promise<ServerUser | null> {
  const user = await getUserByEmail(email);
  if (!user?.passwordHash || !user.salt || !verifyPassword(password, user.salt, user.passwordHash)) return null;
  return updateUser(user.id, { lastLoginAt: new Date().toISOString() });
}
export async function setUserPassword(id: string, password: string): Promise<ServerUser | null> {
  if (password.length < 16 || password.length > 128) return null;
  const salt = crypto.randomBytes(16).toString('hex');
  return updateUser(id, { salt, passwordHash: hashPassword(password, salt) });
}
export async function registerOrGetUser(email: string, role: 'admin' | 'user' = 'user'): Promise<ServerUser> {
  const clean = email.trim().toLowerCase();
  const existing = await getUserByEmail(clean);
  if (existing) return existing;
  const admin = clean === ADMIN_EMAIL.toLowerCase();
  const adminPassword = getRequestEnvironmentValue('ADMIN_PASSWORD');
  const salt = admin && adminPassword ? crypto.randomBytes(16).toString('hex') : null;
  const hash = salt ? hashPassword(adminPassword!, salt) : null;
  const id = (admin ? 'admin-' : 'user-') + crypto.randomBytes(12).toString('hex');
  try {
    const r = await getDatabasePool().query(`INSERT INTO app_users
      (id,email,email_normalized,password_hash,password_salt,role,plan,trial_generations_used,trial_generations_limit,monthly_generations_used,monthly_generations_limit)
      VALUES($1,$2,$3,$4,$5,$6,$7,0,$8,0,$9) RETURNING *`,
      [id, clean, clean, hash, salt, admin ? 'admin' : role, admin ? 'business' : 'free', admin ? 999999 : 1, admin ? 999999 : 0]);
    return userFromRow(r.rows[0]);
  } catch (e: any) {
    if (e?.code === '23505') {
      const again = await getUserByEmail(clean);
      if (again) return again;
    }
    throw e;
  }
}

const tokenDigest = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
export async function createSession(userId: string, ip: string, maxAgeDays = 7): Promise<ServerSession> {
  const token = crypto.randomBytes(32).toString('hex');
  const createdAt = Date.now();
  const expiresAt = createdAt + maxAgeDays * 86400000;
  await getDatabasePool().query('INSERT INTO app_sessions(token_hash,user_id,created_at,expires_at,ip) VALUES($1,$2,$3,$4,$5)',
    [tokenDigest(token), userId, new Date(createdAt), new Date(expiresAt), ip]);
  return { token, userId, createdAt, expiresAt, ip };
}
export async function destroySession(token: string): Promise<boolean> {
  const r = await getDatabasePool().query('DELETE FROM app_sessions WHERE token_hash=$1', [tokenDigest(token)]);
  return (r.rowCount || 0) > 0;
}
export async function getSession(token?: string | null): Promise<ServerSession | null> {
  if (!token) return null;
  const r = await getDatabasePool().query('SELECT * FROM app_sessions WHERE token_hash=$1 AND expires_at>NOW()', [tokenDigest(token)]);
  if (!r.rows[0]) return null;
  return sessionFromRow(r.rows[0], token);
}

export function setAuthCookie(res: Response, token: string, maxAgeDays = 7): void {
  res.setHeader('Set-Cookie', [`dz_session=${token}`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', `Max-Age=${maxAgeDays * 86400}`].join('; '));
}
export function clearAuthCookie(res: Response): void {
  res.setHeader('Set-Cookie', 'dz_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
}
export function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  const match = req.headers.cookie?.match(/(?:^|;\s*)dz_session=([^;]+)/);
  return match?.[1]?.trim() || null;
}

declare global {
  namespace Express { interface Request { user?: ServerUser; session?: ServerSession } }
}
export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (token) {
      const session = await getSession(token);
      if (session) {
        const user = await getUserById(session.userId);
        if (user) { req.session = session; req.user = user; }
      }
    }
    next();
  } catch (error) { next(error); }
}
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) { res.status(401).json({ error: 'UNAUTHORIZED', message: 'يرجى تسجيل الدخول للوصول إلى هذه الميزة.' }); return; }
  next();
}
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) { res.status(401).json({ error: 'UNAUTHORIZED', message: 'جلسة المستخدم غير صالحة أو منتهية. يرجى تسجيل الدخول أولاً.' }); return; }
  if (req.user.role !== 'admin' || req.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    res.status(403).json({ error: 'FORBIDDEN_ADMIN_REQUIRED', message: 'الوصول محصور حصرياً بمالك ومدير المنصة المعتمد.' }); return;
  }
  next();
}

export type SubscriptionPlan = 'starter' | 'pro' | 'business';
export type SubscriptionBillingCycle = 'monthly' | 'annual';
export type SubscriptionPaymentMethod = 'baridimob' | 'edahabia';

export interface SubscriptionPaymentRequest {
  id: string; userId: string; email: string; plan: SubscriptionPlan;
  billingCycle: SubscriptionBillingCycle; amountDzd: number;
  paymentMethod: SubscriptionPaymentMethod; transactionReference: string;
  senderName: string | null; receiptNote: string | null; status: 'pending' | 'approved' | 'rejected';
  reviewedAt: string | null; rejectionReason: string | null; receiptAvailable: boolean; createdAt: string;
}

const subscriptionFromRow = (r: any): SubscriptionPaymentRequest => ({
  id: r.id, userId: r.user_id, email: r.email, plan: r.plan,
  billingCycle: r.billing_cycle, amountDzd: Number(r.amount_dzd),
  paymentMethod: r.payment_method, transactionReference: r.transaction_reference,
  senderName: r.sender_name || null, receiptNote: r.receipt_note || null,
  status: r.status, reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : null,
  rejectionReason: r.rejection_reason || null, receiptAvailable: Boolean(r.receipt_available ?? r.receipt_data), createdAt: new Date(r.created_at).toISOString(),
});

export async function createSubscriptionPaymentRequest(input: {
  userId: string; plan: SubscriptionPlan; billingCycle: SubscriptionBillingCycle;
  paymentMethod: SubscriptionPaymentMethod; transactionReference: string;
  senderName?: string; receiptNote?: string; receiptData?: Buffer; receiptMimeType?: string; receiptFilename?: string;
}): Promise<SubscriptionPaymentRequest> {
  const prices: Record<SubscriptionPlan, Record<SubscriptionBillingCycle, number>> = {
    starter: { monthly: 2900, annual: 29000 },
    pro: { monthly: 5900, annual: 59000 },
    business: { monthly: 14500, annual: 145000 },
  };
  const amount = prices[input.plan][input.billingCycle];
  const id = 'pay-' + crypto.randomBytes(16).toString('hex');
  const reference = input.transactionReference.trim();
  if (reference.length < 5 || reference.length > 100) throw new Error('INVALID_TRANSACTION_REFERENCE');
  const client = await getDatabasePool().connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM app_users WHERE id=$1 FOR UPDATE', [input.userId]);
    const pending = await client.query(
      "SELECT id FROM subscription_payment_requests WHERE user_id=$1 AND status='pending' FOR UPDATE",
      [input.userId],
    );
    if (pending.rowCount) throw new Error('PENDING_PAYMENT_EXISTS');
    await client.query(`
      INSERT INTO subscription_payment_requests
        (id,user_id,plan,billing_cycle,amount_dzd,payment_method,transaction_reference,sender_name,receipt_note,receipt_data,receipt_mime_type,receipt_filename)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `, [id,input.userId,input.plan,input.billingCycle,amount,input.paymentMethod,reference,
      input.senderName?.trim().slice(0,120) || null,input.receiptNote?.trim().slice(0,1000) || null,
      input.receiptData || null,input.receiptMimeType || null,input.receiptFilename?.trim().slice(0,180) || null]);
    const withEmail = await client.query(`
      SELECT p.*, u.email FROM subscription_payment_requests p
      JOIN app_users u ON u.id=p.user_id WHERE p.id=$1
    `, [id]);
    await client.query('COMMIT');
    return subscriptionFromRow(withEmail.rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => undefined);
    if (error?.code === '23505') throw new Error('DUPLICATE_TRANSACTION_REFERENCE');
    throw error;
  } finally { client.release(); }
}

export async function listSubscriptionPaymentRequests(status?: 'pending'|'approved'|'rejected'): Promise<SubscriptionPaymentRequest[]> {
  const result = await getDatabasePool().query(`
    SELECT p.id,p.user_id,p.plan,p.billing_cycle,p.amount_dzd,p.payment_method,p.transaction_reference,p.sender_name,p.receipt_note,p.status,p.reviewed_at,p.rejection_reason,p.created_at,u.email,(p.receipt_data IS NOT NULL) AS receipt_available FROM subscription_payment_requests p
    JOIN app_users u ON u.id=p.user_id
    WHERE ($1::text IS NULL OR p.status=$1)
    ORDER BY CASE WHEN p.status='pending' THEN 0 ELSE 1 END, p.created_at DESC
    LIMIT 500
  `, [status || null]);
  return result.rows.map(subscriptionFromRow);
}

export async function getUserSubscriptionPaymentRequests(userId: string): Promise<SubscriptionPaymentRequest[]> {
  const result = await getDatabasePool().query(`
    SELECT p.id,p.user_id,p.plan,p.billing_cycle,p.amount_dzd,p.payment_method,p.transaction_reference,p.sender_name,p.receipt_note,p.status,p.reviewed_at,p.rejection_reason,p.created_at,u.email,(p.receipt_data IS NOT NULL) AS receipt_available FROM subscription_payment_requests p
    JOIN app_users u ON u.id=p.user_id WHERE p.user_id=$1
    ORDER BY p.created_at DESC LIMIT 50
  `, [userId]);
  return result.rows.map(subscriptionFromRow);
}


export async function getSubscriptionPaymentReceipt(requestId: string): Promise<{ data: Buffer; mimeType: string; filename: string } | null> {
  const result = await getDatabasePool().query(
    'SELECT receipt_data, receipt_mime_type, receipt_filename FROM subscription_payment_requests WHERE id=$1',
    [requestId],
  );
  const row = result.rows[0];
  if (!row?.receipt_data || !row.receipt_mime_type) return null;
  return {
    data: Buffer.isBuffer(row.receipt_data) ? row.receipt_data : Buffer.from(row.receipt_data),
    mimeType: row.receipt_mime_type,
    filename: row.receipt_filename || 'payment-receipt',
  };
}

export async function reviewSubscriptionPaymentRequest(input: {
  requestId: string; adminUserId: string; decision: 'approved'|'rejected'; rejectionReason?: string;
}): Promise<SubscriptionPaymentRequest> {
  const client = await getDatabasePool().connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(`
      SELECT p.*, u.email FROM subscription_payment_requests p
      JOIN app_users u ON u.id=p.user_id WHERE p.id=$1 FOR UPDATE OF p
    `, [input.requestId]);
    if (!found.rows[0]) throw new Error('PAYMENT_REQUEST_NOT_FOUND');
    const payment = subscriptionFromRow(found.rows[0]);
    if (payment.status !== 'pending') throw new Error('PAYMENT_REQUEST_ALREADY_REVIEWED');
    if (input.decision === 'approved') {
      const months = payment.billingCycle === 'annual' ? 12 : 1;
      const limits: Record<SubscriptionPlan, number> = { starter: 50, pro: 9999, business: 9999 };
      const userUpdate = await client.query(`
        UPDATE app_users SET plan=$2, monthly_generations_used=0,
          monthly_generations_limit=$3,
          subscription_expires_at=GREATEST(COALESCE(subscription_expires_at,NOW()),NOW()) + ($4::integer * INTERVAL '1 month')
        WHERE id=$1 AND role='user'
      `, [payment.userId,payment.plan,limits[payment.plan],months]);
      if (userUpdate.rowCount !== 1) throw new Error('SUBSCRIPTION_USER_NOT_ELIGIBLE');
    }
    const updated = await client.query(`
      UPDATE subscription_payment_requests
      SET status=$2, reviewed_by=$3, reviewed_at=NOW(), rejection_reason=$4
      WHERE id=$1 RETURNING id
    `, [input.requestId,input.decision,input.adminUserId,
      input.decision === 'rejected' ? input.rejectionReason?.trim().slice(0,500) || 'لم يتم إثبات الدفع.' : null]);
    const withEmail = await client.query(`
      SELECT p.*, u.email FROM subscription_payment_requests p
      JOIN app_users u ON u.id=p.user_id WHERE p.id=$1
    `, [input.requestId]);
    await client.query('COMMIT');
    return subscriptionFromRow(withEmail.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally { client.release(); }
}

export function checkGenerationAllowance(user?: ServerUser): { allowed: boolean; reason?: string; remaining?: number; plan: string } {
  if (!user) return { allowed: true, remaining: 1, plan: 'free' };
  if (user.role === 'admin') return { allowed: true, remaining: 999999, plan: 'admin_unlimited' };
  if (user.plan !== 'free') {
    const remaining = user.monthlyGenerationsLimit - user.monthlyGenerationsUsed;
    return remaining <= 0 ? { allowed: false, reason: 'لقد استنفدت الحصة الشهرية لخطة اشتراكك. يرجى ترقية الخطة للمتابعة.', remaining: 0, plan: user.plan } : { allowed: true, remaining, plan: user.plan };
  }
  if (user.trialGenerationsUsed >= user.trialGenerationsLimit) return { allowed: false, reason: 'لقد استهلكت إعلان التجربة المجاني الكامل (1 إعلان). يرجى الاشتراك في إحدى باقات المنصة لتوليد المزيد.', remaining: 0, plan: 'free' };
  return { allowed: true, remaining: user.trialGenerationsLimit - user.trialGenerationsUsed, plan: 'free' };
}
export async function incrementGenerationUsage(user?: ServerUser): Promise<void> {
  if (!user || user.role === 'admin') return;
  const field = user.plan === 'free' ? 'trial_generations_used' : 'monthly_generations_used';
  await getDatabasePool().query(`UPDATE app_users SET ${field}=${field}+1 WHERE id=$1`, [user.id]);
}

export async function refundGenerationUsage(userId: string, plan: ServerUser['plan']): Promise<void> {
  const field = plan === 'free' ? 'trial_generations_used' : 'monthly_generations_used';
  await getDatabasePool().query(
    `UPDATE app_users SET ${field}=GREATEST(${field}-1,0) WHERE id=$1`,
    [userId],
  );
}
export function consumeGenerationAllowance(_req: Request, res: Response, next: NextFunction): void {
  const user = _req.user;
  if (!user) { res.status(401).json({ error: 'UNAUTHORIZED' }); return; }
  void (async () => {
    const client = await getDatabasePool().connect();
    try {
      await client.query('BEGIN');
      const result = await client.query('SELECT * FROM app_users WHERE id=$1 FOR UPDATE', [user.id]);
      if (!result.rows[0]) { await client.query('ROLLBACK'); res.status(401).json({ error: 'UNAUTHORIZED' }); return; }
      const current = userFromRow(result.rows[0]);
      const allowance = checkGenerationAllowance(current);
      if (!allowance.allowed) {
        await client.query('ROLLBACK');
        res.status(403).json({ error: 'USAGE_LIMIT_EXCEEDED', message: allowance.reason, remaining: allowance.remaining, plan: allowance.plan });
        return;
      }
      if (current.role !== 'admin') {
        const column = current.plan === 'free' ? 'trial_generations_used' : 'monthly_generations_used';
        await client.query(`UPDATE app_users SET ${column}=${column}+1 WHERE id=$1`, [current.id]);
        current.plan === 'free' ? current.trialGenerationsUsed++ : current.monthlyGenerationsUsed++;
        _req.user = current;
      }
      await client.query('COMMIT');

      // A generation is charged only when the endpoint succeeds. For JSON error
      // responses, await the refund before sending the response. A detached
      // "finish" callback can be cut short when a Cloudflare Worker completes
      // the request, leaving failed provider calls incorrectly charged.
      if (current.role !== 'admin') {
        let refundPromise: Promise<void> | null = null;
        const refundReservation = (): Promise<void> => {
          if (!refundPromise) {
            refundPromise = refundGenerationUsage(current.id, current.plan).catch((refundError) => {
              console.error('Failed to refund generation credit:', refundError);
            });
          }
          return refundPromise;
        };

        const sendJson = res.json.bind(res);
        res.json = ((body?: unknown) => {
          if (res.statusCode >= 400) {
            void refundReservation().then(() => sendJson(body));
            return res;
          }
          return sendJson(body);
        }) as Response['json'];

        // Keep a fallback for non-JSON error responses. The same promise makes
        // this idempotent when the JSON path has already started the refund.
        res.once('finish', () => {
          if (res.statusCode >= 400) void refundReservation();
        });
      }
      next();
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      next(error);
    } finally { client.release(); }
  })();
}
export function rateLimiter(options: { windowMs: number; maxRequests: number; message?: string }) {
  const { windowMs, maxRequests, message } = options;
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.user ? `user:${req.user.id}` : `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    const now = Date.now();
    // Bound memory usage by pruning expired keys periodically.
    if (rateLimitMap.size > 10_000) {
      for (const [storedKey, storedEntry] of rateLimitMap) {
        if (now > storedEntry.resetTime) rateLimitMap.delete(storedKey);
      }
    }
    const entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetTime) { rateLimitMap.set(key, { count: 1, resetTime: now + windowMs }); next(); return; }
    if (entry.count >= maxRequests) { res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED', message: message || 'تم تجاوز الحد الأقصى للطلبات مؤقتاً. يرجى الانتظار قليلاً قبل المحاولة مجدداً.', retryAfterMs: Math.max(0, entry.resetTime - now) }); return; }
    entry.count++; next();
  };
}
