// app/components/CancelBookingForm.tsx
"use client";

import React, { useMemo, useState } from "react";
import { getBusinessConfig } from "@/app/config/business";

type CancelOk = { ok: true; message?: string };
type CancelErr = { ok: false; error: string; details?: any };
type CancelResponse = CancelOk | CancelErr;

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
  if (!c) return `rgba(239,68,68,${a})`; // fallback rosso
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

export default function CancelBookingForm() {
  const biz = useMemo(() => {
    try {
      return getBusinessConfig() as any;
    } catch {
      return {} as any;
    }
  }, []);

  const todayISO = useMemo(() => toISODate(new Date()), []);

  const [phone, setPhone] = useState("");
  const [dateISO, setDateISO] = useState(todayISO);
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [resultMsg, setResultMsg] = useState("");
  const [resultType, setResultType] = useState<"ok" | "warn" | "err" | "">("");

  // Tema (se presente)
  const danger = biz?.theme?.danger || "#EF4444";
  const bgCard = "linear-gradient(180deg, rgba(11,28,68,0.72), rgba(11,28,68,0.45))";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResultMsg("");
    setResultType("");

    const p = phone.trim();
    const d = dateISO.trim();
    const t = time.trim();

    if (!p || !d || !t) {
      setResultType("warn");
      setResultMsg("Compila i campi obbligatori: telefono, data e ora.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel_booking",
          phone: p,
          date: d,
          time: t,
        }),
      });

      const data = (await res.json().catch(() => null)) as CancelResponse | null;

      if (!data || typeof data !== "object" || !("ok" in data)) {
        setResultType("err");
        setResultMsg("Risposta non valida dal server (cancel).");
        return;
      }

      if (!data.ok) {
        setResultType("err");
        setResultMsg(data.error || "Errore durante l’annullamento.");
        return;
      }

      setResultType("ok");
      setResultMsg(data.message || "✅ Prenotazione annullata correttamente.");

      // reset leggero
      setPhone("");
      setTime("");
    } catch {
      setResultType("err");
      setResultMsg("Errore di rete (cancel).");
    } finally {
      setSubmitting(false);
    }
  }

  const styles: Record<string, React.CSSProperties> = {
    card: {
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.16)",
      background: bgCard,
      padding: 16,
      boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    },
    title: { fontSize: 22, fontWeight: 900, margin: 0, color: "rgba(255,255,255,0.92)" },
    subtitle: { marginTop: 4, marginBottom: 14, color: "rgba(255,255,255,0.75)" },
    grid: { display: "grid", gap: 12 },
    label: { fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.86)" },
    input: {
      width: "100%",
      padding: "12px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.16)",
      background: "rgba(0,0,0,0.20)",
      color: "rgba(255,255,255,0.92)",
      outline: "none",
      fontSize: 15,
    },
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    btn: {
      width: "100%",
      border: "0",
      borderRadius: 16,
      padding: "14px 14px",
      fontWeight: 950,
      cursor: "pointer",
      color: "#0A0F1A",
      background: `linear-gradient(90deg, ${rgba(danger, 0.95)} 0%, ${rgba(danger, 0.68)} 120%)`,
      boxShadow: `0 14px 30px ${rgba(danger, 0.18)}`,
    },
    msgOk: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 12,
      background: "rgba(0, 200, 120, 0.16)",
      border: "1px solid rgba(255,255,255,0.16)",
      color: "rgba(255,255,255,0.92)",
      fontSize: 13,
      fontWeight: 800,
    },
    msgWarn: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 12,
      background: "rgba(255, 190, 0, 0.16)",
      border: "1px solid rgba(255,255,255,0.16)",
      color: "rgba(255,255,255,0.92)",
      fontSize: 13,
      fontWeight: 800,
    },
    msgErr: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 12,
      background: "rgba(255, 59, 59, 0.16)",
      border: "1px solid rgba(255,255,255,0.16)",
      color: "rgba(255,255,255,0.92)",
      fontSize: 13,
      fontWeight: 800,
    },
    helper: { marginTop: 6, color: "rgba(255,255,255,0.70)", fontSize: 12 },
  };

  return (
    <section style={styles.card}>
      <h2 style={styles.title}>Annulla prenotazione ✖️</h2>
      <div style={styles.subtitle}>
        Inserisci <b>telefono</b> + <b>data</b> + <b>ora</b> della prenotazione.
      </div>

      <form onSubmit={onSubmit} style={styles.grid}>
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

        <div style={styles.row2}>
          <div>
            <div style={styles.label}>Data *</div>
            <input
              style={styles.input}
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
              min={todayISO}
            />
            <div style={styles.helper}>Selezionata: {prettyDate(dateISO)}</div>
          </div>

          <div>
            <div style={styles.label}>Ora (HH:mm) *</div>
            <input
              style={styles.input}
              placeholder="Es. 15:30"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              inputMode="numeric"
            />
            <div style={styles.helper}>Scrivi es: 08:30 / 15:00</div>
          </div>
        </div>

        <button type="submit" style={styles.btn} disabled={submitting}>
          {submitting ? "Annullamento…" : "Annulla prenotazione"}
        </button>

        {resultMsg ? (
          <div style={resultType === "ok" ? styles.msgOk : resultType === "warn" ? styles.msgWarn : styles.msgErr}>
            {resultMsg}
          </div>
        ) : null}
      </form>

      <style>{`
        @media (max-width: 520px) {
          .row2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}