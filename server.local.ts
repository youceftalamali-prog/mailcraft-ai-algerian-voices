import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { app } from './server';
import { initializeAuthStore } from './src/server/security';
import { closeDatabasePool } from './src/server/database';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

async function startLocalServer(): Promise<void> {
  await initializeAuthStore();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use((await import('express')).default.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`MailCraft AI server running on port ${PORT}`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; shutting down gracefully.`);
    httpServer.close(async (error) => {
      if (error) console.error('HTTP server shutdown error:', error);
      try {
        await closeDatabasePool();
      } catch (dbError) {
        console.error('Database pool shutdown error:', dbError);
      } finally {
        process.exit(error ? 1 : 0);
      }
    });
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

startLocalServer().catch((error) => {
  console.error('Fatal local server startup error:', error);
  process.exit(1);
});
