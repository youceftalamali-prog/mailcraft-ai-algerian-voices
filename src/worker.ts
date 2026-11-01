import { httpServerHandler } from 'cloudflare:node';
import { app } from '../server';
import { runWithDatabaseConnectionString } from './server/database';

interface WorkerAssets {
  fetch(request: Request): Promise<Response>;
}

interface WorkerEnv {
  ASSETS: WorkerAssets;
  HYPERDRIVE?: { connectionString: string };
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
      );
    }

    return env.ASSETS.fetch(request);
  },
} satisfies { fetch(request: Request, env: WorkerEnv): Promise<Response> };
