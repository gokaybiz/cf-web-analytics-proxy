import {
  CWA_API,
  CWA_SCRIPT,
  CWA_BEACON,
  CACHE_TTL,
  CDN_CACHE_TTL,
} from "./constants";
import { getClientIP, addCORSHeaders, createProxyRequest } from "./utils";
import type { RequestType, WorkerHandler } from "./types";

const getRequestType = (url: URL): RequestType => {
  if (url.pathname.endsWith(".js")) return "js";
  return "api";
};

const handleJSRequest = async (request: Request, ctx: ExecutionContext) => {
  const cacheKey = new Request(request.url, { method: "GET" });
  const cached = await caches.default.match(cacheKey);

  if (cached) return cached;

  const response = await fetch(CWA_SCRIPT, {
    headers: {
      "User-Agent": request.headers.get("User-Agent") || "CloudflareWorker",
      Accept: "application/javascript, */*",
    },
  });

  if (!response.ok) return response;

  const headers = new Headers(response.headers);
  headers.set("Cache-Control", `public, max-age=${CACHE_TTL}, immutable`);
  headers.set("CDN-Cache-Control", `public, max-age=${CDN_CACHE_TTL}`);

  const cachedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });

  ctx.waitUntil(caches.default.put(cacheKey, cachedResponse.clone()));
  return cachedResponse;
};

const handleAPIRequest = async (request: Request) => {
  const url = new URL(request.url);
  const clientInfo = getClientIP(request);
  const proxyRequest = createProxyRequest(request, clientInfo.ip);

  // Route to correct CWA endpoint
  let targetUrl = `${CWA_API}${url.search}`;

  if (url.pathname.includes("/beacon/performance")) {
    targetUrl = `${CWA_BEACON}${url.search}`;
  }

  const response = await fetch(targetUrl, proxyRequest);
  const headers = addCORSHeaders(
    response.headers,
    request.headers.get("Origin"),
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const handleOPTIONS = (request: Request) => {
  const headers = addCORSHeaders(new Headers(), request.headers.get("Origin"));
  return new Response(null, { status: 204, headers });
};

const handler: WorkerHandler = async (request, _, ctx) => {
  try {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return handleOPTIONS(request);
    }

    const requestType = getRequestType(url);

    return requestType === "js"
      ? handleJSRequest(request, ctx)
      : handleAPIRequest(request);
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp: Date.now(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export default { fetch: handler };
