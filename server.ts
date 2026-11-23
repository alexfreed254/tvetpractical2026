import 'dotenv/config';
import {
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'crypto';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import {
  getSupabaseAuthClient,
  getSupabaseServerAdmin,
  getSupabaseServiceKey,
  getSupabaseUrl,
} from './src/lib/supabase/server';

const PORT = 3000;

// Signing secret stays strictly in server memory / process.env (never hardcoded)
const SESSION_SIGNING_SECRET =
  process.env.AUTH_SESSION_SECRET?.trim() || randomBytes(32).toString('hex');

type UserRole =
  | 'super_admin'
  | 'hod'
  | 'trainer'
  | 'internal_verifier'
  | 'external_verifier'
  | 'trainee'
  | 'management';

interface AuthAccountRecord {
  id: string;
  email: string;
  staff_or_adm_no: string;
  full_name: string;
  role: UserRole;
  department_id?: string | null;
  avatar_url?: string | null;
  password_hash: string | null;
  password_salt: string | null;
  active: boolean;
}

interface AuthenticatedUser {
  id: string;
  email: string;
  staff_or_adm_no: string;
  full_name: string;
  role: UserRole;
  department_id?: string | null;
  avatar_url?: string | null;
}

interface AuthenticatedRequest extends Request {
  authUser?: AuthenticatedUser;
}

const DEFAULT_AUTH_DIRECTORY: Omit<
  AuthAccountRecord,
  'password_hash' | 'password_salt'
>[] = [
  {
    id: 'usr11111-1111-1111-1111-111111111101',
    full_name: 'Dr. Samuel N. Gathogo',
    email: 'admin@thikatti.ac.ke',
    role: 'super_admin',
    department_id: null,
    staff_or_adm_no: 'TTTI/ADM/001',
    active: true,
  },
  {
    id: 'usr11111-1111-1111-1111-111111111102',
    full_name: 'HOD Grace Muthoni',
    email: 'hod.eee@thikatti.ac.ke',
    role: 'hod',
    department_id: 'd1111111-1111-1111-1111-111111111101',
    staff_or_adm_no: 'TTTI/HOD/014',
    active: true,
  },
  {
    id: 'usr11111-1111-1111-1111-111111111103',
    full_name: 'Eng. Peter K. Wainaina',
    email: 'pwainaina@thikatti.ac.ke',
    role: 'trainer',
    department_id: 'd1111111-1111-1111-1111-111111111101',
    staff_or_adm_no: 'TTTI/TR/108',
    active: true,
  },
  {
    id: 'usr11111-1111-1111-1111-111111111104',
    full_name: 'Eng. Beatrice Chebet',
    email: 'iv.eee@thikatti.ac.ke',
    role: 'internal_verifier',
    department_id: 'd1111111-1111-1111-1111-111111111101',
    staff_or_adm_no: 'TTTI/IV/022',
    active: true,
  },
  {
    id: 'usr11111-1111-1111-1111-111111111105',
    full_name: 'CDACC Inspector J. Omondi',
    email: 'ev.cdacc@tvet.go.ke',
    role: 'external_verifier',
    department_id: null,
    staff_or_adm_no: 'CDACC/EV/409',
    active: true,
  },
  {
    id: 'usr11111-1111-1111-1111-111111111106',
    full_name: 'Brian Mwangi Kamau',
    email: 'bmwangik@students.thikatti.ac.ke',
    role: 'trainee',
    department_id: 'd1111111-1111-1111-1111-111111111101',
    staff_or_adm_no: 'TTTI/EI/2025/041',
    active: true,
  },
  {
    id: 'usr11111-1111-1111-1111-111111111107',
    full_name: 'Principal CPA Anne W. Karanja',
    email: 'principal@thikatti.ac.ke',
    role: 'management',
    department_id: null,
    staff_or_adm_no: 'TTTI/MGT/002',
    active: true,
  },
];

// In-memory store synchronized with Postgres tvet_auth_accounts when DATABASE_URL is configured
const authAccountsCache = new Map<string, AuthAccountRecord>();
for (const u of DEFAULT_AUTH_DIRECTORY) {
  authAccountsCache.set(u.email.toLowerCase(), {
    ...u,
    password_hash: null,
    password_salt: null,
  });
}

let pgPoolSingleton: Pool | null = null;
function getPgPool(): Pool | null {
  const conn = process.env.DATABASE_URL?.trim();
  if (!conn) return null;
  if (!pgPoolSingleton) {
    pgPoolSingleton = new Pool({
      connectionString: conn,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pgPoolSingleton;
}

let authTableBootstrapped = false;
async function ensureAuthTableAndSync(): Promise<void> {
  const pool = getPgPool();
  if (!pool) return;
  try {
    if (!authTableBootstrapped) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tvet_auth_accounts (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          staff_or_adm_no TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL,
          department_id TEXT,
          avatar_url TEXT,
          password_hash TEXT,
          password_salt TEXT,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      await pool.query(`
        ALTER TABLE tvet_auth_accounts ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      `);
      for (const u of DEFAULT_AUTH_DIRECTORY) {
        await pool.query(
          `INSERT INTO tvet_auth_accounts (id, email, staff_or_adm_no, full_name, role, department_id, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (email) DO NOTHING`,
          [
            u.id,
            u.email.toLowerCase(),
            u.staff_or_adm_no,
            u.full_name,
            u.role,
            u.department_id || null,
            true,
          ],
        );
      }
      authTableBootstrapped = true;
    }

    const { rows } = await pool.query<AuthAccountRecord>(
      `SELECT id, email, staff_or_adm_no, full_name, role, department_id, avatar_url, password_hash, password_salt, active
       FROM tvet_auth_accounts`,
    );
    for (const row of rows) {
      authAccountsCache.set(row.email.toLowerCase(), row);
    }
  } catch {
    // Keep operating cleanly with in-memory auth cache if transient DB issue occurs
  }
}

async function persistAuthAccount(record: AuthAccountRecord): Promise<void> {
  authAccountsCache.set(record.email.toLowerCase(), record);
  const pool = getPgPool();
  if (!pool) return;
  try {
    await ensureAuthTableAndSync();
    await pool.query(
      `INSERT INTO tvet_auth_accounts (id, email, staff_or_adm_no, full_name, role, department_id, avatar_url, password_hash, password_salt, active, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (email) DO UPDATE SET
         staff_or_adm_no = EXCLUDED.staff_or_adm_no,
         full_name = EXCLUDED.full_name,
         role = EXCLUDED.role,
         department_id = EXCLUDED.department_id,
         avatar_url = COALESCE(EXCLUDED.avatar_url, tvet_auth_accounts.avatar_url),
         password_hash = COALESCE(EXCLUDED.password_hash, tvet_auth_accounts.password_hash),
         password_salt = COALESCE(EXCLUDED.password_salt, tvet_auth_accounts.password_salt),
         active = EXCLUDED.active,
         updated_at = NOW()`,
      [
        record.id,
        record.email.toLowerCase(),
        record.staff_or_adm_no,
        record.full_name,
        record.role,
        record.department_id || null,
        record.avatar_url ?? null,
        record.password_hash,
        record.password_salt,
        record.active,
      ],
    );
  } catch {
    // Cache already updated
  }
}

function isValidAvatarDataUrl(val: unknown): string | null | undefined {
  if (val === null) return null;
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (trimmed.length === 0 || trimmed.length > 150_000) return undefined;
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

async function persistAvatarForEmail(
  email: string,
  avatarUrl: string | null,
): Promise<void> {
  const key = email.trim().toLowerCase();
  const existing = authAccountsCache.get(key);
  if (existing) {
    authAccountsCache.set(key, { ...existing, avatar_url: avatarUrl });
  }
  const pool = getPgPool();
  if (!pool) return;
  try {
    await ensureAuthTableAndSync();
    await pool.query(
      `UPDATE tvet_auth_accounts SET avatar_url = $1, updated_at = NOW() WHERE email = $2`,
      [avatarUrl, key],
    );
  } catch {
    // Cache already updated
  }
}

const VALID_ROLES: UserRole[] = [
  'super_admin',
  'hod',
  'trainer',
  'internal_verifier',
  'external_verifier',
  'trainee',
  'management',
];

function isValidRole(val: unknown): val is UserRole {
  return typeof val === 'string' && VALID_ROLES.includes(val as UserRole);
}

function safeCompareSecret(input: string, expected: string): boolean {
  const a = Buffer.from(input, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function signSessionToken(user: AuthenticatedUser): string {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    staff_or_adm_no: user.staff_or_adm_no,
    department_id: user.department_id || null,
    exp: Date.now() + 1000 * 60 * 60 * 12, // 12 hours
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', SESSION_SIGNING_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionToken(token: string): AuthenticatedUser | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = createHmac('sha256', SESSION_SIGNING_SECRET)
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as {
      sub?: string;
      email?: string;
      role?: UserRole;
      full_name?: string;
      staff_or_adm_no?: string;
      department_id?: string | null;
      exp?: number;
    };
    if (!parsed.sub || !parsed.email || !parsed.role || !parsed.exp) return null;
    if (Date.now() > parsed.exp) return null;
    return {
      id: parsed.sub,
      email: parsed.email,
      role: parsed.role,
      full_name: parsed.full_name || parsed.email,
      staff_or_adm_no: parsed.staff_or_adm_no || '',
      department_id: parsed.department_id || null,
    };
  } catch {
    return null;
  }
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim() || null;
}

function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const user = verifySessionToken(token);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
    return;
  }
  req.authUser = user;
  next();
}

function requireRoles(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.authUser.role)) {
      res.status(403).json({
        error: `Access denied for role ${req.authUser.role}.`,
      });
      return;
    }
    next();
  };
}

function findAccountByIdentifier(identifier: string): AuthAccountRecord | null {
  const needle = identifier.trim().toLowerCase();
  if (!needle) return null;
  for (const acc of authAccountsCache.values()) {
    if (
      acc.email.toLowerCase() === needle ||
      acc.staff_or_adm_no.toLowerCase() === needle
    ) {
      return acc;
    }
  }
  return null;
}

async function listSupabaseAuthUsers(): Promise<{
  users: SupabaseAuthUser[];
  available: boolean;
}> {
  const admin = getSupabaseServerAdmin();
  if (!admin || !getSupabaseServiceKey()) {
    return { users: [], available: false };
  }
  try {
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error || !data) {
      return { users: [], available: false };
    }
    return { users: data.users || [], available: true };
  } catch {
    return { users: [], available: false };
  }
}

