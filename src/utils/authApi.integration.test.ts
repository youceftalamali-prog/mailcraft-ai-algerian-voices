import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { app } from '../../server.js';
import { closeDatabasePool, getDatabasePool } from '../server/database.js';
import { ADMIN_EMAIL, registerOrGetUser, updateUser } from '../server/security.js';

const databaseAvailable = Boolean(process.env.DATABASE_URL);
const TEST_ADMIN_PASSWORD = 'ci-only-admin-secret-2026-not-production';

test('HTTP authentication flow: signup, session persistence, logout, and owner-only admin access', {
  skip: !databaseAvailable ? 'DATABASE_URL is not configured; isolated PostgreSQL is required' : false,
}, async () => {
  // This process runs against the disposable PostgreSQL service configured by CI.
  process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

  const server = app.listen(0);
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const signupResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'signup',
        email: `http-auth-${Date.now()}@example.test`,
        password: 'Correct-Horse-Battery-2026!',
      }),
    });
    assert.equal(signupResponse.status, 200);
    const signup = await signupResponse.json() as { success: boolean; user: { id: string; role: string } };
    assert.equal(signup.success, true);
    assert.equal(signup.user.role, 'user');

    const setCookie = signupResponse.headers.get('set-cookie') || '';
    assert.match(setCookie, /(?:^|,\s*)dz_session=[a-f0-9]{64}/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /Secure/i);
    assert.match(setCookie, /SameSite=Lax/i);
    const cookie = setCookie.match(/dz_session=[a-f0-9]{64}/)?.[0];
    assert.ok(cookie, 'signup must issue a session cookie');

    const meResponse = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie } });
    assert.equal(meResponse.status, 200);
    const me = await meResponse.json() as { authenticated: boolean; user?: { id: string; role: string } };
    assert.equal(me.authenticated, true);
    assert.equal(me.user?.id, signup.user.id);
    assert.equal(me.user?.role, 'user');

    const userAdminResponse = await fetch(`${baseUrl}/api/admin/system-stats`, { headers: { cookie } });
    assert.equal(userAdminResponse.status, 403, 'ordinary users must not access admin endpoints');

    const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { cookie },
    });
    assert.equal(logoutResponse.status, 200);
    assert.match(logoutResponse.headers.get('set-cookie') || '', /Max-Age=0/i);

    const afterLogout = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie } });
    assert.equal(afterLogout.status, 200);
    assert.deepEqual(await afterLogout.json(), { authenticated: false });

    // Simulate a legacy owner row with a downgraded role in the disposable DB.
    const owner = await registerOrGetUser(ADMIN_EMAIL, 'admin');
    await updateUser(owner.id, { role: 'user', plan: 'free' });
    const wrongSecretResponse = await fetch(`${baseUrl}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: 'incorrect-ci-secret' }),
    });
    assert.equal(wrongSecretResponse.status, 401);
    const ownerAfterWrongSecret = await getDatabasePool().query(
      'SELECT role FROM app_users WHERE id=$1', [owner.id],
    );
    assert.equal(ownerAfterWrongSecret.rows[0]?.role, 'user', 'wrong secret must not grant admin role');

    const adminLoginResponse = await fetch(`${baseUrl}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }),
    });
    assert.equal(adminLoginResponse.status, 200);
    const adminLogin = await adminLoginResponse.json() as { success: boolean; user: { role: string; email: string } };
    assert.equal(adminLogin.success, true);
    assert.equal(adminLogin.user.role, 'admin');
    assert.equal(adminLogin.user.email.toLowerCase(), ADMIN_EMAIL.toLowerCase());

    const adminCookieHeader = adminLoginResponse.headers.get('set-cookie') || '';
    const adminCookie = adminCookieHeader.match(/dz_session=[a-f0-9]{64}/)?.[0];
    assert.ok(adminCookie, 'owner login must issue a session cookie');
    const adminMeResponse = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie: adminCookie } });
    const adminMe = await adminMeResponse.json() as { authenticated: boolean; user?: { role: string } };
    assert.equal(adminMe.authenticated, true);
    assert.equal(adminMe.user?.role, 'admin');

    const adminRouteResponse = await fetch(`${baseUrl}/api/admin/system-stats`, {
      headers: { cookie: adminCookie },
    });
    assert.equal(adminRouteResponse.status, 200, 'verified owner must access admin endpoints');
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await closeDatabasePool();
    delete process.env.ADMIN_PASSWORD;
  }
});
