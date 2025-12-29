// app/api/admin/me/route.ts
import { NextResponse } from "next/server";
import { getCookieName } from "@/lib/adminAuth";

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

export async function GET(req: Request) {
  try {
    const cookieName = getCookieName();
    const cookie = req.headers.get("cookie") || "";
    const m = cookie.match(new RegExp(`${cookieName}=([^;]+)`));
    const sessionValue = m?.[1] ? decodeURIComponent(m[1]) : "";

    const expected = getEnv("ADMIN_SESSION_SECRET");

    // supporto compat: alcuni file controllano loggedIn, altri isLoggedIn/authenticated
    const loggedIn = Boolean(expected && sessionValue && sessionValue === expected);

    return jsonNoStore(
      {
        ok: true,
        loggedIn,
        isLoggedIn: loggedIn,
        authenticated: loggedIn,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return jsonNoStore(
      { ok: false, error: `Errore interno: ${String(err?.message || err)}` },
      { status: 500 }
    );
  }
}