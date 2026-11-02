declare module 'cloudflare:node' {
  export function httpServerHandler(
    serverOrOptions: { port: number } | import('node:http').Server
  ): (request: Request, env?: unknown, ctx?: unknown) => Promise<Response> | Response;

  export function handleAsNodeRequest(
    port: number,
    request: Request
  ): Promise<Response>;
}
