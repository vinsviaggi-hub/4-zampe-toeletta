import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ✅ FISSI (come hai chiesto)
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyxeW7a15IihXKwkwbPz5tDAehM907_ZWuK6kVPLYh18oyliqopFhAzOFxvpaveNfA/exec";
const SHEET_NAME = "Ordini";

// (se il tuo script controlla un segreto, mettilo su Vercel come env GOOGLE_SCRIPT_SECRET)
const GOOGLE_SCRIPT_SECRET = process.env.GOOGLE_SCRIPT_SECRET || "";

type Booking = {
  timestamp?: string;
  name?: string;
  phone?: string;
  type?: string;
  date?: string;
  time?: string;
  allergens?: string;
  order?: string;
  address?: string;
  status?: string;
  source?: string; // "APP" / "MANUALE" ecc
  note?: string;
};

function pick(obj: any, keys: string[]) {
  if (!obj || typeof obj !== "object") return "";
  const lowerMap: Record<string, any> = {};
  for (const k of Object.keys(obj)) lowerMap[k.toLowerCase()] = obj[k];
  for (const k of keys) {
    const v = obj[k] ?? lowerMap[k.toLowerCase()];
    if (v !== undefined && v !== null) return String(v);
  }
  return "";
}

function normalizeStatus(s: string) {
  const x = (s || "").trim().toUpperCase();
  return x || "NUOVO";
}

function mapRowToBooking(row: any): Booking {
  const timestamp = pick(row, ["Timestamp", "timestamp"]);
  const name = pick(row, ["Nome", "name"]);
  const phone = pick(row, ["Telefono", "phone"]);
  const type = pick(row, ["Tipo", "type"]);
  const date = pick(row, ["Data", "date"]);
  const time = pick(row, ["Ora", "time"]);
  const allergens = pick(row, ["Allergeni", "allergeni", "allergens"]);
  const order = pick(row, ["Ordine", "order"]);
  const address = pick(row, ["Indirizzo", "address"]);
  const status = normalizeStatus(pick(row, ["Stato", "status"]));
  const source = pick(row, ["Bot o Manuale", "Bot/Manuale", "source"]);
  const note = pick(row, ["Note", "note"]);

  return { timestamp, name, phone, type, date, time, allergens, order, address, status, source, note };
}

function normalizePayload(data: any): Booking[] {
  const arr =
    (Array.isArray(data) && data) ||
    (Array.isArray(data?.bookings) && data.bookings) ||
    (Array.isArray(data?.data) && data.data) ||
    (Array.isArray(data?.rows) && data.rows) ||
    [];

  // formato: {headers:[], rows:[[]]}
  if (Array.isArray(data?.headers) && Array.isArray(data?.rows)) {
    const headers: string[] = data.headers.map((x: any) => String(x));
    return (data.rows as any[]).map((r) => {
      const obj: any = {};
      headers.forEach((h, i) => (obj[h] = r?.[i]));
      return mapRowToBooking(obj);
    });
  }

  // formato: prima riga headers
  if (Array.isArray(arr) && arr.length > 0 && Array.isArray(arr[0]) && typeof arr[0][0] === "string") {
    const headers: string[] = arr[0].map((x: any) => String(x));
    return (arr.slice(1) as any[]).map((r) => {
      const obj: any = {};
      headers.forEach((h, i) => (obj[h] = r?.[i]));
      return mapRowToBooking(obj);
    });
  }

  return (arr as any[]).map(mapRowToBooking);
}

async function tryPost() {
  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "list",
      sheet: SHEET_NAME,
      secret: GOOGLE_SCRIPT_SECRET,
    }),
    cache: "no-store",
  });
  const txt = await res.text();
  const json = (() => {
    try {
      return JSON.parse(txt);
    } catch {
      return null;
    }
  })();

  if (!res.ok) {
    throw new Error(`POST non ok: ${res.status} ${txt?.slice?.(0, 200)}`);
  }
  if (!json) throw new Error("POST ha risposto ma non è JSON");
  return json;
}

async function tryGet() {
  const url = new URL(SCRIPT_URL);
  url.searchParams.set("action", "list");
  url.searchParams.set("sheet", SHEET_NAME);
  if (GOOGLE_SCRIPT_SECRET) url.searchParams.set("secret", GOOGLE_SCRIPT_SECRET);

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  const txt = await res.text();
  const json = (() => {
    try {
      return JSON.parse(txt);
    } catch {
      return null;
    }
  })();

  if (!res.ok) {
    throw new Error(`GET non ok: ${res.status} ${txt?.slice?.(0, 200)}`);
  }
  if (!json) throw new Error("GET ha risposto ma non è JSON");
  return json;
}

export async function GET() {
  try {
    // ✅ prima provo POST, se il tuo Apps Script è doPost
    let data: any;
    try {
      data = await tryPost();
    } catch {
      // ✅ fallback GET, se il tuo Apps Script è doGet
      data = await tryGet();
    }

    const bookings = normalizePayload(data);
    return NextResponse.json(bookings);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Errore lettura prenotazioni", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}