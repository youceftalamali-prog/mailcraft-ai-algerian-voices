import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_EMAIL, hashPassword, verifyPassword, checkGenerationAllowance,
  initializeAuthStore, createUser, authenticateUser, getUserByEmail,
  createSession, getSession, destroySession, registerOrGetUser,
} from '../server/security.js';

describe('Authentication primitives', () => {
  test('scrypt password hashing verifies only the correct password', () => {
    const salt = 'a1b2c3d4e5f60718';
    const password = 'MySecurePassword2026!';
    const hash = hashPassword(password, salt);
    assert.ok(hash.length >= 128);
    assert.equal(verifyPassword(password, salt, hash), true);
    assert.equal(verifyPassword('WrongPassword123', salt, hash), false);
  });

  test('free trial allowance is limited to one generation', () => {
    const user = {
      id: 'trial-user', email: 'trial@example.test', role: 'user' as const, plan: 'free' as const,
      trialGenerationsUsed: 0, trialGenerationsLimit: 1, monthlyGenerationsUsed: 0,
      monthlyGenerationsLimit: 0, createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString(),
    };
    assert.equal(checkGenerationAllowance(user).allowed, true);
    user.trialGenerationsUsed = 1;
    assert.equal(checkGenerationAllowance(user).allowed, false);
  });

  test('administrator allowance is unlimited', () => {
    const result = checkGenerationAllowance({
      id: 'admin', email: ADMIN_EMAIL, role: 'admin', plan: 'business',
      trialGenerationsUsed: 100, trialGenerationsLimit: 1, monthlyGenerationsUsed: 100,
      monthlyGenerationsLimit: 1, createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString(),
    });
    assert.equal(result.allowed, true);
    assert.equal(result.plan, 'admin_unlimited');
  });
});

describe('Neon PostgreSQL authentication integration', () => {
  const skip = !process.env.DATABASE_URL;
  test('signup, login, persistent session lookup and logout', { skip }, async () => {
    await initializeAuthStore();
    const email = `auth-test-${Date.now()}@example.test`;
    const user = await createUser(email, 'Correct-Horse-Battery-2026!');
    assert.equal(user.role, 'user');
    assert.equal(await getUserByEmail(email)?.then((u) => u?.id), user.id);
    assert.equal(await authenticateUser(email, 'incorrect-password'), null);
    assert.equal((await authenticateUser(email, 'Correct-Horse-Battery-2026!'))?.id, user.id);

    const session = await createSession(user.id, '127.0.0.1');
    assert.ok(session.token.length >= 64);
    assert.equal((await getSession(session.token))?.userId, user.id);
    assert.equal(await destroySession(session.token), true);
    assert.equal(await getSession(session.token), null);
  });

  test('owner account is created as admin only', { skip }, async () => {
    await initializeAuthStore();
    const admin = await registerOrGetUser(ADMIN_EMAIL, 'admin');
    assert.equal(admin.role, 'admin');
    assert.equal(admin.email.toLowerCase(), ADMIN_EMAIL.toLowerCase());
  });
});
