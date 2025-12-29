"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getBusinessConfig } from "@/app/config/business";

type AvailabilityOk = { ok: true; freeSlots: string[]; date?: string };
type AvailabilityErr = { ok: false; error: string; details?: any };
type AvailabilityResponse = AvailabilityOk | AvailabilityErr;

type CreateOk = { ok: true; message?: string };
type CreateErr = { ok: false; error: string; conflict?: boolean; details?: any };
type CreateResponse = CreateOk | CreateErr;

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function prettyDate(iso: string) {
  if (!iso || iso.length !== 10) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function hexToRgb(hex?: string) {
  const h = String(hex || "").replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
}
function rgba(hex: string, a: number) {
  const c = hexToRgb(hex);
  if (!c) return `rgba(212,175,55,${a})`;
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

export default function FastBookingForm() {
  const biz = useMemo(() => {
    try {
      return getBusinessConfig() as any;
    } catch {
      return {} as any;
    }
  }, []);

  const SERVICES: string[] =
    Array.isArray(biz?.servicesList) && biz.servicesList.length > 0
      ? biz.servicesList
      : ["Bagno", "Tosatura", "Taglio + bagno", "Unghie", "Pulizia orecchie"];

  // Palette (non cambiamo la pagina, solo leggibilità del form)
  const gold = "#D4AF37";
  const danger = biz?.theme?.danger || "#EF4444";
  const accent = biz?.theme?.accent || "#38BDF8";

  const todayISO = useMemo(() => toISODate(new Date()), []);
  const [dogName, setDogName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [taglia, setTaglia] = useState<"Piccola" | "Media" | "Grande">("Media");
  const [pelo, setPelo] = useState<"Corto" | "Medio" | "Lungo">("Corto");

  const [service, setService] = useState(SERVICES[0] || "");
  const [dateISO, setDateISO] = useState(todayISO);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsMsg, setSlotsMsg] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<string>("");
  const [resultType, setResultType] = useState<"ok" | "warn" | "err" | "">("");

  async function fetchAvailability(date: string) {
    // prova POST, se 405 ripiega su GET (così funziona sia con route POST che GET)
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });

      if (res.status === 405) throw new Error("METHOD_NOT_ALLOWED");

      const data = (await res.json().catch(() => null)) as AvailabilityResponse | null;
      return { res, data };
    } catch (e: any) {
      const res = await fetch(`/api/availability?date=${encodeURIComponent(date)}`, { method: "GET" });
      const data = (await res.json().catch(() => null)) as AvailabilityResponse | null;
      return { res, data };
    }
  }

  async function loadAvailability(nextDateISO: string) {
    setLoadingSlots(true);
    setSlots([]);
    setTime("");
    setSlotsMsg("");

    try {
      const { data } = await fetchAvailability(nextDateISO);

      if (!data || typeof data !== "object" || !("ok" in data)) {
        setSlotsMsg("Risposta non valida dal server (availability).");
        return;
      }

      if (!data.ok) {
        setSlotsMsg(data.error || "Errore nel recupero disponibilità.");
        return;
      }

      const free = Array.isArray(data.freeSlots) ? data.freeSlots : [];
      setSlots(free);

      if (free.length === 0) {
        setSlotsMsg("Nessun orario disponibile per questa data.");
      } else {
        setSlotsMsg("");
        setTime(free[0]);
      }
    } catch {
      setSlotsMsg("Errore di rete (availability).");
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    loadAvailability(dateISO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResultMsg("");
    setResultType("");

    const dog = dogName.trim();
    const owner = ownerName.trim();
    const p = phone.trim();

    if (!dog || !owner || !p || !taglia || !pelo || !service || !dateISO || !time) {
      setResultType("warn");
      setResultMsg("Compila tutti i campi obbligatori (cane, padrone, telefono, taglia, pelo, servizio, data, ora).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_booking",
          ownerName: owner,
          name: owner, // compatibilità
          phone: p,
          dogName: dog,
          taglia,
          pelo,
          service,
          date: dateISO,
          time,
          notes: notes.trim(),
        }),
      });

      const data = (await res.json().catch(() => null)) as CreateResponse | null;

      if (!data || typeof data !== "object" || !("ok" in data)) {
        setResultType("err");
        setResultMsg("Risposta non valida dal server (booking).");
        return;
      }

      if (!data.ok) {
        setResultType(data.conflict ? "warn" : "err");
        setResultMsg(data.error || "Errore durante la prenotazione.");
        if (data.conflict) await loadAvailability(dateISO);
        return;
      }

      setResultType("ok");
      setResultMsg("✅ Prenotazione inviata! Ti aspettiamo 🐾");

      setDogName("");
      setOwnerName("");
      setPhone("");
      setNotes("");
      setTaglia("Media");
      setPelo("Corto");

      await loadAvailability(dateISO);
    } catch {
      setResultType("err");
      setResultMsg("Errore di rete (booking).");
    } finally {
      setSubmitting(false);
    }
  }

  const styles: Record<string, React.CSSProperties> = {
    card: {
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.16)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06))",
      padding: 16,
      boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    },
    title: {
      fontSize: 22,
      fontWeight: 950,
      margin: 0,
      color: "rgba(255,255,255,0.94)",
      letterSpacing: -0.2,
      textShadow: "0 10px 30px rgba(0,0,0,0.35)",
    },
    subtitle: { marginTop: 6, marginBottom: 12, color: "rgba(255,255,255,0.82)", lineHeight: 1.45 },
    grid: { display: "grid", gap: 12 },
    label: { fontSize: 13, fontWeight: 950, color: "rgba(255,255,255,0.92)" },

    // più leggibile (sfondo chiaro ma non bianco)
    input: {
      width: "100%",
      padding: "12px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.20)",
      background: "rgba(255,255,255,0.10)",
      color: "rgba(255,255,255,0.95)",
      outline: "none",
      fontSize: 15,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
    },
    helper: { marginTop: 6, color: "rgba(255,255,255,0.78)", fontSize: 12, lineHeight: 1.35 },

    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },

    chip: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderRadius: 999,
      border: `1px solid ${rgba(accent, 0.30)}`,
      background: `${rgba(accent, 0.12)}`,
      fontWeight: 900,
      fontSize: 12,
      color: "rgba(255,255,255,0.92)",
    },

    // ✅ bottone ORO
    btn: {
      width: "100%",
      border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: 16,
      padding: "14px 14px",
      fontWeight: 950,
      cursor: "pointer",
      color: "#0A0F1A",
      background: `linear-gradient(90deg, ${rgba(gold, 0.98)} 0%, ${rgba(gold, 0.72)} 60%, rgba(255,255,255,0.14) 140%)`,
      boxShadow: `0 18px 46px ${rgba(gold, 0.18)}`,
      letterSpacing: 0.2,
    },
    btnDisabled: {
      filter: "grayscale(0.25) brightness(0.92)",
      opacity: 0.85,
      cursor: "not-allowed",
    },

    msgOk: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 12,
      background: "rgba(34,197,94,0.16)",
      border: "1px solid rgba(255,255,255,0.16)",
      color: "rgba(255,255,255,0.94)",
      fontSize: 13,
      fontWeight: 850,
    },
    msgWarn: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 12,
      background: "rgba(255, 190, 0, 0.16)",
      border: "1px solid rgba(255,255,255,0.16)",
      color: "rgba(255,255,255,0.94)",
      fontSize: 13,
      fontWeight: 850,
    },
    msgErr: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 12,
      background: `${rgba(danger, 0.18)}`,
      border: "1px solid rgba(255,255,255,0.16)",
      color: "rgba(255,255,255,0.94)",
      fontSize: 13,
      fontWeight: 850,
    },
  };

  return (
    <section style={styles.card}>
      <h2 style={styles.title}>Prenota adesso 🐾</h2>
      <div style={styles.subtitle}>Scegli una data: ti mostriamo solo gli orari disponibili. Se trovi pieno, cambia data.</div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={styles.chip}>📍 {biz?.city ?? "Teramo (TE)"}</div>
        <div style={styles.chip}>🧼 Toelettatura</div>
      </div>

      <form onSubmit={onSubmit} style={styles.grid}>
        <div>
          <div style={styles.label}>Nome del cane *</div>
          <input
            style={styles.input}
            placeholder="Es. Luna"
            value={dogName}
            onChange={(e) => setDogName(e.target.value)}
            autoComplete="off"
          />
          <div style={styles.helper}>Serve per riconoscere subito l’appuntamento.</div>
        </div>

        <div>
          <div style={styles.label}>Nome del padrone *</div>
          <input
            style={styles.input}
            placeholder="Es. Marco"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div>
          <div style={styles.label}>Telefono *</div>
          <input
            style={styles.input}
            placeholder="Es. 333 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
          />
        </div>

        <div className="mm-row2" style={styles.row2}>
          <div>
            <div style={styles.label}>Taglia *</div>
            <select style={styles.input} value={taglia} onChange={(e) => setTaglia(e.target.value as any)}>
              <option value="Piccola">Piccola</option>
              <option value="Media">Media</option>
              <option value="Grande">Grande</option>
            </select>
          </div>

          <div>
            <div style={styles.label}>Pelo *</div>
            <select style={styles.input} value={pelo} onChange={(e) => setPelo(e.target.value as any)}>
              <option value="Corto">Corto</option>
              <option value="Medio">Medio</option>
              <option value="Lungo">Lungo</option>
            </select>
          </div>
        </div>

        <div className="mm-row2" style={styles.row2}>
          <div>
            <div style={styles.label}>Servizio *</div>
            <select style={styles.input} value={service} onChange={(e) => setService(e.target.value)}>
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={styles.label}>Data *</div>
            <input
              style={styles.input}
              type="date"
              value={dateISO}
              onChange={(e) => {
                const v = e.target.value;
                setDateISO(v);
                loadAvailability(v);
              }}
              min={todayISO}
            />
            <div style={styles.helper}>Selezionata: {prettyDate(dateISO)}</div>
          </div>
        </div>

        <div className="mm-row2" style={styles.row2}>
          <div>
            <div style={styles.label}>Ora disponibile *</div>
            <select
              style={styles.input}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={loadingSlots || slots.length === 0}
            >
              {loadingSlots ? (
                <option value="">Caricamento…</option>
              ) : slots.length === 0 ? (
                <option value="">{slotsMsg || "Nessun orario disponibile"}</option>
              ) : (
                slots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))
              )}
            </select>
            {slotsMsg ? <div style={styles.helper}>{slotsMsg}</div> : null}
          </div>

          <div>
            <div style={styles.label}>Note (facoltative)</div>
            <input
              style={styles.input}
              placeholder="Es. nodi, sensibile al phon, ecc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div style={styles.helper}>Esempio: “nodi”, “sensibile al phon”, “taglio corto”.</div>
          </div>
        </div>

        <button
          type="submit"
          style={{ ...styles.btn, ...(submitting ? styles.btnDisabled : {}) }}
          disabled={submitting}
        >
          {submitting ? "Invio in corso…" : "Conferma prenotazione 🐾"}
        </button>

        {resultMsg ? (
          <div style={resultType === "ok" ? styles.msgOk : resultType === "warn" ? styles.msgWarn : styles.msgErr}>
            {resultMsg}
          </div>
        ) : null}
      </form>

      <style>{`
        @media (max-width: 760px) {
          .mm-row2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}