import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { app } from '../../server.js';

test('runtime health is JSON and bypasses database and session initialization', async () => {
  const server = app.listen(0);
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const address = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/api/health/runtime`, {
      headers: { cookie: 'dz_session=invalid-session-token' },
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /application\/json/i);
    assert.equal(response.headers.get('cache-control'), 'no-store');

    const payload = await response.json() as {
      status: string;
      runtime: string;
      databaseContext: { active: boolean; clientCreated: boolean; connectionPending: boolean };
    };
    assert.equal(payload.status, 'ok');
    assert.equal(payload.runtime, 'cloudflare-worker-express');
    assert.deepEqual(payload.databaseContext, {
      active: false,
      clientCreated: false,
      connectionPending: false,
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
