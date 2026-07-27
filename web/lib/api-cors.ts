export const apiCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
} as const;

export function jsonWithCors(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      ...apiCorsHeaders,
      ...(init?.headers ?? {})
    }
  });
}

export function optionsCors() {
  return new Response(null, {
    status: 204,
    headers: apiCorsHeaders
  });
}
