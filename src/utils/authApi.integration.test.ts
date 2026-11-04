import { test } from 'node:test';
import crypto from 'node:crypto';
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

    const userEmail = `http-auth-${Date.now()}@example.test`;
    const userPassword = 'Correct-Horse-Battery-2026!';
    const signupResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'signup',
        email: userEmail,
        password: userPassword,
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
    const rawSessionToken = cookie.slice('dz_session='.length);
    const storedSession = await getDatabasePool().query(
      'SELECT token_hash FROM app_sessions WHERE token_hash=$1',
      [crypto.createHash('sha256').update(rawSessionToken).digest('hex')],
    );
    assert.equal(storedSession.rowCount, 1, 'database must store the SHA-256 digest of the session token');
    assert.notEqual(storedSession.rows[0]?.token_hash, rawSessionToken, 'raw session token must never be stored');

    const meResponse = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie } });
    assert.equal(meResponse.status, 200);
    const me = await meResponse.json() as { authenticated: boolean; user?: { id: string; role: string } };
    assert.equal(me.authenticated, true);
    assert.equal(me.user?.id, signup.user.id);
    assert.equal(me.user?.role, 'user');

    const oversizedFreeTrialResponse = await fetch(`${baseUrl}/api/generate-persona-speech`, {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ scriptText: 'x'.repeat(501), persona: 'zephyr_warm' }),
    });
    assert.equal(oversizedFreeTrialResponse.status, 400,
      'free-trial users must not bypass the 500-character limit with direct API requests');
    const allowanceAfterRejectedScript = await fetch(`${baseUrl}/api/auth/allowance`, { headers: { cookie } });
    assert.equal((await allowanceAfterRejectedScript.json() as { remaining: number }).remaining, 1,
      'rejected oversized input must not consume the free-trial generation');

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

    const rejectedLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'login', email: userEmail, password: 'wrong-password-123' }),
    });
    assert.equal(rejectedLogin.status, 401, 'incorrect password must not create a session');

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'login', email: userEmail, password: userPassword }),
    });
    assert.equal(loginResponse.status, 200);
    const loginCookie = (loginResponse.headers.get('set-cookie') || '').match(/dz_session=[a-f0-9]{64}/)?.[0];
    assert.ok(loginCookie, 'successful login must issue a new session cookie');
    const loginMe = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie: loginCookie } });
    assert.equal((await loginMe.json() as { authenticated: boolean }).authenticated, true);

    const loginToken = loginCookie.slice('dz_session='.length);
    const loginTokenHash = crypto.createHash('sha256').update(loginToken).digest('hex');
    await getDatabasePool().query(
      "UPDATE app_sessions SET expires_at=NOW() - INTERVAL '1 second' WHERE token_hash=$1",
      [loginTokenHash],
    );
    const expiredSessionResponse = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie: loginCookie } });
    assert.deepEqual(await expiredSessionResponse.json(), { authenticated: false },
      'expired sessions must not authenticate requests');
    const paymentLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'login', email: userEmail, password: userPassword }),
    });
    assert.equal(paymentLoginResponse.status, 200);
    const paymentCookie = (paymentLoginResponse.headers.get('set-cookie') || '').match(/dz_session=[a-f0-9]{64}/)?.[0];
    assert.ok(paymentCookie, 'customer must have an active session to submit a payment request');


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
    const paymentRequestResponse = await fetch(`${baseUrl}/api/subscriptions/requests`, {
      method: 'POST',
      headers: { cookie: paymentCookie, 'content-type': 'application/json' },
      body: JSON.stringify({
        plan: 'starter', billingCycle: 'monthly', paymentMethod: 'baridimob',
        transactionReference: `CI-TRANSFER-${Date.now()}`, amountDzd: 1,\n        receiptDataUrl: `data:image/png;base64,${Buffer.from([137,80,78,71,13,10,26,10]).toString('base64')}`,\n        receiptFilename: 'receipt.png',
      }),
    });
    assert.equal(paymentRequestResponse.status, 201, 'authenticated customer can submit a payment request');
    const paymentRequestPayload = await paymentRequestResponse.json() as {
      request: { id: string; amountDzd: number; status: string; email: string; receiptAvailable: boolean };
    };
    assert.equal(paymentRequestPayload.request.amountDzd, 2900, 'server must calculate the amount and ignore client-supplied price');
    assert.equal(paymentRequestPayload.request.status, 'pending');\n    assert.equal(paymentRequestPayload.request.receiptAvailable, true, 'uploaded receipt must be stored and marked available');
    assert.equal(paymentRequestPayload.request.email.toLowerCase(), userEmail.toLowerCase());

    const secondPendingRequest = await fetch(`${baseUrl}/api/subscriptions/requests`, {
      method: 'POST',
      headers: { cookie: paymentCookie, 'content-type': 'application/json' },
      body: JSON.stringify({
        plan: 'pro', billingCycle: 'annual', paymentMethod: 'edahabia',
        transactionReference: `CI-SECOND-${Date.now()}`,
      }),
    });
    assert.equal(secondPendingRequest.status, 409, 'a user cannot open multiple pending payment requests');

    const customerRequestsResponse = await fetch(`${baseUrl}/api/subscriptions/requests`, {
      headers: { cookie: paymentCookie },
    });
    assert.equal(customerRequestsResponse.status, 200);
    const customerRequests = await customerRequestsResponse.json() as { requests: Array<{ id: string }> };
    assert.equal(customerRequests.requests.length, 1, 'customers can only read their own payment requests');

    const pendingAdminRequests = await fetch(`${baseUrl}/api/admin/subscription-requests?status=pending`, {
      headers: { cookie: adminCookie },
    });
    assert.equal(pendingAdminRequests.status, 200, 'verified owner can review payment requests');
    const pendingPayload = await pendingAdminRequests.json() as { requests: Array<{ id: string; userId: string }> };
    const requestToApprove = pendingPayload.requests.find((request) => request.id === paymentRequestPayload.request.id);
    assert.ok(requestToApprove, 'submitted payment request must appear in admin queue');
    const receiptResponse = await fetch(`${baseUrl}/api/admin/subscription-requests/${paymentRequestPayload.request.id}/receipt`, {
      headers: { cookie: adminCookie },
    });
    assert.equal(receiptResponse.status, 200, 'only the authenticated owner can read a submitted receipt');
    assert.equal(receiptResponse.headers.get('content-type'), 'image/png');
    assert.equal((await receiptResponse.arrayBuffer()).byteLength, 8);

    const approvePaymentResponse = await fetch(`${baseUrl}/api/admin/subscription-requests/${paymentRequestPayload.request.id}`, {
      method: 'PATCH',
      headers: { cookie: adminCookie, 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'approved' }),
    });
    assert.equal(approvePaymentResponse.status, 200, 'admin approval must succeed after manual verification');
    const activatedUser = await getDatabasePool().query(
      'SELECT plan, monthly_generations_limit, subscription_expires_at FROM app_users WHERE id=$1',
      [signup.user.id],
    );
    assert.equal(activatedUser.rows[0]?.plan, 'starter');
    assert.equal(Number(activatedUser.rows[0]?.monthly_generations_limit), 50);
    assert.ok(activatedUser.rows[0]?.subscription_expires_at, 'approval must set a subscription expiry');

    const repeatedApproval = await fetch(`${baseUrl}/api/admin/subscription-requests/${paymentRequestPayload.request.id}`, {
      method: 'PATCH',
      headers: { cookie: adminCookie, 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'approved' }),
    });
    assert.equal(repeatedApproval.status, 409, 'a payment request cannot be approved twice');

  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await closeDatabasePool();
    delete process.env.ADMIN_PASSWORD;
  }
});
