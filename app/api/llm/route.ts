// app/api/llm/route.ts
import { NextResponse } from "next/server";
import { Agent } from "undici";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// 환경변수로도 바꿀 수 있게
const UPSTREAM = process.env.LLM_UPSTREAM ?? "http://192.168.0.66:8030/redfin_target-insight";

// undici 에이전트: 연결 타임아웃 명시
const agent = new Agent({
  connect: { timeout: 5000 }, // TCP connect 타임아웃
});

export async function POST(req: Request) {
  const started = Date.now();
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 120_000); // 120s

  try {
    const r = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ac.signal,
      cache: "no-store",
      dispatcher: agent, // ← undici agent 사용
    });

    const text = await r.text();
    console.log("[/api/llm] upstream", { url: UPSTREAM, status: r.status, ms: Date.now() - started });

    return new NextResponse(text, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err: any) {
    // undici는 cause 안쪽에 SystemError(code, errno, address, port)가 들어있습니다.
    const info = {
      url: UPSTREAM,
      ms: Date.now() - started,
      name: err?.name,
      message: err?.message,
      code: err?.code ?? err?.cause?.code,
      errno: err?.cause?.errno,
      syscall: err?.cause?.syscall,
      address: err?.cause?.address,
      port: err?.cause?.port,
    };
    console.error("[/api/llm] upstream error", info);

    return NextResponse.json(
      { error: "Upstream call failed", detail: info },
      { status: 502 }
    );
  } finally {
    clearTimeout(to);
  }
}
