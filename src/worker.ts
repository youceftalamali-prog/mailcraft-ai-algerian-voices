import { httpServerHandler } from 'cloudflare:node';
import { app } from '../server';
import { runWithDatabaseConnectionString } from './server/database';

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
const expressHandler = httpServerHandler({ port: 3000 });

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
      return runWithDatabaseConnectionString(
        env.HYPERDRIVE.connectionString,
        () => expressHandler(request),
        { GEMINI_API_KEY: env.GEMINI_API_KEY, ADMIN_PASSWORD: env.ADMIN_PASSWORD },
      ).catch((error: unknown) => {
        console.error('Worker API request failed:', error);
        return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
      });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies { fetch(request: Request, env: WorkerEnv): Promise<Response> };
