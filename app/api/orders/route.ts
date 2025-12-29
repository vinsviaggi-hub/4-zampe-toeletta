// app/api/orders/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreJson(body: any, status = 200) {
  const res = NextResponse.json(body, { status });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

/**
 * Stub ordini.
 * - Per negozi che NON fanno ordini: evita 404 e basta.
 * - Se in futuro abiliti gli ordini, qui colleghi Sheets/Supabase.
 */

// GET /api/orders -> lista vuota
export async function GET() {
  return noStoreJson({ ok: true, orders: [], note: "Orders disabled (stub)." }, 200);
}

// POST /api/orders -> accetta payload e risponde "non abilitato"
export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json().catch(() => null);
  } catch {}

  return noStoreJson(
    {
      ok: false,
      error: "ORDINI_NON_ABILITATI",
      message: "Questo negozio non gestisce ordini online (endpoint stub).",
      received: body ?? undefined,
    },
    400
  );
}