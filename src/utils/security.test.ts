import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_EMAIL,
  hashPassword,
  verifyPassword,
  createSession,
  getSession,
  destroySession,
  registerOrGetUser,
  createUser,
  authenticateUser,
  getUserByEmail,
  checkGenerationAllowance,
  incrementGenerationUsage,
  ServerUser,
} from '../server/security.js';

describe('Security & Authentication Subsystem', () => {
  test('secure password hashing and timing-safe verification', () => {
    const salt = 'a1b2c3d4e5f60718';
    const password = 'MySecurePassword2026!';
    const hash = hashPassword(password, salt);

    assert.ok(hash.length >= 64, 'Password hash should be 64+ bytes hex');
    assert.equal(verifyPassword(password, salt, hash), true, 'Correct password must verify');
    assert.equal(verifyPassword('WrongPassword123', salt, hash), false, 'Incorrect password must fail');
  });

  test('new accounts require a strong password and authenticate only with the correct password', () => {
    const email = `secure-${Date.now()}@example.test`;
    assert.throws(() => createUser(email, 'short'), /WEAK_PASSWORD/);
    const user = createUser(email, 'Correct-Horse-Battery-2026!');
    assert.equal(user.role, 'user');
    assert.equal(user.passwordHash === 'Correct-Horse-Battery-2026!', false);
    assert.equal(authenticateUser(email, 'wrong-password'), null);
    assert.equal(authenticateUser(email, 'Correct-Horse-Battery-2026!')?.id, user.id);
  });

  test('session creation, retrieval, and destruction', () => {
    const dummyUserId = 'test-user-' + Date.now();
    const session = createSession(dummyUserId, '127.0.0.1', 1);

    assert.ok(session.token && session.token.length >= 32, 'Session token must be secure random hex');
    assert.equal(session.userId, dummyUserId);

    const retrieved = getSession(session.token);
    assert.ok(retrieved, 'Session must be retrievable before expiration');
    assert.equal(retrieved.userId, dummyUserId);

    const destroyed = destroySession(session.token);
    assert.equal(destroyed, true);
    assert.equal(getSession(session.token), null, 'Destroyed session must return null');
  });

  test('role-based access control enforces admin exclusively for owner', () => {
    const adminUser = registerOrGetUser(ADMIN_EMAIL);
    assert.equal(adminUser.role, 'admin');
    assert.equal(adminUser.email.toLowerCase(), ADMIN_EMAIL.toLowerCase());

    const normalUser = registerOrGetUser('customer.oran@gmail.com');
    assert.equal(normalUser.role, 'user');
    assert.equal(normalUser.plan, 'free');
  });

  test('server-side free-trial and usage limit enforcement', () => {
    const testUser: ServerUser = {
      id: 'trial-user-' + Date.now(),
      email: 'trial.user@store.dz',
      role: 'user',
      plan: 'free',
      trialGenerationsUsed: 0,
      trialGenerationsLimit: 1,
      monthlyGenerationsUsed: 0,
      monthlyGenerationsLimit: 1,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // First generation is allowed
    const allowance1 = checkGenerationAllowance(testUser);
    assert.equal(allowance1.allowed, true);
    assert.equal(allowance1.remaining, 1);

    // Consume the 1 trial generation
    incrementGenerationUsage(testUser);
    assert.equal(testUser.trialGenerationsUsed, 1);

    // Subsequent generation attempt MUST be rejected by server
    const allowance2 = checkGenerationAllowance(testUser);
    assert.equal(allowance2.allowed, false, 'Free trial bypass must be strictly blocked on server');
    assert.ok(allowance2.reason?.includes('استهلكت إعلان التجربة المجاني'));
  });

  test('admin user has unlimited generation allowance', () => {
    const adminUser: ServerUser = {
      id: 'admin-unlimited',
      email: ADMIN_EMAIL,
      role: 'admin',
      plan: 'business',
      trialGenerationsUsed: 50,
      trialGenerationsLimit: 999999,
      monthlyGenerationsUsed: 200,
      monthlyGenerationsLimit: 999999,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const allowance = checkGenerationAllowance(adminUser);
    assert.equal(allowance.allowed, true);
    assert.equal(allowance.plan, 'admin_unlimited');
  });
});
