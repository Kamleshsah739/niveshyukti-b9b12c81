import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { logIpoFeedFailure, runIpoFeedSync } from "./lib/ipo-feed";
import { runStockFeedSync } from "./lib/stock-feed";
import { runNewsFeedSync } from "./lib/news-feed";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL_KEYS = ["SUPABASE_URL", "VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const;
const SUPABASE_ANON_KEYS = ["SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;
const IPO_SYNC_TOKEN_KEYS = ["IPO_SYNC_TOKEN", "VITE_IPO_SYNC_TOKEN"] as const;
const FMP_API_KEY_KEYS = ["FMP_API_KEY", "VITE_FMP_API_KEY"] as const;
const ALPHA_VANTAGE_API_KEY_KEYS = ["ALPHA_VANTAGE_API_KEY", "VITE_ALPHA_VANTAGE_API_KEY"] as const;
const FINNHUB_API_KEY_KEYS = ["FINNHUB_API_KEY", "VITE_FINNHUB_API_KEY"] as const;
const SUPABASE_SERVICE_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_KEY",
  "SUPABASE_SECRET_KEY",
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_SERVICE_KEY",
  "VITE_SUPABASE_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
] as const;
const IMPORT_META_ENV_MAP: Record<string, string | undefined> = {
  SUPABASE_URL: import.meta.env.SUPABASE_URL,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.SUPABASE_ANON_KEY,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_SERVICE_KEY: import.meta.env.SUPABASE_SERVICE_KEY,
  SUPABASE_SECRET_KEY: import.meta.env.SUPABASE_SECRET_KEY,
  VITE_SUPABASE_SERVICE_ROLE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  VITE_SUPABASE_SERVICE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_KEY,
  VITE_SUPABASE_SECRET_KEY: import.meta.env.VITE_SUPABASE_SECRET_KEY,
  NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: import.meta.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
  IPO_SYNC_TOKEN: import.meta.env.IPO_SYNC_TOKEN,
  VITE_IPO_SYNC_TOKEN: import.meta.env.VITE_IPO_SYNC_TOKEN,
  FMP_API_KEY: import.meta.env.FMP_API_KEY,
  VITE_FMP_API_KEY: import.meta.env.VITE_FMP_API_KEY,
  ALPHA_VANTAGE_API_KEY: import.meta.env.ALPHA_VANTAGE_API_KEY,
  VITE_ALPHA_VANTAGE_API_KEY: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY,
  FINNHUB_API_KEY: import.meta.env.FINNHUB_API_KEY,
  VITE_FINNHUB_API_KEY: import.meta.env.VITE_FINNHUB_API_KEY,
};

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const syncResponse = await maybeHandleSyncRequest(request, env);
      if (syncResponse) {
        return syncResponse;
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
  async scheduled(
    _controller: unknown,
    env: unknown,
    ctx: { waitUntil: (promise: Promise<unknown>) => void },
  ) {
    const runtime = (env ?? {}) as Record<string, unknown>;
    ctx.waitUntil(
      Promise.allSettled([
        runNewsFeedSync(runtime),
        runStockFeedSync(runtime),
        runIpoFeedSync({ runtime, source: "cron" }),
      ]).then((results) => {
        results.forEach((result) => {
          if (result.status === "rejected") console.error("Scheduled data sync failed", result.reason);
        });
      }),
    );
  },
};

async function maybeHandleSyncRequest(request: Request, env: unknown): Promise<Response | null> {
  const url = new URL(request.url);
  const isCronPath = url.pathname === "/api/ipo-sync";
  const isManualPath = url.pathname === "/api/ipo-sync-manual";
  const isHealthPath = url.pathname === "/api/ipo-sync-health";
  const isStockPath = url.pathname === "/api/stock-sync";
  const isNewsPath = url.pathname === "/api/news-sync";

  if (!isCronPath && !isManualPath && !isHealthPath && !isStockPath && !isNewsPath) {
    return null;
  }

  if ((isCronPath || isManualPath || isStockPath || isNewsPath) && request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  if (isHealthPath && request.method !== "GET") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  const runtime = (env ?? {}) as Record<string, unknown>;
  const isManual = isManualPath;
  const manualAccessToken = isManual ? getBearerToken(request) : null;

  try {
    if (isManual || isHealthPath) {
      const authResponse = await authorizeManualIpoSync(request, runtime);
      if (authResponse) {
        return authResponse;
      }
      if (isHealthPath) {
        return json(
          {
            ok: true,
            role: "super_admin",
            runtime: {
              supabaseUrl: hasFirstRuntimeString(runtime, SUPABASE_URL_KEYS),
              anonKey: hasFirstRuntimeString(runtime, SUPABASE_ANON_KEYS),
              serviceRoleKey: hasFirstRuntimeString(runtime, SUPABASE_SERVICE_KEYS),
              syncToken: hasFirstRuntimeString(runtime, IPO_SYNC_TOKEN_KEYS),
              fmpApiKey: hasFirstRuntimeString(runtime, FMP_API_KEY_KEYS),
              alphaVantageApiKey: hasFirstRuntimeString(runtime, ALPHA_VANTAGE_API_KEY_KEYS),
              finnhubApiKey: hasFirstRuntimeString(runtime, FINNHUB_API_KEY_KEYS),
            },
            message: "Manual sync health check passed.",
          },
          200,
        );
      }
    } else if (isStockPath || isNewsPath) {
      const token = getFirstRuntimeString(runtime, IPO_SYNC_TOKEN_KEYS) ?? "";
      const providedToken = request.headers.get("x-sync-token") ?? "";
      if (!token || providedToken !== token) {
        const authResponse = await authorizeManualIpoSync(request, runtime);
        if (authResponse) return authResponse;
      }
    } else {
      const token = getFirstRuntimeString(runtime, IPO_SYNC_TOKEN_KEYS) ?? "";
      const providedToken = request.headers.get("x-sync-token") ?? "";

      if (!token || providedToken !== token) {
        return json({ ok: false, error: "Unauthorized" }, 401);
      }
    }

    if (isStockPath) {
      const result = await runStockFeedSync(runtime);
      return json({ ok: true, synced: result.synced, source: result.source }, 200);
    }

    if (isNewsPath) {
      const result = await runNewsFeedSync(runtime);
      return json({ ok: true, synced: result.synced, feeds: result.feeds }, 200);
    }

    const result = await runIpoFeedSync({
      runtime,
      source: isManual ? "manual" : "cron",
      accessToken: manualAccessToken ?? undefined,
    });

    return json({ ok: true, synced: result.synced, sources: result.sources }, 200);
  } catch (error) {
    console.error(error);
    await logIpoFeedFailure({
      runtime,
      source: isManual ? "manual" : "cron",
      errorMessage: toErrorMessage(error, "IPO sync failed"),
      accessToken: manualAccessToken ?? undefined,
    });
    return json({ ok: false, error: toErrorMessage(error, "IPO sync failed") }, 500);
  }
}

async function authorizeManualIpoSync(request: Request, runtime: Record<string, unknown>): Promise<Response | null> {
  const accessToken = getBearerToken(request) ?? "";

  if (!accessToken) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  const supabaseUrl = getFirstRuntimeString(runtime, SUPABASE_URL_KEYS);
  const anonKey = getFirstRuntimeString(runtime, SUPABASE_ANON_KEYS);
  const serviceRoleKey = getFirstRuntimeString(runtime, SUPABASE_SERVICE_KEYS);
  const authKey = anonKey ?? serviceRoleKey;

  if (!supabaseUrl || !authKey) {
    return json({ ok: false, error: "Missing SUPABASE_URL and auth key runtime secrets." }, 500);
  }

  const authClient = createClient(supabaseUrl, authKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(accessToken);

  if (userError || !user) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  const { data: profile, error: profileError } = await authClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileError && profile?.role === "super_admin") {
    return null;
  }

  if (serviceRoleKey) {
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: serviceProfile, error: serviceProfileError } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!serviceProfileError && serviceProfile?.role === "super_admin") {
      return null;
    }
  }

  const roleHint =
    typeof user.app_metadata?.role === "string"
      ? user.app_metadata.role
      : typeof user.user_metadata?.role === "string"
        ? user.user_metadata.role
        : null;

  if (roleHint === "super_admin") {
    return null;
  }

  if (profileError) {
    return json({ ok: false, error: `Forbidden: profile lookup failed (${profileError.message})` }, 403);
  }

  return json({ ok: false, error: "Forbidden: your profile role is not super_admin." }, 403);
}

