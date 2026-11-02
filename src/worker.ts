import { handleAsNodeRequest } from 'cloudflare:node';
import { app } from '../server';
import {
  registerWorkerDatabaseContext,
  releaseWorkerDatabaseContext,
} from './server/database';

interface WorkerAssets {
  fetch(request: Request): Promise<Response>;
}

interface WorkerEnv {
  ASSETS: WorkerAssets;
  HYPERDRIVE?: { connectionString: string };
  GEMINI_API_KEY?: string;
  ADMIN_PASSWORD?: string;
}

// Cloudflare's Node HTTP integration preserves the existing Express routes.
// The Node bootstrap in server.local.ts remains the local development entrypoint.
app.listen(3000);

export default {
  fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const pathname = new URL(request.url).pathname;

    // Keep API traffic on Express; serve the Vite SPA through the Assets binding.
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      if (!env.HYPERDRIVE?.connectionString) {
        return Promise.resolve(Response.json(
          { error: 'DATABASE_NOT_CONFIGURED', message: 'Hyperdrive is not configured for this Worker.' },
          { status: 503 },
        ));
      }
      const requestId = crypto.randomUUID();
      registerWorkerDatabaseContext(
        requestId,
        env.HYPERDRIVE.connectionString,
        { GEMINI_API_KEY: env.GEMINI_API_KEY, ADMIN_PASSWORD: env.ADMIN_PASSWORD },
      );

      const headers = new Headers(request.headers);
      headers.set('x-internal-worker-db-context', requestId);
      const bridgedRequest = new Request(request, { headers });

      return (async (): Promise<Response> => {
        try {
          return await handleAsNodeRequest(3000, bridgedRequest);
        } catch (error: unknown) {
          const diagnostic = error instanceof Error
            ? { name: error.name, message: error.message }
            : { type: typeof error };
          console.error('Worker API request failed:', {
            requestId,
            method: bridgedRequest.method,
            pathname,
            ...diagnostic,
          });
          return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
        } finally {
          await releaseWorkerDatabaseContext(requestId);
        }
      })();
    }

    return env.ASSETS.fetch(request);
  },
} satisfies { fetch(request: Request, env: WorkerEnv): Promise<Response> };
