// app/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import ChatBox from "./components/chatbox";

type OrderType = "ASPORTO" | "CONSEGNA" | "TAVOLO";

const BUSINESS = {
  name: "Pala Pizza",
  tagline: "Pizzeria & Ristorante · Ordina o prenota in pochi secondi",
  address: "Via delle Pizze 21, 00100 Roma (RM)",
  phoneDisplay: "+39 06 9876 1234",     // ✅ NON è il tuo
  phoneTel: "+390698761234",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Via%20delle%20Pizze%2021%2C%2000100%20Roma%20(RM)",
  hours: [
    { day: "Lun–Gio", time: "12:00–15:00 · 18:00–23:00" },
    { day: "Ven–Sab", time: "12:00–15:00 · 18:00–00:00" },
    { day: "Dom", time: "18:00–23:00" },
  ],
};

function buildTimeOptions() {
  const out: string[] = [];
  const start = 18 * 60;
  const end = 23 * 60;
  for (let m = start; m <= end; m += 15) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    out.push(`${hh}:${mm}`);
  }
  return out;
}

export default function Page() {
  const timeOptions = useMemo(() => buildTimeOptions(), []);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<OrderType>("ASPORTO");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<"Contanti" | "Carta" | "Satispay">("Contanti");
  const [notes, setNotes] = useState("");
  const [order, setOrder] = useState("");

  const [glutenFree, setGlutenFree] = useState(false);
  const [lactoseFree, setLactoseFree] = useState(false);
  const [nutsAllergy, setNutsAllergy] = useState(false);
  const [otherAllergy, setOtherAllergy] = useState(false);

  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState<string | null>(null);
  const [sentErr, setSentErr] = useState<string | null>(null);

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;

    setSentOk(null);
    setSentErr(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedOrder = order.trim();

    if (!trimmedName || !trimmedPhone || !date || !time || !trimmedOrder) {
      setSentErr("Compila Nome, Telefono, Data, Ora e Ordine.");
      return;
    }
    if (type === "CONSEGNA" && !address.trim()) {
      setSentErr("Per la consegna serve l’indirizzo.");
      return;
    }

    setSending(true);

    try {
      const payload = {
        nome: trimmedName,
        telefono: trimmedPhone,
        tipo: type,
        data: date,       // ✅ così non rompe TypeScript
        ora: time,
        indirizzo: type === "CONSEGNA" ? address.trim() : "",
        pagamento: payment,
        note: notes.trim(),
        ordine: trimmedOrder,
        preferenze: {
          senzaGlutine: glutenFree,
          senzaLattosio: lactoseFree,
          allergiaFruttaSecca: nutsAllergy,
          allergiaAltro: otherAllergy,
        },
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const dataRes = await res.json().catch(() => null);

      if (!res.ok) {
        setSentErr(dataRes?.error || "Errore invio richiesta.");
        return;
      }

      setSentOk("Richiesta inviata ✅ Ti rispondiamo appena possibile.");
      setName("");
      setPhone("");
      setType("ASPORTO");
      setDate("");
      setTime("");
      setAddress("");
      setPayment("Contanti");
      setNotes("");
      setOrder("");
      setGlutenFree(false);
      setLactoseFree(false);
      setNutsAllergy(false);
      setOtherAllergy(false);
    } catch {
      setSentErr("Errore di rete. Riprova.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="appShell">
      <div className="wrap">
        {/* HEADER */}
        <div className="card">
          <div className="cardInner">
            <div className="cardHeader">
              <div>
                <div className="badge">🍕 {BUSINESS.name}</div>
                <h1 className="h1">
                  {BUSINESS.name} <span aria-hidden>🍕</span>
                </h1>
                <p className="sub">{BUSINESS.tagline}</p>

                <div className="pills">
                  <div className="pill">
                    <span aria-hidden>📍</span>
                    <span>{BUSINESS.address}</span>
                  </div>

                  <div className="pill">
                    <span aria-hidden>☎️</span>
                    <span>{BUSINESS.phoneDisplay}</span>
                  </div>

                  {/* Orari a tendina */}
                  <details className="pill">
                    <summary className="pillSmall" style={{ listStyle: "none", cursor: "pointer" }}>
                      <span aria-hidden>🕒</span> Orari di apertura ▾
                    </summary>
                    <div style={{ padding: "10px 6px 0" }}>
                      {BUSINESS.hours.map((h) => (
                        <div key={h.day} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                          <strong style={{ width: 74 }}>{h.day}</strong>
                          <span>{h.time}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>

              <div className="btnRow" style={{ minWidth: 240 }}>
                <a className="btn btnGreen" href={`tel:${BUSINESS.phoneTel}`}>
                  Chiama ora
                </a>
                <a className="btn" href={BUSINESS.mapsUrl} target="_blank" rel="noreferrer">
                  Indicazioni
                </a>
              </div>
            </div>

            <div className="hrGradient" />
          </div>
        </div>

        {/* MAIN */}
        <div className="grid2">
          {/* FORM */}
          <div className="card">
            <div className="cardInner">
              <h2 className="formTitle">Ordina / Prenota</h2>
              <p className="formSub">Inserisci i dati e invia la richiesta.</p>

              <form onSubmit={submitBooking}>
                <div className="formGrid">
                  <div className="field">
                    <div className="label">Nome</div>
                    <input
                      className="input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Es. Marco"
                      autoComplete="name"
                    />
                  </div>

                  <div className="field">
                    <div className="label">Telefono</div>
                    <input
                      className="input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Es. 333 123 4567"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>

                  <div className="field">
                    <div className="label">Tipo</div>
                    <select className="select" value={type} onChange={(e) => setType(e.target.value as OrderType)}>
                      <option value="ASPORTO">Asporto</option>
                      <option value="CONSEGNA">Consegna</option>
                      <option value="TAVOLO">Tavolo</option>
                    </select>
                  </div>

                  {type === "CONSEGNA" ? (
                    <div className="field">
                      <div className="label">Indirizzo (consegna)</div>
                      <input
                        className="input"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Es. Via Roma 10, Scala A"
                        autoComplete="street-address"
                      />
                    </div>
                  ) : (
                    <div className="field">
                      <div className="label">Pagamento (opzionale)</div>
                      <select className="select" value={payment} onChange={(e) => setPayment(e.target.value as any)}>
                        <option value="Contanti">Contanti</option>
                        <option value="Carta">Carta</option>
                        <option value="Satispay">Satispay</option>
                      </select>
                    </div>
                  )}

                  <div className="field">
                    <div className="label">Data</div>
                    <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>

                  <div className="field">
                    <div className="label">Ora (a tendina)</div>
                    <select className="select" value={time} onChange={(e) => setTime(e.target.value)} disabled={!date}>
                      <option value="">{date ? "Seleziona un orario" : "Scegli prima la data"}</option>
                      {timeOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <div className="smallHint">Se non trovi l’orario, scrivilo nelle note.</div>
                  </div>
                </div>

                <div className="checkRow">
                  <label className="check">
                    <input type="checkbox" checked={glutenFree} onChange={(e) => setGlutenFree(e.target.checked)} />
                    Senza glutine
                  </label>
                  <label className="check">
                    <input type="checkbox" checked={lactoseFree} onChange={(e) => setLactoseFree(e.target.checked)} />
                    Senza lattosio
                  </label>
                  <label className="check">
                    <input type="checkbox" checked={nutsAllergy} onChange={(e) => setNutsAllergy(e.target.checked)} />
                    Allergia frutta secca
                  </label>
                  <label className="check">
                    <input type="checkbox" checked={otherAllergy} onChange={(e) => setOtherAllergy(e.target.checked)} />
                    Allergia altro (scrivi nelle note)
                  </label>
                </div>

                <div style={{ marginTop: 12 }} className="field">
                  <div className="label">Ordine</div>
                  <textarea
                    className="textarea"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    placeholder="Es. 2 Margherite + 1 Diavola, 1 coca (allergie?)"
                  />
                </div>

                <div style={{ marginTop: 12 }} className="field">
                  <div className="label">Note (opzionale)</div>
                  <input
                    className="input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Es. senza cipolla, impasto integrale, ecc."
                  />
                </div>

                <div style={{ marginTop: 14 }}>
                  <button className="btn btnGreen" type="submit" disabled={sending}>
                    {sending ? "Invio..." : "Invia"}
                  </button>

                  {sentOk && <div style={{ marginTop: 10, fontWeight: 900 }}>{sentOk}</div>}
                  {sentErr && (
                    <div style={{ marginTop: 10, fontWeight: 900, color: "#b10f0f" }}>
                      ❌ {sentErr}
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* CHAT */}
          <div className="card">
            <div className="cardInner">
              <h2 className="formTitle">Chat assistente</h2>
              <p className="formSub">Menu, senza glutine, allergeni, ingredienti, tempi, ecc.</p>
              <ChatBox />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}