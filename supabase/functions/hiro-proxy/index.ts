const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
