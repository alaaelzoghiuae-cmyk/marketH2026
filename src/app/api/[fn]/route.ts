/* eslint-disable @typescript-eslint/no-explicit-any */
// Adapter that runs the Vercel-style serverless functions found in /marketH2026/api
// (handler(req, res)) inside Next.js route handlers, so the preview behaves like production.
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Handler = (req: any, res: any) => unknown;
type Loader = () => Promise<{ default: Handler }>;

const loaders: Record<string, Loader> = {
  // @ts-ignore - plain JS modules without type declarations
  "ai-sourcing": () => import("../../../../marketH2026/api/ai-sourcing.js"),
  // @ts-ignore
  gsmarena: () => import("../../../../marketH2026/api/gsmarena.js"),
  // @ts-ignore
  "karambo-live": () => import("../../../../marketH2026/api/karambo-live.js"),
  // @ts-ignore
  "store-reviews-live": () => import("../../../../marketH2026/api/store-reviews-live.js"),
  // @ts-ignore
  notify: () => import("../../../../marketH2026/api/notify.js"),
};

async function run(request: NextRequest, fn: string): Promise<Response> {
  const load = loaders[fn];
  if (!load) return Response.json({ ok: false, error: "not found" }, { status: 404 });
  const mod = await load();

  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((v, k) => (query[k] = v));

  let body: any = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const raw = await request.text();
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      body = raw;
    }
  }

  const req: any = {
    method: request.method,
    headers,
    query,
    body: body ?? {},
    url: url.pathname + url.search,
    socket: { remoteAddress: headers["x-forwarded-for"] || "127.0.0.1" },
  };

  return new Promise<Response>((resolve) => {
    const outHeaders = new Headers();
    let statusCode = 200;
    let done = false;
    const finish = (payload: BodyInit | null) => {
      if (done) return;
      done = true;
      resolve(new Response(payload, { status: statusCode, headers: outHeaders }));
    };
    const res: any = {
      get statusCode() {
        return statusCode;
      },
      set statusCode(v: number) {
        statusCode = v;
      },
      setHeader(k: string, v: string) {
        outHeaders.set(k, String(v));
        return res;
      },
      getHeader: (k: string) => outHeaders.get(k) ?? undefined,
      status(n: number) {
        statusCode = n;
        return res;
      },
      json(obj: unknown) {
        outHeaders.set("Content-Type", "application/json; charset=utf-8");
        finish(JSON.stringify(obj));
        return res;
      },
      send(data: unknown) {
        finish(typeof data === "string" ? data : JSON.stringify(data));
        return res;
      },
      end(data?: string) {
        finish(data ?? null);
        return res;
      },
    };
    Promise.resolve(mod.default(req, res))
      .then(() => finish(null))
      .catch(() => {
        statusCode = 500;
        outHeaders.set("Content-Type", "application/json");
        finish(JSON.stringify({ ok: false, error: "handler error" }));
      });
  });
}

type Ctx = { params: Promise<{ fn: string }> };
const handle = async (request: NextRequest, ctx: Ctx) => run(request, (await ctx.params).fn);

export const GET = handle;
export const POST = handle;
export const OPTIONS = handle;
