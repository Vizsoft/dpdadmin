const DEFAULT_METHODS = "GET, POST, OPTIONS";
const DEFAULT_HEADERS = "Authorization, Content-Type";

function parseOrigins(): string[] {
  const raw = process.env.DRIVER_APP_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = parseOrigins();
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": DEFAULT_METHODS,
    "Access-Control-Allow-Headers": DEFAULT_HEADERS,
    "Access-Control-Max-Age": "86400",
  };

  if (origin && (allowed.length === 0 || allowed.includes(origin))) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  } else if (allowed.length === 1) {
    headers["Access-Control-Allow-Origin"] = allowed[0]!;
  }

  return headers;
}

export function withCors(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const origin = request.headers.get("origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const response = await handler(request);
    const merged = new Headers(response.headers);
    const cors = corsHeaders(origin);
    for (const [k, v] of Object.entries(cors)) {
      merged.set(k, v);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: merged,
    });
  };
}
