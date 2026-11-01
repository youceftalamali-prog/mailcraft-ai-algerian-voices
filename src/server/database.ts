import { AsyncLocalStorage } from 'node:async_hooks';
import { Client, Pool } from 'pg';

interface WorkerDatabaseContext {
  connectionString: string;
  env?: Record<string, string | undefined>;
  client?: Client;
  connected?: Promise<void>;
}

type QueryFunction = Pool['query'];
interface DatabaseClient {
  query: QueryFunction;
  release(): void;
}
interface DatabaseAdapter {
  query: QueryFunction;
  connect(): Promise<DatabaseClient>;
}

const workerDatabaseContext = new AsyncLocalStorage<WorkerDatabaseContext>();
const workerRequestContexts = new Map<string, WorkerDatabaseContext>();
let localPool: Pool | undefined;

/**
 * Bind one Hyperdrive connection string to the lifetime of a single Worker
 * request. The Client is created lazily and is never shared between requests.
 */
export function runWithDatabaseConnectionString<T>(
  connectionString: string,
  callback: () => T,
  env?: Record<string, string | undefined>,
): T {
  if (!connectionString) throw new Error('HYPERDRIVE connectionString is required');
  return workerDatabaseContext.run({ connectionString, env }, callback);
}

/**
 * Restore the request context inside Express after the Cloudflare Node HTTP
 * bridge dispatches the request on its own asynchronous execution path.
 */
export function registerWorkerDatabaseContext(
  requestId: string,
  connectionString: string,
  env?: Record<string, string | undefined>,
): void {
  if (!requestId || !connectionString) throw new Error('Worker database request context is incomplete');
  workerRequestContexts.set(requestId, { connectionString, env });
}

export function runWithRegisteredWorkerDatabaseContext<T>(
  requestId: string,
  callback: () => T,
): T | undefined {
  const context = workerRequestContexts.get(requestId);
  if (!context) return undefined;
  return workerDatabaseContext.run(context, callback);
}

export async function releaseWorkerDatabaseContext(requestId: string): Promise<void> {
  const context = workerRequestContexts.get(requestId);
  workerRequestContexts.delete(requestId);
  if (context?.client) {
    try {
      await context.client.end();
    } catch (error) {
      console.error('Failed to close request-scoped database client:', error instanceof Error ? error.name : 'unknown');
    }
  }
}

function getWorkerDatabaseAdapter(context: WorkerDatabaseContext): DatabaseAdapter {
  const getClient = async (): Promise<Client> => {
    if (!context.client) {
      context.client = new Client({ connectionString: context.connectionString });
      context.connected = context.client.connect().then(() => undefined);
    }
    await context.connected;
    return context.client;
  };

  const query = (async (...args: Parameters<QueryFunction>) => {
    const client = await getClient();
    return (client.query as (...queryArgs: any[]) => ReturnType<QueryFunction>)(...args);
  }) as QueryFunction;

  return {
    query,
    async connect(): Promise<DatabaseClient> {
      const client = await getClient();
      return {
        query: ((...args: Parameters<QueryFunction>) =>
          (client.query as (...queryArgs: any[]) => ReturnType<QueryFunction>)(...args)) as QueryFunction,
        // The request-scoped Client is owned by the Worker invocation. Do not
        // close it here: other queries in the same request may still use it.
        release() {},
      };
    },
  };
}

export function getRequestEnvironmentValue(name: string): string | undefined {
  const workerContext = workerDatabaseContext.getStore();
  return workerContext?.env?.[name] ?? process.env[name];
}

export function getDatabasePool(): DatabaseAdapter {
  const workerContext = workerDatabaseContext.getStore();
  if (workerContext) return getWorkerDatabaseAdapter(workerContext);

  if (localPool) return localPool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  localPool = new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX || 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: true } : undefined,
  });
  localPool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error);
  });
  return localPool;
}

export async function verifyDatabaseConnection(): Promise<void> {
  await getDatabasePool().query('SELECT 1');
}

export async function closeDatabasePool(): Promise<void> {
  if (!localPool) return;
  const current = localPool;
  localPool = undefined;
  await current.end();
}