function getRuntimeString(runtime: Record<string, unknown>, key: string): string | null {
  const direct = asNonEmptyString(runtime[key]);
  if (direct) {
    return direct;
  }

  const cloudflare = asObject(runtime.cloudflare);
  const context = asObject(runtime.context);
  const platform = asObject(runtime.platform);

  const containers: unknown[] = [
    runtime.env,
    runtime.bindings,
    cloudflare?.env,
    context?.cloudflare,
    asObject(context?.cloudflare)?.env,
    platform?.env,
    asObject(platform?.cf)?.env,
  ];

  for (const container of containers) {
    const containerObject = asObject(container);
    if (!containerObject) continue;
    const containerValue = asNonEmptyString(containerObject[key]);
    if (containerValue) {
      return containerValue;
    }
  }

  const processValue = typeof process !== "undefined" ? asNonEmptyString(process.env[key]) : null;
  if (processValue) {
    return processValue;
  }

  const directImportMetaValue = asNonEmptyString(IMPORT_META_ENV_MAP[key]);
  if (directImportMetaValue) {
    return directImportMetaValue;
  }

  if (!key.startsWith("VITE_")) {
    const viteAliasValue = asNonEmptyString(IMPORT_META_ENV_MAP[`VITE_${key}`]);
    if (viteAliasValue) {
      return viteAliasValue;
    }
  }

  return null;
}

function getFirstRuntimeString(runtime: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = getRuntimeString(runtime, key);
    if (value) {
      return value;
    }
  }
  return null;
}

function hasFirstRuntimeString(runtime: Record<string, unknown>, keys: readonly string[]): boolean {
  return getFirstRuntimeString(runtime, keys) !== null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return null;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error.trim();
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
      error_description?: unknown;
    };

    const parts = [candidate.message, candidate.details, candidate.hint, candidate.error_description, candidate.code]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0);

    if (parts.length > 0) {
      return Array.from(new Set(parts)).join(" | ");
    }
  }

  return fallback;
}

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

