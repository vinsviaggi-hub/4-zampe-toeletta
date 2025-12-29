// app/api/orders/status/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonNoStore(body: any, init?: { status?: number }) {
  const res = NextResponse.json(body, { status: init?.status ?? 200 });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

type StatusOk = {
  ok: true;
  status: "NUOVO" | "IN_LAVORAZIONE" | "PRONTO" | "CONSEGNATO" | "ANNULLATO" | string;
  orderId: string;
  message?: string;
};

type StatusErr = { ok: false; error: string };

function safeTel(t?: string) {
  return String(t || "").replace(/[^\d]/g, "");
}

function normalizeOrderId(v?: string) {
  return String(v || "").trim();
}

/**
 * NOTE IMPORTANTI
 * - Questo endpoint NON modifica niente.
 * - Per ora è “stub” (cioè finto) finché non colleghi gli ordini a Sheets/Supabase.
 * - Ti evita 500/bug: risponde sempre in modo pulito.
 *
 * Payload accettati:
 * { orderId: "ABC123", phone?: "333..." }
 * oppure querystring:
 * /api/orders/status?orderId=ABC123&phone=333...
 */
async function handle(orderId: string, phone?: string): Promise<StatusOk | StatusErr> {
  const id = normalizeOrderId(orderId);
  if (!id) return { ok: false, error: "orderId mancante." };

  const tel = safeTel(phone);

  // ✅ Placeholder: qui in futuro colleghi al tuo DB/Sheets.
  // Per adesso: risposte "sensate" senza inventare dati.
  // Se vuoi, puoi anche fare:
  // - se id inizia con "TEST" => PRONTO
  // - altrimenti => NUOVO
  const status = id.toUpperCase().startsWith("TEST") ? "PRONTO" : "NUOVO";

  return {
    ok: true,
    orderId: id,
    status,
    message: tel
      ? `Stato ordine ${id} per ${tel}: ${status}`
      : `Stato ordine ${id}: ${status}`,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const orderId = String(body?.orderId ?? body?.id ?? "").trim();
    const phone = body?.phone ? String(body.phone) : "";

    const out = await handle(orderId, phone);
    return jsonNoStore(out, { status: out.ok ? 200 : 400 });
  } catch (err: any) {
    console.error("❌ /api/orders/status error:", err);
    return jsonNoStore(
      { ok: false, error: "Errore server (orders/status).", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId") || url.searchParams.get("id") || "";
    const phone = url.searchParams.get("phone") || "";

    const out = await handle(orderId, phone);
    return jsonNoStore(out, { status: out.ok ? 200 : 400 });
  } catch (err: any) {
    console.error("❌ /api/orders/status GET error:", err);
    return jsonNoStore(
      { ok: false, error: "Errore server (orders/status).", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}