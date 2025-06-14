/**
 * Request types handled by the proxy:
 * - js: Static JavaScript beacon file (/beacon.min.js)
 * - api: All analytics endpoints (rum, beacon, performance)
 */
export type RequestType = "js" | "api";

/**
 * Client's IP
 */
export interface ClientIP {
  readonly ip: string;
  readonly source: "cf" | "forwarded" | "real" | "unknown";
}

export type WorkerHandler = (
  request: Request,
  env: Record<string, unknown>,
  ctx: ExecutionContext,
) => Promise<Response>;