async function resolveProfileForSupabaseUser(
  sbUser: SupabaseAuthUser,
  allSupabaseUsers: SupabaseAuthUser[],
): Promise<AuthAccountRecord> {
  const email = (sbUser.email || '').trim().toLowerCase();
  const cached = email ? authAccountsCache.get(email) : undefined;
  const appRole = sbUser.app_metadata?.role;
  const userRole = sbUser.user_metadata?.role;

  let resolvedRole: UserRole | null = null;
  if (isValidRole(appRole)) {
    resolvedRole = appRole;
  } else if (cached && isValidRole(cached.role)) {
    resolvedRole = cached.role;
  } else if (isValidRole(userRole)) {
    resolvedRole = userRole;
  } else {
    const anotherAdminExists = allSupabaseUsers.some((u) => {
      if (u.id === sbUser.id) return false;
      const uEmail = (u.email || '').toLowerCase();
      const uCached = uEmail ? authAccountsCache.get(uEmail) : undefined;
      return (
        u.app_metadata?.role === 'super_admin' ||
        u.user_metadata?.role === 'super_admin' ||
        uCached?.role === 'super_admin'
      );
    });
    resolvedRole =
      !anotherAdminExists && allSupabaseUsers.length <= 1
        ? 'super_admin'
        : 'trainee';
  }

  const fullName =
    (typeof sbUser.user_metadata?.full_name === 'string' &&
      sbUser.user_metadata.full_name.trim()) ||
    cached?.full_name ||
    (email ? email.split('@')[0] : 'TVET User');

  const staffNo =
    (typeof sbUser.user_metadata?.staff_or_adm_no === 'string' &&
      sbUser.user_metadata.staff_or_adm_no.trim()) ||
    (typeof sbUser.app_metadata?.staff_or_adm_no === 'string' &&
      sbUser.app_metadata.staff_or_adm_no.trim()) ||
    cached?.staff_or_adm_no ||
    (resolvedRole === 'super_admin' ? 'TTTI/ADM/001' : 'SUPA/USER');

  const deptId =
    (typeof sbUser.user_metadata?.department_id === 'string' &&
      sbUser.user_metadata.department_id) ||
    cached?.department_id ||
    null;

  const metaAvatar = isValidAvatarDataUrl(sbUser.user_metadata?.avatar_url);
  const resolvedAvatar =
    cached?.avatar_url !== undefined
      ? cached.avatar_url
      : metaAvatar !== undefined
        ? metaAvatar
        : null;

  const record: AuthAccountRecord = {
    id: cached?.id || sbUser.id,
    email,
    staff_or_adm_no: staffNo.toUpperCase(),
    full_name: fullName,
    role: resolvedRole,
    department_id: deptId,
    avatar_url: resolvedAvatar,
    password_hash: null,
    password_salt: null,
    active: true,
  };
  await persistAuthAccount(record);
  return record;
}

async function buildAdminDirectory(sbUsers: SupabaseAuthUser[]) {
  const sbByEmail = new Map<string, SupabaseAuthUser>();
  for (const u of sbUsers) {
    if (u.email) sbByEmail.set(u.email.trim().toLowerCase(), u);
  }

  // Ensure any user created directly in Supabase Dashboard -> Authentication -> Add user
  // is also represented in authAccountsCache
  for (const sbUser of sbUsers) {
    const email = (sbUser.email || '').trim().toLowerCase();
    if (!email) continue;
    if (!authAccountsCache.has(email)) {
      await resolveProfileForSupabaseUser(sbUser, sbUsers);
    }
  }

  return Array.from(authAccountsCache.values()).map((acc) => {
    const sb = sbByEmail.get(acc.email.toLowerCase());
    const sbRole = sb?.app_metadata?.role || sb?.user_metadata?.role;
    const effectiveRole = isValidRole(sbRole) ? sbRole : acc.role;
    const sbAvatar = isValidAvatarDataUrl(sb?.user_metadata?.avatar_url);
    return {
      id: acc.id,
      supabase_user_id: sb?.id || null,
      full_name:
        (typeof sb?.user_metadata?.full_name === 'string' &&
          sb.user_metadata.full_name.trim()) ||
        acc.full_name,
      email: acc.email,
      role: effectiveRole,
      staff_or_adm_no:
        (typeof sb?.user_metadata?.staff_or_adm_no === 'string' &&
          sb.user_metadata.staff_or_adm_no.trim()) ||
        acc.staff_or_adm_no,
      department_id: acc.department_id || null,
      avatar_url: acc.avatar_url || (typeof sbAvatar === 'string' ? sbAvatar : null),
      in_supabase_auth: Boolean(sb),
      last_sign_in_at: sb?.last_sign_in_at || null,
      created_at: sb?.created_at || null,
    };
  });
}

