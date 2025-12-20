"use client";

import React, { useMemo, useState, type FormEvent } from "react";
import ChatBox from "./components/chatbox";

type Status = "idle" | "loading" | "success" | "error";
type OrderType = "ASPORTO" | "CONSEGNA" | "TAVOLO";

export default function Page() {
  // === DATI (Pala Pizza 🍕) ===
  const BUSINESS_NAME = "Pala Pizza 🍕";
  const TAGLINE = "Pizzeria & Ristorante · Ordina o prenota in pochi secondi";
  const ADDRESS = "Via Roma 10, 00100 Roma (RM)";

  // ✅ NUMERO CASUALE (non il tuo)
  const PHONE = "+39 351 987 6543";

  const HOURS = useMemo(
    () => [
      { day: "Lun–Gio", time: "12:00–15:00 · 18:00–23:00" },
      { day: "Ven–Sab", time: "12:00–15:00 · 18:00–00:00" },
      { day: "Dom", time: "18:00–23:00" },
    ],
    []
  );

  const mapsLink = useMemo(() => {
    const q = encodeURIComponent(`${BUSINESS_NAME}, ${ADDRESS}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [BUSINESS_NAME, ADDRESS]);

  const [hoursOpen, setHoursOpen] = useState(false);

  // === FORM ===
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState<string>("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<OrderType>("ASPORTO");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [order, setOrder] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const isDelivery = type === "CONSEGNA";
  const isTable = type === "TAVOLO";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg("");

    if (!name.trim()) return setMsg("Scrivi il nome.");
    if (!phone.trim()) return setMsg("Scrivi un numero di telefono.");
    if (!date) return setMsg("Scegli una data.");
    if (!time) return setMsg("Scegli un orario.");

    if (isDelivery && !address.trim()) return setMsg("Per la consegna serve l’indirizzo.");
    if (!order.trim()) {
      return setMsg(
        isTable
          ? "Scrivi: numero persone + preferenza (interno/esterno)."
          : "Scrivi cosa vuoi ordinare."
      );
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: name.trim(),
          telefono: phone.trim(),
          tipo:
            type === "ASPORTO" ? "ASPORTO" : type === "CONSEGNA" ? "CONSEGNA" : "TAVOLO",
          data,
          ora: time,
          ordine: order.trim(),
          indirizzo: isDelivery ? address.trim() : "",
          note: notes.trim(),
          botOrManuale: "WEBAPP",
          negozio: BUSINESS_NAME,
        }),
      });

      const dataResp = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus("error");
        setMsg(dataResp?.error || "Errore durante l’invio. Riprova.");
        return;
      }

      setStatus("success");
      setMsg("Richiesta inviata ✅ Ti ricontattiamo al più presto.");

      setName("");
      setPhone("");
      setDate("");
      setTime("");
      setOrder("");
      setAddress("");
      setNotes("");

      setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("error");
      setMsg("Errore di rete. Controlla la connessione e riprova.");
    }
  }

  return (
    <main
      className={[
        "min-h-screen text-zinc-900",
        "bg-gradient-to-b from-amber-200 via-orange-200 to-rose-200",
        "relative overflow-x-hidden",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -top-24 -left-24 h-[340px] w-[340px] rounded-full bg-red-500/25 blur-3xl" />
      <div className="pointer-events-none absolute top-10 -right-24 h-[380px] w-[380px] rounded-full bg-amber-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />

      <section className="mx-auto max-w-5xl px-4 pt-6 pb-4">
        <div className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.14)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1 text-sm text-zinc-900">
                <span className="text-lg">🍕</span>
                <span>{BUSINESS_NAME.replace(" 🍕", "")}</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                {BUSINESS_NAME}
              </h1>

              <p className="text-zinc-800">{TAGLINE}</p>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <span className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-3 py-2 text-sm text-zinc-900">
                  📍 <span className="font-semibold">{ADDRESS}</span>
                </span>

                <span className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-3 py-2 text-sm text-zinc-900">
                  ☎️ <span className="font-semibold">{PHONE}</span>
                </span>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setHoursOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-3 py-2 text-sm font-extrabold text-zinc-900 hover:bg-white active:scale-[0.99]"
                    aria-expanded={hoursOpen}
                  >
                    🕒 Orari di apertura
                    <span className="ml-1 text-xs opacity-80">{hoursOpen ? "▲" : "▼"}</span>
                  </button>

                  {hoursOpen && (
                    <div className="absolute z-20 mt-2 w-[260px] rounded-2xl border border-black/10 bg-white/95 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
                      <div className="text-sm font-extrabold text-zinc-900">Orari</div>
                      <div className="mt-2 space-y-2">
                        {HOURS.map((h) => (
                          <div key={h.day} className="flex items-start justify-between gap-3">
                            <div className="text-sm font-bold text-zinc-900">{h.day}</div>
                            <div className="text-sm text-zinc-800 text-right">{h.time}</div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setHoursOpen(false)}
                        className="mt-3 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold hover:bg-zinc-50"
                      >
                        Chiudi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:min-w-[240px]">
              <a
                href={`tel:${PHONE.replace(/\s+/g, "")}`}
                className="rounded-2xl bg-emerald-700 px-4 py-3 text-center font-extrabold text-white shadow-[0_12px_24px_rgba(16,185,129,0.25)] hover:bg-emerald-800 active:scale-[0.99]"
              >
                Chiama ora
              </a>

              <a
                href={mapsLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-center font-extrabold text-zinc-900 hover:bg-white active:scale-[0.99]"
              >
                Indicazioni
              </a>

              <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-semibold text-zinc-800">
                Per ordini e prenotazioni, compila il modulo qui sotto.
              </div>
            </div>
          </div>

          <div className="mt-5 h-[6px] w-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600 opacity-90" />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur">
            <h2 className="text-2xl font-extrabold text-zinc-900">Ordina / Prenota</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-800">
              Inserisci i dati e invia la richiesta.
            </p>

            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl bg-white border border-black/15 px-3 py-3 outline-none text-zinc-900 placeholder:text-zinc-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                    placeholder="Es. Giuseppe"
                    autoComplete="name"
                  />
                </Field>

                <Field label="Telefono">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-2xl bg-white border border-black/15 px-3 py-3 outline-none text-zinc-900 placeholder:text-zinc-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                    placeholder="Es. 333 000 1122"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </Field>
              </div>

              <Field label="Tipo">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as OrderType)}
                  className="w-full rounded-2xl bg-white border border-black/15 px-3 py-3 outline-none text-zinc-900 focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                >
                  <option value="ASPORTO">Asporto</option>
                  <option value="CONSEGNA">Consegna</option>
                  <option value="TAVOLO">Tavolo</option>
                </select>
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Data">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-2xl bg-white border border-black/15 px-3 py-3 outline-none text-zinc-900 focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                  />
                </Field>

                <Field label="Ora">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-2xl bg-white border border-black/15 px-3 py-3 outline-none text-zinc-900 focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                  />
                </Field>
              </div>

              <Field label={isTable ? "Dettagli tavolo" : "Ordine"}>
                <textarea
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="min-h-[110px] w-full rounded-2xl bg-white border border-black/15 px-3 py-3 outline-none text-zinc-900 placeholder:text-zinc-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                  placeholder={
                    isTable
                      ? "Es. 2 persone, interno. (oppure 4 persone, esterno)"
                      : "Es. 2 margherite + 1 coca (se hai allergie scrivilo)"
                  }
                />
              </Field>

              {isDelivery && (
                <Field label="Indirizzo consegna">
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="min-h-[80px] w-full rounded-2xl bg-white border border-black/15 px-3 py-3 outline-none text-zinc-900 placeholder:text-zinc-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                    placeholder="Via, numero, citofono, interno…"
                  />
                </Field>
              )}

              <Field label="Note (opzionale)">
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-2xl bg-white border border-black/15 px-3 py-3 outline-none text-zinc-900 placeholder:text-zinc-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                  placeholder="Es. senza glutine, no cipolla, ecc."
                />
              </Field>

              {!!msg && (
                <div
                  className={[
                    "rounded-2xl border px-3 py-3 text-sm font-extrabold",
                    status === "success"
                      ? "border-emerald-600/30 bg-emerald-50 text-emerald-800"
                      : status === "error"
                      ? "border-red-600/30 bg-red-50 text-red-800"
                      : "border-black/10 bg-white/70 text-zinc-900",
                  ].join(" ")}
                >
                  {msg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-2xl bg-emerald-800 text-white px-4 py-3 font-extrabold hover:bg-emerald-900 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {status === "loading" ? "Invio in corso…" : "Invia"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur">
            <h2 className="text-2xl font-extrabold text-zinc-900">Chat assistente</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-800">
              Qui solo info: menu, senza glutine, allergeni, ingredienti, ecc. <br />
              Per ordini/prenotazioni usa il modulo a sinistra.
            </p>

            <div className="mt-4">
              <ChatBox />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-extrabold text-zinc-900">{label}</div>
      {children}
    </label>
  );
}