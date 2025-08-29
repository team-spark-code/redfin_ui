// app/api/llm/route.ts
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPSTREAM = "http://169.254.83.107:8030/redfin_target-insight";

export async function POST(req: Request) {
  const started = Date.now();
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 10000);

  try {
    const r = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ac.signal,
    });
    const text = await r.text();
    console.log("[/api/llm] upstream", { url: UPSTREAM, status: r.status, ms: Date.now()-started });
    return new NextResponse(text, { status: r.status, headers: { "Content-Type": r.headers.get("content-type") ?? "application/json" } });
  } catch (err: any) {
    const reason = err?.name === "AbortError" ? "timeout(>10s)" : (err?.code ?? err?.message ?? String(err));
    console.error("[/api/llm] upstream error", { url: UPSTREAM, ms: Date.now()-started, reason });
    return NextResponse.json({ error: "Upstream call failed", detail: reason }, { status: 502 });
  } finally {
    clearTimeout(to);
  }
}
