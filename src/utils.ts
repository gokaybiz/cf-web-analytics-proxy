import { CACHE_TTL } from "./constants";
import type { ClientIP } from "./types";

export const getClientIP = (request: Request): ClientIP => {
  const cfIP = request.headers.get("CF-Connecting-IP");
  if (cfIP) return { ip: cfIP, source: "cf" };

  const forwarded = request.headers.get("X-Forwarded-For");
  if (forwarded)
    return {
      ip: forwarded.split(",")[0]?.trim() || "0.0.0.0",
      source: "forwarded",
    };

  const realIP = request.headers.get("X-Real-IP");
  if (realIP) return { ip: realIP, source: "real" };

  return { ip: "0.0.0.0", source: "unknown" };
};

export const addCORSHeaders = (
  response: Headers,
  origin?: string | null,
): Headers => {
  const headers = new Headers(response);
  headers.set("Access-Control-Allow-Origin", origin || "*");
  headers.set("Access-Control-Allow-Headers", "content-type");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Max-Age", CACHE_TTL.toString());
  return headers;
};

export const createProxyRequest = (
  original: Request,
  clientIP: string,
): Request => {
  const proxy = new Request(original);

  // Remove sensitive headers
  const sensitiveHeaders = ["cookie", "authorization", "cf-ray", "cf-visitor"];
  for (const header of sensitiveHeaders) {
    proxy.headers.delete(header);
  }

  // Lets don't skip the ip related headers
  proxy.headers.set("X-Forwarded-For", clientIP);
  proxy.headers.set("X-Real-IP", clientIP);
  proxy.headers.set("X-Client-IP", clientIP);
  proxy.headers.set("CF-Connecting-IP", clientIP);

  return proxy;
};
