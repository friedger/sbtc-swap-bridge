// Allowlist of origins permitted to call this proxy
const ALLOWED_ORIGINS = new Set<string>([
  "https://xbtc-sbtc-swap.lovable.app",
  "https://xbtc-swap.fastpool.org",
  "https://id-preview--51414901-3767-40c7-86d8-44d2500eee19.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
]);

// Allow any *.lovable.app / *.lovableproject.com subdomain (preview/sandbox URLs)
const ALLOWED_ORIGIN_SUFFIXES = [".lovable.app", ".lovableproject.com"];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return ALLOWED_ORIGIN_SUFFIXES.some((suffix) => host.endsWith(suffix));
  } catch {
    return false;
  }
}

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin && isOriginAllowed(origin) ? origin : "null";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

const HIRO_API_URL = "https://api.mainnet.hiro.so";
const HIRO_API_KEY = Deno.env.get("VITE_HIRO_API_KEY") || "";

// In-memory cache with TTL
const cache = new Map<string, { data: string; headers: Record<string, string>; expiry: number }>();

// Cache TTL by path pattern (in seconds)
function getCacheTTL(path: string): number {
  // Balance & token info: 30s (changes with transactions)
  if (path.includes("/balances") || path.includes("/ft/")) return 30;
  // Contract read-only calls: 60s
  if (path.includes("/contract_call") || path.includes("/map_entry")) return 60;
  // Transaction details (finalized): 5 min
  if (path.match(/\/tx\/0x[a-f0-9]{64}$/)) return 300;
  // Transaction events: 2 min
  if (path.includes("/events")) return 120;
  // Address transactions: 30s
  if (path.includes("/transactions")) return 30;
  // Default: 30s
  return 30;
}

function getCacheKey(path: string, body: string | null): string {
  return body ? `${path}::${body}` : path;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    // Reject preflight from disallowed origins
    if (!isOriginAllowed(origin)) {
      return new Response("Forbidden", { status: 403 });
    }
    return new Response("ok", { headers: corsHeaders });
  }

  // Enforce origin allowlist on actual requests.
  // Browsers always send Origin for cross-origin fetches; same-origin requests
  // (or non-browser clients) won't have it — block those too since this proxy
  // is only intended for our web app.
  if (!isOriginAllowed(origin)) {
    return new Response(JSON.stringify({ error: "Forbidden origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    // The path after /hiro-proxy/ is the Hiro API path
    const pathMatch = url.pathname.match(/\/hiro-proxy\/(.*)/);
    const hiroPath = pathMatch ? pathMatch[1] : "";
    const queryString = url.search;
    const targetUrl = `${HIRO_API_URL}/${hiroPath}${queryString}`;

    // Read body for POST requests
    let body: string | null = null;
    if (req.method === "POST") {
      body = await req.text();
    }

    // Check cache
    const cacheKey = getCacheKey(`/${hiroPath}${queryString}`, body);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return new Response(cached.data, {
        headers: {
          ...corsHeaders,
          ...cached.headers,
          "x-cache": "HIT",
        },
      });
    }

    // Forward request to Hiro API
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": HIRO_API_KEY,
      },
    };
    if (body) {
      fetchOptions.body = body;
    }

    const response = await fetch(targetUrl, fetchOptions);
    const responseText = await response.text();
    const contentType = response.headers.get("content-type") || "application/json";

    // Cache successful responses
    if (response.ok) {
      const ttl = getCacheTTL(`/${hiroPath}`);
      cache.set(cacheKey, {
        data: responseText,
        headers: { "Content-Type": contentType },
        expiry: Date.now() + ttl * 1000,
      });

      // Evict old entries if cache gets too large
      if (cache.size > 500) {
        const now = Date.now();
        for (const [key, val] of cache) {
          if (val.expiry < now) cache.delete(key);
        }
      }
    }

    return new Response(responseText, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "x-cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Hiro proxy error:", error);
    return new Response(JSON.stringify({ error: "Proxy error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

