import { NextResponse } from "next/server";
import { getCookieName } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  res.cookies.set(getCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // ✅ come da richiesta
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}

export const dynamic = "force-dynamic";