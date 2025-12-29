// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import { getCookieName } from "@/lib/adminAuth";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonNoStore(body: any, init?: { status?: number }) {
  const res = NextResponse.json(body, { status: init?.status ?? 200 });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

function getEnv(name: string) {
  return (process.env[name] ?? "").trim();
}

function safeEqual(a: string, b: string) {
  // evita timing attacks (anche se qui è un pannello semplice)
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

export async function POST(req: Request) {
  try {
    const ADMIN_PASSWORD = getEnv("ADMIN_PASSWORD");
    const ADMIN_SESSION_SECRET = getEnv("ADMIN_SESSION_SECRET");

    if (!ADMIN_PASSWORD) {
      return jsonNoStore({ ok: false, error: "ADMIN_PASSWORD mancante nelle env." }, { status: 500 });
    }
    if (!ADMIN_SESSION_SECRET) {
      return jsonNoStore({ ok: false, error: "ADMIN_SESSION_SECRET mancante nelle env." }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    const password = String(body?.password ?? "").trim();

    if (!password) {
      return jsonNoStore({ ok: false, error: "Password mancante." }, { status: 400 });
    }

    if (!safeEqual(password, ADMIN_PASSWORD)) {
      return jsonNoStore({ ok: false, error: "Password errata." }, { status: 401 });
    }

    const cookieName = getCookieName();

    const res = jsonNoStore({ ok: true, loggedIn: true }, { status: 200 });

    // cookie session: contiene esattamente ADMIN_SESSION_SECRET
    res.cookies.set({
      name: cookieName,
      value: ADMIN_SESSION_SECRET,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 giorni
    });

    return res;
  } catch (err: any) {
    return jsonNoStore({ ok: false, error: `Errore interno: ${String(err?.message || err)}` }, { status: 500 });
  }
}