const STATIC_SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  logo_url TEXT,
  competency_threshold DECIMAL(5,2) DEFAULT 50.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trainees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  class_name TEXT,
  course_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  department_name TEXT,
  course_title TEXT,
  level TEXT,
  unit_code TEXT,
  unit_name TEXT,
  title TEXT NOT NULL,
  assessment_number INTEGER NOT NULL DEFAULT 1,
  assessment_type TEXT DEFAULT 'PRACTICAL',
  assessment_date DATE,
  duration_minutes INTEGER DEFAULT 180,
  academic_year TEXT,
  term TEXT,
  competency_threshold DECIMAL(5,2) DEFAULT 50.00,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  task_number INTEGER NOT NULL,
  task_title TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES assessment_tasks(id) ON DELETE CASCADE,
  item_number TEXT NOT NULL,
  description TEXT NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_subcriterion BOOLEAN DEFAULT FALSE,
  parent_item_id UUID REFERENCES assessment_items(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  instruction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS observation_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instruction TEXT,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID REFERENCES observation_checklists(id) ON DELETE CASCADE,
  item_number TEXT NOT NULL,
  description TEXT NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_subitem BOOLEAN DEFAULT FALSE,
  parent_criteria_id UUID REFERENCES checklist_criteria(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  performance_indicator TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  trainee_id UUID REFERENCES trainees(id) ON DELETE CASCADE,
  assessor_name TEXT,
  assessment_date DATE NOT NULL,
  venue TEXT,
  status TEXT DEFAULT 'in_progress',
  grand_total_available DECIMAL(7,2) DEFAULT 0,
  grand_total_obtained DECIMAL(7,2) DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  competency_outcome TEXT DEFAULT 'Pending',
  verifier_name TEXT,
  verified_at TIMESTAMPTZ,
  verification_status TEXT DEFAULT 'pending',
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS criterion_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  item_id UUID REFERENCES assessment_items(id) ON DELETE CASCADE,
  marks_obtained DECIMAL(5,2) DEFAULT 0,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, item_id)
);

CREATE TABLE IF NOT EXISTS checklist_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  criteria_id UUID REFERENCES checklist_criteria(id) ON DELETE CASCADE,
  marks_obtained DECIMAL(5,2) DEFAULT 0,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, criteria_id)
);

CREATE TABLE IF NOT EXISTS assessment_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID UNIQUE REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  feedback_from_candidate TEXT,
  feedback_to_candidate TEXT,
  candidate_signed_at TIMESTAMPTZ,
  assessor_signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

function getSupabaseAdmin() {
  return getSupabaseServerAdmin();
}

function isValidString(val: unknown, maxLen = 500): val is string {
  return typeof val === 'string' && val.trim().length > 0 && val.length <= maxLen;
}

function isUuid(val: unknown): val is string {
  return (
    typeof val === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
  );
}

async function startServer() {
  await ensureAuthTableAndSync();

  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // --- AUTHENTICATION ENDPOINTS (SUPABASE AUTHENTICATION) ---

  app.get('/api/auth/status', async (req: AuthenticatedRequest, res: Response) => {
    await ensureAuthTableAndSync();
    const envAdminSet = Boolean(process.env.TVET_ADMIN_PASSCODE?.trim());
    const { users: sbUsers, available: supabaseAuthConfigured } =
      await listSupabaseAuthUsers();
    const token = extractBearerToken(req);
    const verifiedUser = token ? verifySessionToken(token) : null;
    const cachedAccount = verifiedUser
      ? authAccountsCache.get(verifiedUser.email.toLowerCase())
      : undefined;

    res.json({
      supabaseAuthConfigured,
      supabaseUserCount: sbUsers.length,
      adminClaimed: envAdminSet || sbUsers.length > 0,
      envAdminPasscodeActive: envAdminSet,
      authenticated: Boolean(verifiedUser),
      user: verifiedUser
        ? { ...verifiedUser, avatar_url: cachedAccount?.avatar_url || null }
        : null,
    });
  });

  // One-time First-Run Super Admin creation directly in Supabase Authentication (only when 0 users exist in Supabase Auth)
  app.post('/api/auth/setup', async (req: Request, res: Response) => {
    await ensureAuthTableAndSync();
    const envAdminSet = Boolean(process.env.TVET_ADMIN_PASSCODE?.trim());
    const { users: sbUsers, available } = await listSupabaseAuthUsers();
    if (!available) {
      res.status(503).json({
        error:
          'Supabase Authentication Admin API requires SUPABASE_SERVICE_ROLE_KEY in server secrets.',
      });
      return;
    }
    if (envAdminSet || sbUsers.length > 0) {
      res.status(409).json({
        error:
          'Users already exist in Supabase Authentication. Please sign in with your Supabase Auth credentials.',
      });
      return;
    }

    const { email, full_name, password } = req.body ?? {};
    if (!isValidString(email, 160) || !isValidString(password, 128) || password.length < 8) {
      res.status(400).json({
        error: 'Valid administrator email and password (min 8 characters) are required.',
      });
      return;
    }

    const adminClient = getSupabaseServerAdmin();
    if (!adminClient) {
      res.status(503).json({ error: 'Supabase admin client unavailable.' });
      return;
    }

    const targetEmail = email.trim().toLowerCase();
    const targetName = isValidString(full_name, 120)
      ? full_name.trim()
      : 'System Super Administrator';

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email: targetEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: targetName,
        role: 'super_admin',
        staff_or_adm_no: 'TTTI/ADM/001',
      },
      app_metadata: {
        role: 'super_admin',
        staff_or_adm_no: 'TTTI/ADM/001',
      },
    });

    if (createErr || !created.user) {
      res.status(400).json({
        error: createErr?.message || 'Failed to create Super Administrator in Supabase Auth.',
      });
      return;
    }

    const record: AuthAccountRecord = {
      id: created.user.id,
      email: targetEmail,
      staff_or_adm_no: 'TTTI/ADM/001',
      full_name: targetName,
      role: 'super_admin',
      department_id: null,
      password_hash: null,
      password_salt: null,
      active: true,
    };
    await persistAuthAccount(record);

    const authUser: AuthenticatedUser = {
      id: record.id,
      email: record.email,
      staff_or_adm_no: record.staff_or_adm_no,
      full_name: record.full_name,
      role: record.role,
      department_id: record.department_id,
    };
    const token = signSessionToken(authUser);

    res.json({ token, user: { ...authUser, avatar_url: null } });
  });

  // User Login verified directly against Supabase Authentication (supports email or Staff/Adm No.)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    await ensureAuthTableAndSync();
    const { identifier, password } = req.body ?? {};
    if (!isValidString(identifier, 160) || !isValidString(password, 128)) {
      res.status(400).json({ error: 'Email / ID and password are required.' });
      return;
    }

    const { users: sbUsers } = await listSupabaseAuthUsers();
    const trimmed = identifier.trim().toLowerCase();

    // Resolve Staff / Admission number to email if user didn't enter an email address
    let loginEmail = trimmed.includes('@') ? trimmed : '';
    if (!loginEmail) {
      const cached = findAccountByIdentifier(trimmed);
      if (cached) {
        loginEmail = cached.email.toLowerCase();
      } else {
        const matchedSb = sbUsers.find(
          (u) =>
            typeof u.user_metadata?.staff_or_adm_no === 'string' &&
            u.user_metadata.staff_or_adm_no.trim().toLowerCase() === trimmed,
        );
        if (matchedSb?.email) {
          loginEmail = matchedSb.email.toLowerCase();
        }
      }
    }

    if (!loginEmail) {
      res.status(401).json({
        error:
          'Invalid email or Staff / Admission Number. Ask your Super Admin or HOD for your login details.',
      });
      return;
    }

    // Optional server env passcode override for Super Administrator
    const envPasscode = process.env.TVET_ADMIN_PASSCODE?.trim();
    const cachedAccount = authAccountsCache.get(loginEmail);
    if (
      envPasscode &&
      cachedAccount?.role === 'super_admin' &&
      safeCompareSecret(password, envPasscode)
    ) {
      const authUser: AuthenticatedUser = {
        id: cachedAccount.id,
        email: cachedAccount.email,
        staff_or_adm_no: cachedAccount.staff_or_adm_no,
        full_name: cachedAccount.full_name,
        role: cachedAccount.role,
        department_id: cachedAccount.department_id,
      };
      res.json({
        token: signSessionToken(authUser),
        user: { ...authUser, avatar_url: cachedAccount.avatar_url || null },
      });
      return;
    }

    const supabaseAuth = getSupabaseAuthClient();
    if (!supabaseAuth) {
      res.status(503).json({
        error: 'Supabase Authentication is not configured on the server.',
      });
      return;
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error || !data.user) {
      res.status(401).json({
        error:
          'Invalid login credentials. Ensure this account exists in Supabase Authentication or contact your Super Admin / HOD.',
      });
      return;
    }

    const profile = await resolveProfileForSupabaseUser(data.user, sbUsers);
    const authUser: AuthenticatedUser = {
      id: profile.id,
      email: profile.email,
      staff_or_adm_no: profile.staff_or_adm_no,
      full_name: profile.full_name,
      role: profile.role,
      department_id: profile.department_id,
    };
    const token = signSessionToken(authUser);

    res.json({
      token,
      user: { ...authUser, avatar_url: profile.avatar_url || null },
    });
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // Update the authenticated user's own profile picture (or clear it to reset to initials)
  app.post(
    '/api/auth/profile-avatar',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      await ensureAuthTableAndSync();
      const validatedAvatar = isValidAvatarDataUrl(req.body?.avatar_url);
      if (validatedAvatar === undefined) {
        res.status(400).json({
          error:
            'Avatar must be a valid JPEG, PNG, or WEBP image (max 150 KB) or null.',
        });
        return;
      }

      const authEmail = req.authUser!.email.trim().toLowerCase();
      if (!authAccountsCache.has(authEmail)) {
        await persistAuthAccount({
          id: req.authUser!.id,
          email: authEmail,
          staff_or_adm_no: req.authUser!.staff_or_adm_no,
          full_name: req.authUser!.full_name,
          role: req.authUser!.role,
          department_id: req.authUser!.department_id || null,
          avatar_url: validatedAvatar,
          password_hash: null,
          password_salt: null,
          active: true,
        });
      } else {
        await persistAvatarForEmail(authEmail, validatedAvatar);
      }

      const adminClient = getSupabaseServerAdmin();
      if (adminClient && getSupabaseServiceKey()) {
        try {
          const { users: sbUsers } = await listSupabaseAuthUsers();
          const sbUser = sbUsers.find(
            (u) => (u.email || '').trim().toLowerCase() === authEmail,
          );
          if (sbUser) {
            await adminClient.auth.admin.updateUserById(sbUser.id, {
              user_metadata: {
                ...(sbUser.user_metadata || {}),
                avatar_url: validatedAvatar,
              },
            });
          }
        } catch {
          // Local DB and cache already persisted
        }
      }

      res.json({ ok: true, avatar_url: validatedAvatar });
    },
  );

  // List Supabase Auth + institutional users (Super Admin & HOD only)
  app.get(
    '/api/auth/users',
    requireAuth,
    requireRoles('super_admin', 'hod'),
    async (_req: AuthenticatedRequest, res: Response) => {
      await ensureAuthTableAndSync();
      const { users: sbUsers, available } = await listSupabaseAuthUsers();
      const directory = await buildAdminDirectory(sbUsers);
      res.json({
        supabaseAuthConfigured: available,
        users: directory,
      });
    },
  );

  // Create a user with login credentials directly in Supabase Authentication (Super Admin & HOD only)
  app.post(
    '/api/auth/users',
    requireAuth,
    requireRoles('super_admin', 'hod'),
    async (req: AuthenticatedRequest, res: Response) => {
      await ensureAuthTableAndSync();
      const {
        full_name,
        email,
        role,
        staff_or_adm_no,
        department_id,
        password,
        initial_password,
      } = req.body ?? {};
      const resolvedPassword =
        typeof password === 'string' && password.length > 0
          ? password
          : initial_password;

      if (
        !isValidString(full_name, 140) ||
        !isValidString(email, 160) ||
        !isValidString(staff_or_adm_no, 80) ||
        !isValidRole(role)
      ) {
        res.status(400).json({ error: 'Invalid user registration details.' });
        return;
      }

      if (!isValidString(resolvedPassword, 128) || resolvedPassword.length < 8) {
        res.status(400).json({
          error:
            'A login password of at least 8 characters is required to provision the account in Supabase Authentication.',
        });
        return;
      }

      // HOD cannot create a super_admin
      if (req.authUser?.role === 'hod' && role === 'super_admin') {
        res.status(403).json({
          error: 'Only Super Administrators can register Super Admin accounts.',
        });
        return;
      }

      const adminClient = getSupabaseServerAdmin();
      if (!adminClient || !getSupabaseServiceKey()) {
        res.status(503).json({
          error:
            'SUPABASE_SERVICE_ROLE_KEY is required on the server to create Supabase Auth users.',
        });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = full_name.trim();
      const cleanStaffNo = staff_or_adm_no.trim().toUpperCase();
      const cleanDept = isValidString(department_id, 80) ? department_id : null;

      const { data: created, error: createErr } =
        await adminClient.auth.admin.createUser({
          email: cleanEmail,
          password: resolvedPassword,
          email_confirm: true,
          user_metadata: {
            full_name: cleanName,
            role,
            staff_or_adm_no: cleanStaffNo,
            department_id: cleanDept,
          },
          app_metadata: {
            role,
            staff_or_adm_no: cleanStaffNo,
            department_id: cleanDept,
          },
        });

      if (createErr || !created.user) {
        const msg = createErr?.message || 'Failed to create user in Supabase Auth.';
        const isConflict = /already|exists|registered/i.test(msg);
        res.status(isConflict ? 409 : 400).json({
          error: isConflict
            ? 'This email already exists in Supabase Authentication. Use Update Login / Role on that user row instead.'
            : msg,
        });
        return;
      }

      const record: AuthAccountRecord = {
        id: created.user.id,
        full_name: cleanName,
        email: cleanEmail,
        role,
        staff_or_adm_no: cleanStaffNo,
        department_id: cleanDept,
        password_hash: null,
        password_salt: null,
        active: true,
      };
      await persistAuthAccount(record);

      const { users: sbUsers } = await listSupabaseAuthUsers();
      const directory = await buildAdminDirectory(sbUsers);

      res.json({
        ok: true,
        user: {
          id: record.id,
          supabase_user_id: created.user.id,
          full_name: record.full_name,
          email: record.email,
          role: record.role,
          staff_or_adm_no: record.staff_or_adm_no,
          department_id: record.department_id,
          in_supabase_auth: true,
        },
        users: directory,
      });
    },
  );

  // Update role, profile metadata, or reset/provide password in Supabase Authentication (Super Admin & HOD only)
  app.patch(
    '/api/auth/users/:id',
    requireAuth,
    requireRoles('super_admin', 'hod'),
    async (req: AuthenticatedRequest, res: Response) => {
      await ensureAuthTableAndSync();
      const targetId = req.params.id;
      const { role, full_name, staff_or_adm_no, department_id, password } =
        req.body ?? {};

      const adminClient = getSupabaseServerAdmin();
      if (!adminClient || !getSupabaseServiceKey()) {
        res.status(503).json({
          error:
            'SUPABASE_SERVICE_ROLE_KEY is required on the server to manage Supabase Auth users.',
        });
        return;
      }

      const { users: sbUsers } = await listSupabaseAuthUsers();
      const existingDirectory = await buildAdminDirectory(sbUsers);
      const targetEntry = existingDirectory.find(
        (u) => u.id === targetId || u.supabase_user_id === targetId,
      );

      if (!targetEntry) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }

      if (
        req.authUser?.role === 'hod' &&
        (targetEntry.role === 'super_admin' || role === 'super_admin')
      ) {
        res.status(403).json({
          error: 'Only Super Administrators can modify Super Admin accounts.',
        });
        return;
      }

      const nextRole = isValidRole(role) ? role : targetEntry.role;
      const nextName = isValidString(full_name, 140)
        ? full_name.trim()
        : targetEntry.full_name;
      const nextStaffNo = isValidString(staff_or_adm_no, 80)
        ? staff_or_adm_no.trim().toUpperCase()
        : targetEntry.staff_or_adm_no;
      const nextDept =
        department_id === null
          ? null
          : isValidString(department_id, 80)
            ? department_id
            : targetEntry.department_id || null;

      if (password !== undefined && password !== '') {
        if (!isValidString(password, 128) || password.length < 8) {
          res.status(400).json({
            error: 'Password must be at least 8 characters.',
          });
          return;
        }
      }

      let sbUserId = targetEntry.supabase_user_id;
      if (sbUserId) {
        const existingSb = sbUsers.find((u) => u.id === sbUserId);
        const updatePayload: {
          password?: string;
          email_confirm?: boolean;
          user_metadata: Record<string, unknown>;
          app_metadata: Record<string, unknown>;
        } = {
          email_confirm: true,
          user_metadata: {
            ...(existingSb?.user_metadata || {}),
            full_name: nextName,
            role: nextRole,
            staff_or_adm_no: nextStaffNo,
            department_id: nextDept,
          },
          app_metadata: {
            ...(existingSb?.app_metadata || {}),
            role: nextRole,
            staff_or_adm_no: nextStaffNo,
            department_id: nextDept,
          },
        };
        if (typeof password === 'string' && password.length >= 8) {
          updatePayload.password = password;
        }
        const { error: updErr } = await adminClient.auth.admin.updateUserById(
          sbUserId,
          updatePayload,
        );
        if (updErr) {
          res.status(400).json({ error: updErr.message });
          return;
        }
      } else {
        if (!password || typeof password !== 'string' || password.length < 8) {
          res.status(400).json({
            error:
              'This account is not yet in Supabase Authentication. Enter a password (min 8 characters) to provision their login.',
          });
          return;
        }
        const { data: created, error: createErr } =
          await adminClient.auth.admin.createUser({
            email: targetEntry.email,
            password,
            email_confirm: true,
            user_metadata: {
              full_name: nextName,
              role: nextRole,
              staff_or_adm_no: nextStaffNo,
              department_id: nextDept,
            },
            app_metadata: {
              role: nextRole,
              staff_or_adm_no: nextStaffNo,
              department_id: nextDept,
            },
          });
        if (createErr || !created.user) {
          res.status(400).json({
            error:
              createErr?.message || 'Failed to provision user in Supabase Auth.',
          });
          return;
        }
        sbUserId = created.user.id;
      }

      await persistAuthAccount({
        id: targetEntry.id,
        email: targetEntry.email,
        staff_or_adm_no: nextStaffNo,
        full_name: nextName,
        role: nextRole,
        department_id: nextDept,
        password_hash: null,
        password_salt: null,
        active: true,
      });

      const { users: refreshedSbUsers } = await listSupabaseAuthUsers();
      const directory = await buildAdminDirectory(refreshedSbUsers);

      res.json({ ok: true, users: directory });
    },
  );

  // Health & Supabase Status
  app.get('/api/supabase/status', async (_req: Request, res: Response) => {
    const supabaseUrl = getSupabaseUrl();
    const hasServiceKey = Boolean(getSupabaseServiceKey());
    const hasDbUrl = Boolean(process.env.DATABASE_URL?.trim());
    let host: string | null = null;
    try {
      if (supabaseUrl) host = new URL(supabaseUrl).host;
    } catch {
      host = null;
    }

    const client = getSupabaseAdmin();
    let schemaReady = false;
    let errorDetail: string | null = null;

    if (client) {
      const { error } = await client.from('institutions').select('id').limit(1);
      if (!error) {
        schemaReady = true;
      } else {
        errorDetail = error.message;
      }
    }

    res.json({
      configured: Boolean(client),
      dbPoolConfigured: hasDbUrl,
      schemaReady,
      projectHost: host,
      hasServiceKey,
      errorDetail,
    });
  });

  // Apply Schema SQL via DATABASE_URL (Super Admin only)
  app.post(
    '/api/supabase/apply-schema',
    requireAuth,
    requireRoles('super_admin'),
    async (_req: AuthenticatedRequest, res: Response) => {
      const pool = getPgPool();
      if (!pool) {
        res.status(400).json({
          success: false,
          error:
            'DATABASE_URL is not configured in server environment secrets.',
        });
        return;
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(STATIC_SCHEMA_SQL);
        await client.query('COMMIT');
        res.json({
          success: true,
          message: 'TVET e-ASSESS schema applied to Supabase PostgreSQL.',
        });
      } catch (err) {
        await client.query('ROLLBACK');
        const message =
          err instanceof Error ? err.message : 'Schema application failed';
        res.status(500).json({ success: false, error: message });
      } finally {
        client.release();
      }
    },
  );

  // Load workspace from Supabase (Authenticated users only)
  app.get(
    '/api/workspace',
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.json({ connected: false, reason: 'missing_secrets' });
        return;
      }

      const [instRes, assessRes, traineeRes, sessionRes] = await Promise.all([
        supabase.from('institutions').select('*').limit(1),
        supabase
          .from('assessments')
          .select(
            '*, assessment_tasks(*, assessment_items(*)), observation_checklists(*, checklist_criteria(*))',
          )
          .order('updated_at', { ascending: false }),
        supabase.from('trainees').select('*').order('full_name'),
        supabase
          .from('assessment_sessions')
          .select(
            '*, criterion_results(*), checklist_results(*), assessment_feedback(*)',
          )
          .order('updated_at', { ascending: false }),
      ]);

      if (
        instRes.error ||
        assessRes.error ||
        traineeRes.error ||
        sessionRes.error
      ) {
        res.json({
          connected: false,
          reason: 'schema_not_ready',
          error:
            instRes.error?.message ||
            assessRes.error?.message ||
            traineeRes.error?.message ||
            sessionRes.error?.message,
        });
        return;
      }

      // Scope trainees & sessions when authenticated as trainee
      let filteredSessions = sessionRes.data || [];
      if (req.authUser?.role === 'trainee') {
        const matched = (traineeRes.data || []).find(
          (t: Record<string, unknown>) =>
            String(t.admission_number || '').toLowerCase() ===
            req.authUser?.staff_or_adm_no.toLowerCase(),
        );
        filteredSessions = matched
          ? filteredSessions.filter(
              (s: Record<string, unknown>) => s.trainee_id === matched.id,
            )
          : [];
      }

      res.json({
        connected: true,
        institution: instRes.data?.[0] || null,
        assessments: assessRes.data || [],
        trainees: traineeRes.data || [],
        sessions: filteredSessions,
      });
    },
  );

  // Sync institution settings to Supabase (Super Admin / HOD)
  app.post(
    '/api/institution',
    requireAuth,
    requireRoles('super_admin', 'hod'),
    async (req: AuthenticatedRequest, res: Response) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.json({ synced: false });
        return;
      }

      const { id, name, department, logo_url, competency_threshold } =
        req.body ?? {};
      if (!isValidString(name, 200) || !isValidString(department, 200)) {
        res
          .status(400)
          .json({ error: 'Valid institution name and department are required.' });
        return;
      }
      const threshold = Number(competency_threshold ?? 50);
      if (!Number.isFinite(threshold) || threshold < 1 || threshold > 100) {
        res.status(400).json({ error: 'Invalid competency threshold.' });
        return;
      }

      const payload = {
        ...(isUuid(id) ? { id } : {}),
        name: name.trim(),
        department: department.trim(),
        logo_url: typeof logo_url === 'string' ? logo_url.slice(0, 500) : null,
        competency_threshold: threshold,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('institutions')
        .upsert(payload)
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ synced: true, institution: data });
    },
  );

  // Sync a trainee to Supabase (Super Admin, HOD, Trainer)
  app.post(
    '/api/trainees',
    requireAuth,
    requireRoles('super_admin', 'hod', 'trainer'),
    async (req: AuthenticatedRequest, res: Response) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.json({ synced: false });
        return;
      }

      const { id, full_name, admission_number, class_name, course_title } =
        req.body ?? {};
      if (
        !isValidString(full_name, 160) ||
        !isValidString(admission_number, 64)
      ) {
        res.status(400).json({
          error: 'Valid full_name and admission_number are required.',
        });
        return;
      }

      const { data, error } = await supabase
        .from('trainees')
        .upsert(
          {
            ...(isUuid(id) ? { id } : {}),
            full_name: full_name.trim(),
            admission_number: admission_number.trim().toUpperCase(),
            class_name:
              typeof class_name === 'string' ? class_name.slice(0, 80) : null,
            course_title:
              typeof course_title === 'string'
                ? course_title.slice(0, 120)
                : null,
          },
          { onConflict: 'admission_number' },
        )
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ synced: true, trainee: data });
    },
  );

  // Verify a session in Supabase (Internal Verifier, HOD, Super Admin)
  app.post(
    '/api/sessions/:id/verify',
    requireAuth,
    requireRoles('super_admin', 'hod', 'internal_verifier'),
    async (req: AuthenticatedRequest, res: Response) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.json({ synced: false });
        return;
      }

      const sessionId = req.params.id;
      if (!isUuid(sessionId)) {
        res.status(400).json({ error: 'Invalid session UUID.' });
        return;
      }

      const { decision, notes, verifierName } = req.body ?? {};
      const allowed = ['approved', 'returned', 'rejected'];
      if (typeof decision !== 'string' || !allowed.includes(decision)) {
        res.status(400).json({ error: 'Invalid verification decision.' });
        return;
      }

      const nextStatus =
        decision === 'approved'
          ? 'verified'
          : decision === 'returned'
            ? 'returned'
            : 'rejected';

      const { data: currentSession } = await supabase
        .from('assessment_sessions')
        .select('assessor_name')
        .eq('id', sessionId)
        .maybeSingle();

      const resolvedVerifier = isValidString(verifierName, 120)
        ? verifierName.trim()
        : req.authUser?.full_name || 'Internal Verifier';

      if (
        currentSession?.assessor_name &&
        currentSession.assessor_name.trim().toLowerCase() ===
          resolvedVerifier.toLowerCase()
      ) {
        res.status(403).json({
          error:
            'Conflict of interest: An assessor cannot verify an assessment they conducted.',
        });
        return;
      }

      const { data, error } = await supabase
        .from('assessment_sessions')
        .update({
          status: nextStatus,
          verification_status: decision,
          verification_notes:
            typeof notes === 'string' ? notes.slice(0, 1000) : '',
          verifier_name: resolvedVerifier,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ synced: true, session: data });
    },
  );

  // Upsert an assessment instrument with tasks and checklists (Super Admin, HOD, Trainer)
  app.post(
    '/api/assessments',
    requireAuth,
    requireRoles('super_admin', 'hod', 'trainer'),
    async (req: AuthenticatedRequest, res: Response) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.json({ synced: false });
        return;
      }

      const body = req.body ?? {};
      if (!isValidString(body.title, 200)) {
        res.status(400).json({ error: 'Valid assessment title is required.' });
        return;
      }

      const threshold = Number(body.competency_threshold ?? 50);
      const duration = Number(body.duration_minutes ?? 180);
      const assessNum = Number(body.assessment_number ?? 1);
      if (
        !Number.isFinite(threshold) ||
        threshold < 1 ||
        threshold > 100 ||
        !Number.isFinite(duration) ||
        duration < 1 ||
        !Number.isFinite(assessNum) ||
        assessNum < 1
      ) {
        res.status(400).json({ error: 'Invalid numeric parameters.' });
        return;
      }

      const { data: instRows } = await supabase
        .from('institutions')
        .select('id')
        .limit(1);
      const institutionId = isUuid(body.institution_id)
        ? body.institution_id
        : instRows?.[0]?.id || null;

      const assessmentId = isUuid(body.id) ? body.id : randomUUID();

      const payload = {
        id: assessmentId,
        institution_id: institutionId,
        title: body.title.trim(),
        assessment_number: Math.trunc(assessNum),
        assessment_type: ['PRACTICAL', 'THEORY', 'ORAL', 'PROJECT'].includes(
          body.assessment_type,
        )
          ? body.assessment_type
          : 'PRACTICAL',
        department_name:
          typeof body.department_name === 'string'
            ? body.department_name.slice(0, 160)
            : '',
        course_title:
          typeof body.course_title === 'string'
            ? body.course_title.slice(0, 160)
            : '',
        level: typeof body.level === 'string' ? body.level.slice(0, 80) : '',
        unit_code:
          typeof body.unit_code === 'string' ? body.unit_code.slice(0, 80) : '',
        unit_name:
          typeof body.unit_name === 'string'
            ? body.unit_name.slice(0, 160)
            : '',
        assessment_date:
          typeof body.assessment_date === 'string'
            ? body.assessment_date.slice(0, 20)
            : null,
        duration_minutes: Math.trunc(duration),
        academic_year:
          typeof body.academic_year === 'string'
            ? body.academic_year.slice(0, 20)
            : '2026',
        term: typeof body.term === 'string' ? body.term.slice(0, 40) : 'Term 3',
        competency_threshold: threshold,
        status: ['draft', 'published', 'withdrawn', 'archived'].includes(
          body.status,
        )
          ? body.status
          : 'published',
        updated_at: new Date().toISOString(),
      };

      const { data: savedAssess, error } = await supabase
        .from('assessments')
        .upsert(payload)
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      if (Array.isArray(body.tasks)) {
        await supabase
          .from('assessment_tasks')
          .delete()
          .eq('assessment_id', assessmentId);
        for (let tIdx = 0; tIdx < body.tasks.length; tIdx++) {
          const t = body.tasks[tIdx];
          if (!t || typeof t !== 'object') continue;
          const taskId = isUuid(t.id) ? t.id : randomUUID();
          const { error: tErr } = await supabase
            .from('assessment_tasks')
            .insert({
              id: taskId,
              assessment_id: assessmentId,
              task_number: Number.isFinite(Number(t.task_number))
                ? Math.trunc(Number(t.task_number))
                : tIdx + 1,
              task_title:
                typeof t.task_title === 'string' && t.task_title.trim()
                  ? t.task_title.slice(0, 240)
                  : `Task ${tIdx + 1}`,
              sort_order: Number.isFinite(Number(t.sort_order))
                ? Math.trunc(Number(t.sort_order))
                : tIdx,
            });
          if (!tErr && Array.isArray(t.items) && t.items.length > 0) {
            const itemIdMap = new Map<string, string>();
            for (const item of t.items) {
              if (item && typeof item.id === 'string') {
                itemIdMap.set(
                  item.id,
                  isUuid(item.id) ? item.id : randomUUID(),
                );
              }
            }
            const itemRows = t.items
              .filter((item: unknown) => item && typeof item === 'object')
              .map((item: Record<string, unknown>, iIdx: number) => {
                const rawId = typeof item.id === 'string' ? item.id : '';
                const resolvedId = itemIdMap.get(rawId) || randomUUID();
                const rawParent =
                  typeof item.parent_item_id === 'string'
                    ? item.parent_item_id
                    : null;
                const resolvedParent = rawParent
                  ? itemIdMap.get(rawParent) ||
                    (isUuid(rawParent) ? rawParent : null)
                  : null;
                const marks = Number(item.max_marks ?? 0);
                return {
                  id: resolvedId,
                  task_id: taskId,
                  item_number:
                    typeof item.item_number === 'string'
                      ? item.item_number.slice(0, 20)
                      : String(iIdx + 1),
                  description:
                    typeof item.description === 'string'
                      ? item.description.slice(0, 500)
                      : '',
                  max_marks:
                    Number.isFinite(marks) && marks >= 0 && marks <= 500
                      ? marks
                      : 0,
                  is_subcriterion: Boolean(item.is_subcriterion),
                  parent_item_id: resolvedParent,
                  sort_order: Number.isFinite(Number(item.sort_order))
                    ? Math.trunc(Number(item.sort_order))
                    : iIdx,
                  instruction:
                    typeof item.instruction === 'string'
                      ? item.instruction.slice(0, 500)
                      : null,
                };
              });
            if (itemRows.length > 0) {
              await supabase.from('assessment_items').insert(itemRows);
            }
          }
        }
      }

      if (Array.isArray(body.checklists)) {
        await supabase
          .from('observation_checklists')
          .delete()
          .eq('assessment_id', assessmentId);
        for (let cIdx = 0; cIdx < body.checklists.length; cIdx++) {
          const cl = body.checklists[cIdx];
          if (!cl || typeof cl !== 'object') continue;
          const clId = isUuid(cl.id) ? cl.id : randomUUID();
          const { error: clErr } = await supabase
            .from('observation_checklists')
            .insert({
              id: clId,
              assessment_id: assessmentId,
              title:
                typeof cl.title === 'string' && cl.title.trim()
                  ? cl.title.slice(0, 240)
                  : 'OBSERVATION CHECKLIST',
              instruction:
                typeof cl.instruction === 'string'
                  ? cl.instruction.slice(0, 600)
                  : null,
              sort_order: Number.isFinite(Number(cl.sort_order))
                ? Math.trunc(Number(cl.sort_order))
                : cIdx,
            });
          if (!clErr && Array.isArray(cl.criteria) && cl.criteria.length > 0) {
            const critIdMap = new Map<string, string>();
            for (const crit of cl.criteria) {
              if (crit && typeof crit.id === 'string') {
                critIdMap.set(
                  crit.id,
                  isUuid(crit.id) ? crit.id : randomUUID(),
                );
              }
            }
            const critRows = cl.criteria
              .filter((crit: unknown) => crit && typeof crit === 'object')
              .map((crit: Record<string, unknown>, rIdx: number) => {
                const rawId = typeof crit.id === 'string' ? crit.id : '';
                const resolvedId = critIdMap.get(rawId) || randomUUID();
                const rawParent =
                  typeof crit.parent_criteria_id === 'string'
                    ? crit.parent_criteria_id
                    : null;
                const resolvedParent = rawParent
                  ? critIdMap.get(rawParent) ||
                    (isUuid(rawParent) ? rawParent : null)
                  : null;
                const marks = Number(crit.max_marks ?? 0);
                return {
                  id: resolvedId,
                  checklist_id: clId,
                  item_number:
                    typeof crit.item_number === 'string'
                      ? crit.item_number.slice(0, 20)
                      : String(rIdx + 1),
                  description:
                    typeof crit.description === 'string'
                      ? crit.description.slice(0, 500)
                      : '',
                  max_marks:
                    Number.isFinite(marks) && marks >= 0 && marks <= 500
                      ? marks
                      : 0,
                  is_subitem: Boolean(crit.is_subitem),
                  parent_criteria_id: resolvedParent,
                  sort_order: Number.isFinite(Number(crit.sort_order))
                    ? Math.trunc(Number(crit.sort_order))
                    : rIdx,
                  performance_indicator:
                    typeof crit.performance_indicator === 'string'
                      ? crit.performance_indicator.slice(0, 500)
                      : null,
                };
              });
            if (critRows.length > 0) {
              await supabase.from('checklist_criteria').insert(critRows);
            }
          }
        }
      }

      res.json({ synced: true, assessment: savedAssess });
    },
  );

  // Delete an assessment instrument by UUID (Super Admin, HOD, Trainer)
  app.delete(
    '/api/assessments/:id',
    requireAuth,
    requireRoles('super_admin', 'hod', 'trainer'),
    async (req: AuthenticatedRequest, res: Response) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.json({ synced: false });
        return;
      }
      const id = req.params.id;
      if (!isUuid(id)) {
        res.status(400).json({ error: 'Invalid assessment UUID.' });
        return;
      }
      const { error } = await supabase.from('assessments').delete().eq('id', id);
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.json({ synced: true });
    },
  );

  // Upsert an assessment session along with criterion/checklist results & feedback
  app.post(
    '/api/sessions',
    requireAuth,
    requireRoles('super_admin', 'hod', 'trainer'),
    async (req: AuthenticatedRequest, res: Response) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res.json({ synced: false });
        return;
      }

      const body = req.body ?? {};
      if (!isUuid(body.assessment_id) || !isUuid(body.trainee_id)) {
        res
          .status(400)
          .json({ error: 'Valid UUID assessment_id and trainee_id are required.' });
        return;
      }

      const sessionId = isUuid(body.id) ? body.id : randomUUID();
      const totalAvail = Number(body.grand_total_available ?? 0);
      const totalObt = Number(body.grand_total_obtained ?? 0);
      if (
        !Number.isFinite(totalAvail) ||
        totalAvail < 0 ||
        !Number.isFinite(totalObt) ||
        totalObt < 0
      ) {
        res.status(400).json({ error: 'Invalid marks totals.' });
        return;
      }
      const pct =
        totalAvail > 0
          ? Math.min(100, Math.max(0, (totalObt / totalAvail) * 100))
          : 0;

      const { data, error } = await supabase
        .from('assessment_sessions')
        .upsert({
          id: sessionId,
          assessment_id: body.assessment_id,
          trainee_id: body.trainee_id,
          assessor_name:
            typeof body.assessor_name === 'string'
              ? body.assessor_name.slice(0, 120)
              : req.authUser?.full_name || 'Assessor',
          assessment_date:
            typeof body.assessment_date === 'string'
              ? body.assessment_date.slice(0, 20)
              : new Date().toISOString().split('T')[0],
          venue:
            typeof body.venue === 'string'
              ? body.venue.slice(0, 120)
              : 'Workshop',
          status: [
            'in_progress',
            'submitted',
            'verified',
            'returned',
            'rejected',
          ].includes(body.status)
            ? body.status
            : 'in_progress',
          grand_total_available: totalAvail,
          grand_total_obtained: totalObt,
          percentage: Number(pct.toFixed(2)),
          competency_outcome: [
            'Competent',
            'Proficient',
            'Mastery',
            'Not Yet Competent',
            'Pending',
          ].includes(body.competency_outcome)
            ? body.competency_outcome
            : 'Pending',
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      if (Array.isArray(body.results)) {
        const validResults = body.results
          .filter(
            (r: unknown) =>
              r &&
              typeof r === 'object' &&
              isUuid((r as Record<string, unknown>).item_id),
          )
          .map((r: Record<string, unknown>) => ({
            session_id: sessionId,
            item_id: r.item_id as string,
            marks_obtained: Number.isFinite(Number(r.marks_obtained))
              ? Math.max(0, Number(r.marks_obtained))
              : 0,
            comments: typeof r.comments === 'string' ? r.comments.slice(0, 500) : '',
            updated_at: new Date().toISOString(),
          }));
        if (validResults.length > 0) {
          await supabase
            .from('criterion_results')
            .upsert(validResults, { onConflict: 'session_id,item_id' });
        }
      }

      if (Array.isArray(body.checklist_results)) {
        const validCl = body.checklist_results
          .filter(
            (r: unknown) =>
              r &&
              typeof r === 'object' &&
              isUuid((r as Record<string, unknown>).criteria_id),
          )
          .map((r: Record<string, unknown>) => ({
            session_id: sessionId,
            criteria_id: r.criteria_id as string,
            marks_obtained: Number.isFinite(Number(r.marks_obtained))
              ? Math.max(0, Number(r.marks_obtained))
              : 0,
            comments: typeof r.comments === 'string' ? r.comments.slice(0, 500) : '',
            updated_at: new Date().toISOString(),
          }));
        if (validCl.length > 0) {
          await supabase
            .from('checklist_results')
            .upsert(validCl, { onConflict: 'session_id,criteria_id' });
        }
      }

      if (
        typeof body.feedback_from_candidate === 'string' ||
        typeof body.feedback_to_candidate === 'string'
      ) {
        await supabase.from('assessment_feedback').upsert(
          {
            session_id: sessionId,
            feedback_from_candidate:
              typeof body.feedback_from_candidate === 'string'
                ? body.feedback_from_candidate.slice(0, 1500)
                : '',
            feedback_to_candidate:
              typeof body.feedback_to_candidate === 'string'
                ? body.feedback_to_candidate.slice(0, 1500)
                : '',
            candidate_signed_at:
              typeof body.candidate_signed_at === 'string'
                ? body.candidate_signed_at
                : null,
            assessor_signed_at:
              typeof body.assessor_signed_at === 'string'
                ? body.assessor_signed_at
                : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'session_id' },
        );
      }

      res.json({ synced: true, session: data });
    },
  );

  // Seed default TVET institution, trainees & sample practical assessment into Supabase
  app.post(
    '/api/supabase/seed',
    requireAuth,
    requireRoles('super_admin'),
    async (_req: AuthenticatedRequest, res: Response) => {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        res
          .status(400)
          .json({ success: false, error: 'Supabase secrets are not configured.' });
        return;
      }

      const instId = '11111111-1111-1111-1111-111111111111';
      const { error: instErr } = await supabase.from('institutions').upsert({
        id: instId,
        name: 'THIKA TECHNICAL TRAINING INSTITUTE',
        department: 'ELECTRICAL & ELECTRONICS ENGINEERING',
        competency_threshold: 50,
      });
      if (instErr) {
        res.status(500).json({ success: false, error: instErr.message });
        return;
      }

      const { error: traineeErr } = await supabase.from('trainees').upsert(
        [
          {
            id: '22222222-2222-2222-2222-222222222201',
            admission_number: 'TTTI/EI/2025/041',
            full_name: 'Brian Mwangi Kamau',
            class_name: 'EE-L5-JAN25',
            course_title: 'ELECTRICAL INSTALLATION',
          },
          {
            id: '22222222-2222-2222-2222-222222222202',
            admission_number: 'TTTI/EI/2025/042',
            full_name: 'Faith Wanjiku Njoroge',
            class_name: 'EE-L5-JAN25',
            course_title: 'ELECTRICAL INSTALLATION',
          },
        ],
        { onConflict: 'admission_number' },
      );
      if (traineeErr) {
        res.status(500).json({ success: false, error: traineeErr.message });
        return;
      }

      const sampleAssessmentId = '33333333-3333-3333-3333-333333333301';
      const { data: existingAssess } = await supabase
        .from('assessments')
        .select('id')
        .eq('id', sampleAssessmentId)
        .maybeSingle();

      if (!existingAssess) {
        const { error: assessErr } = await supabase.from('assessments').upsert({
          id: sampleAssessmentId,
          institution_id: instId,
          title: 'Install Security System — Practical Assessment 1',
          assessment_number: 1,
          assessment_type: 'PRACTICAL',
          department_name: 'ELECTRICAL & ELECTRONICS ENGINEERING',
          course_title: 'ELECTRICAL INSTALLATION',
          level: 'LEVEL 4, 5 & 6',
          unit_code: 'ENG/CU/EI/CR/03/5/MA',
          unit_name: 'Install Security System',
          assessment_date: '2026-11-18',
          duration_minutes: 180,
          academic_year: '2026',
          term: 'Term 3',
          competency_threshold: 50,
          status: 'published',
        });
        if (!assessErr) {
          const clId = '44444444-4444-4444-4444-444444444401';
          await supabase.from('observation_checklists').upsert({
            id: clId,
            assessment_id: sampleAssessmentId,
            title: 'OBSERVATION CHECKLIST',
            instruction:
              'Items to be Evaluated: Please award marks as appropriate. Give a brief comment on your observation.',
            sort_order: 0,
          });
          await supabase.from('checklist_criteria').upsert([
            {
              id: '55555555-5555-5555-5555-555555555501',
              checklist_id: clId,
              item_number: '1',
              description:
                'Wore appropriate Personal Protective Equipment (PPE) throughout the practical',
              max_marks: 4,
              is_subitem: false,
              sort_order: 0,
              performance_indicator:
                'Safety boots, insulated gloves, and safety goggles worn',
            },
            {
              id: '55555555-5555-5555-5555-555555555502',
              checklist_id: clId,
              item_number: '2',
              description:
                'Selected correct tools, instruments, and security system components from store',
              max_marks: 4,
              is_subitem: false,
              sort_order: 1,
              performance_indicator:
                'Multimeter, PIR sensor, control panel, siren, and cabling',
            },
            {
              id: '55555555-5555-5555-5555-555555555503',
              checklist_id: clId,
              item_number: '3',
              description:
                'Observed electrical isolation and lock-out/tag-out safety procedures',
              max_marks: 4,
              is_subitem: false,
              sort_order: 2,
            },
            {
              id: '55555555-5555-5555-5555-555555555504',
              checklist_id: clId,
              item_number: '4',
              description:
                'Maintained tidy workbench and cleared waste offcuts after completion',
              max_marks: 3,
              is_subitem: false,
              sort_order: 3,
            },
          ]);

          const task1Id = '66666666-6666-6666-6666-666666666601';
          const task2Id = '66666666-6666-6666-6666-666666666602';
          await supabase.from('assessment_tasks').upsert([
            {
              id: task1Id,
              assessment_id: sampleAssessmentId,
              task_number: 1,
              task_title: 'Conduit Layout, Trunking & Accessory Mounting',
              sort_order: 0,
            },
            {
              id: task2Id,
              assessment_id: sampleAssessmentId,
              task_number: 2,
              task_title: 'Cabling, Sensor Termination & Commissioning',
              sort_order: 1,
            },
          ]);
          await supabase.from('assessment_items').upsert([
            {
              id: '77777777-7777-7777-7777-777777777701',
              task_id: task1Id,
              item_number: '1',
              description:
                'Interpreted security system schematic diagram and marked mounting positions accurately',
              max_marks: 5,
              is_subcriterion: false,
              sort_order: 0,
              instruction:
                'Award max 5 marks for dimensional accuracy within ±2mm',
            },
            {
              id: '77777777-7777-7777-7777-777777777702',
              task_id: task1Id,
              item_number: '2',
              description:
                'Installed PVC trunking and conduit runs plumb, level, and securely saddled',
              max_marks: 10,
              is_subcriterion: false,
              sort_order: 1,
            },
            {
              id: '77777777-7777-7777-7777-777777777703',
              task_id: task2Id,
              item_number: '1',
              description:
                'Terminated zone loops, tamper circuit, and magnetic door contact with correct EOL resistors',
              max_marks: 10,
              is_subcriterion: false,
              sort_order: 0,
            },
            {
              id: '77777777-7777-7777-7777-777777777704',
              task_id: task2Id,
              item_number: '2',
              description:
                'Performed continuity/insulation checks and programmed entry/exit delay timers',
              max_marks: 10,
              is_subcriterion: false,
              sort_order: 1,
            },
          ]);
        }
      }

      res.json({
        success: true,
        message:
          'Sample institution, trainees, and practical assessment seeded to Supabase.',
      });
    },
  );

  // Vite dev middleware or static production build
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TVET e-ASSESS server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
