"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./pannello.module.css";

type OrderRow = {
  timestamp: string;
  nome: string;
  telefono: string;
  tipo: string; // TAVOLO | ASPORTO | CONSEGNA
  dataISO: string; // YYYY-MM-DD
  ora: string; // HH:mm
  allergeni: string;
  ordine: string;
  indirizzo: string;
  stato: string; // NUOVO | CONFERMATO | ANNULLATO | CONSEGNATO | ...
  canale: string; // APP | BOT | MANO | ...
  note: string;
};

function s(v: any) {
  return v === null || v === undefined ? "" : String(v);
}

function normalizePhone(raw: string) {
  return s(raw).replace(/[^\d+]/g, "");
}

// Converte qualsiasi data (ISO con T, "Tue Dec ...", "2025-12-23") in YYYY-MM-DD (locale)
function toDateISO(value: any): string {
  const str = s(value).trim();
  if (!str) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const d = new Date(str);
  if (!Number.isFinite(d.getTime())) return str;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateIT(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function statusKey(raw: string) {
  const up = s(raw).trim().toUpperCase();
  if (up === "NUOVA") return "NUOVO";
  if (up === "CONFERMATA") return "CONFERMATO";
  if (up === "ANNULLATA") return "ANNULLATO";
  return up || "NUOVO";
}

function statusClass(stato: string) {
  const st = statusKey(stato);
  if (st === "CONFERMATO") return `${styles.badge} ${styles.badgeGreen}`;
  if (st === "CONSEGNATO") return `${styles.badge} ${styles.badgeYellow}`;
  if (st === "ANNULLATO") return `${styles.badge} ${styles.badgeRed}`;
  return `${styles.badge} ${styles.badgeBlue}`; // NUOVO default
}

function typeClass(tipo: string) {
  const t = s(tipo).trim().toUpperCase();
  if (t === "CONSEGNA") return `${styles.badge} ${styles.badgeDeliver}`;
  if (t === "ASPORTO") return `${styles.badge} ${styles.badgeTake}`;
  return `${styles.badge} ${styles.badgeTable}`; // TAVOLO default
}

export default function PannelloOrdiniPalaPizza() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState<OrderRow[]>([]);

  // filtri
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState<"TUTTI" | "TAVOLO" | "ASPORTO" | "CONSEGNA">("TUTTI");
  const [stato, setStato] = useState<"TUTTI" | "NUOVO" | "CONFERMATO" | "ANNULLATO" | "CONSEGNATO">("TUTTI");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function load() {
    setLoading(true);
    setErr("");

    try {
      const r = await fetch("/api/admin/bookings", { method: "GET", cache: "no-store" });

      if (r.status === 401) {
        window.location.href = "/pannello/login";
        return;
      }

      const data = await r.json().catch(() => null);
      if (!r.ok || !data?.ok) {
        setErr(data?.error || "Errore caricando ordini.");
        setRows([]);
        return;
      }

      const list: any[] = Array.isArray(data.rows) ? data.rows : [];

      const parsed: OrderRow[] = list.map((item: any) => {
        const isArr = Array.isArray(item);
        const get = (i: number, k: string) => (isArr ? item[i] : item?.[k]);

        // colonne attese sheet “Ordini”:
        // 0 Timestamp, 1 Nome, 2 Telefono, 3 Tipo, 4 Data, 5 Ora, 6 Allergeni,
        // 7 Ordine, 8 Indirizzo, 9 Stato, 10 Canale, 11 Note
        const dataISO = toDateISO(get(4, "Data") ?? get(4, "data"));
        const tipoVal = s(get(3, "Tipo") ?? get(3, "tipo")).trim().toUpperCase();
        const statoVal = statusKey(get(9, "Stato") ?? get(9, "stato"));

        return {
          timestamp: s(get(0, "Timestamp") ?? get(0, "timestamp")).trim(),
          nome: s(get(1, "Nome") ?? get(1, "nome")).trim(),
          telefono: s(get(2, "Telefono") ?? get(2, "telefono")).trim(),
          tipo: (tipoVal || "TAVOLO") as any,
          dataISO,
          ora: s(get(5, "Ora") ?? get(5, "ora")).trim(),
          allergeni: s(get(6, "Allergeni") ?? get(6, "allergeni")).trim(),
          ordine: s(get(7, "Ordine") ?? get(7, "ordine")).trim(),
          indirizzo: s(get(8, "Indirizzo") ?? get(8, "indirizzo")).trim(),
          stato: statoVal,
          canale: s(get(10, "Canale") ?? get(10, "canale")).trim().toUpperCase(),
          note: s(get(11, "Note") ?? get(11, "note")).trim(),
        };
      });

      // ordine per data/ora poi timestamp
      parsed.sort((a, b) => {
        const da = `${a.dataISO} ${a.ora}`.trim();
        const db = `${b.dataISO} ${b.ora}`.trim();
        if (da < db) return -1;
        if (da > db) return 1;
        return a.timestamp.localeCompare(b.timestamp);
      });

      setRows(parsed);
    } catch (e: any) {
      setErr(e?.message || "Errore rete.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    window.location.href = "/pannello/login";
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayISO = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return rows.filter((r) => {
      const t = s(r.tipo).trim().toUpperCase();
      if (tipo !== "TUTTI" && t !== tipo) return false;

      const st = statusKey(r.stato);
      if (stato !== "TUTTI" && st !== stato) return false;

      if (from && r.dataISO && r.dataISO < from) return false;
      if (to && r.dataISO && r.dataISO > to) return false;

      if (!qq) return true;
      const blob = [
        r.nome,
        r.telefono,
        r.tipo,
        r.dataISO,
        r.ora,
        r.ordine,
        r.allergeni,
        r.indirizzo,
        r.stato,
        r.canale,
        r.note,
      ]
        .join(" ")
        .toLowerCase();

      return blob.includes(qq);
    });
  }, [rows, q, tipo, stato, from, to]);

  const countsAll = useMemo(() => {
    const c = { TOT: rows.length, OGGI: 0, NUOVO: 0, CONFERMATO: 0, ANNULLATO: 0, CONSEGNATO: 0 };
    for (const r of rows) {
      const st = statusKey(r.stato);
      if (r.dataISO === todayISO) c.OGGI++;

      if (st === "NUOVO") c.NUOVO++;
      else if (st === "CONFERMATO") c.CONFERMATO++;
      else if (st === "ANNULLATO") c.ANNULLATO++;
      else if (st === "CONSEGNATO") c.CONSEGNATO++;
    }
    return c;
  }, [rows, todayISO]);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.top}>
              <div className={styles.brand}>
                <div className={styles.logo} aria-hidden>
                  🍕
                </div>
                <div>
                  <h1 className={styles.h1}>Pannello Ordini · Pala Pizza</h1>
                  <p className={styles.sub}>Chiaro, veloce, “vendibile” (PC + telefono).</p>
                </div>
              </div>

              <div className={styles.actionsTop}>
                <button className={styles.btn} onClick={load} disabled={loading}>
                  {loading ? "Aggiorno…" : "Aggiorna"}
                </button>
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={logout}>
                  Esci
                </button>
              </div>
            </div>

            {/* 4 cards (come grid da CSS) */}
            <div className={styles.metrics}>
              <div className={styles.card}>
                <div className={styles.cardLabel}>Oggi</div>
                <div className={styles.cardValue}>{countsAll.OGGI}</div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardLabel}>Totali</div>
                <div className={styles.cardValue}>{countsAll.TOT}</div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardLabel}>Nuovi</div>
                <div className={styles.cardValue}>{countsAll.NUOVO}</div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardLabel}>Confermati</div>
                <div className={styles.cardValue}>{countsAll.CONFERMATO}</div>
              </div>
            </div>

            <div className={styles.tools}>
              <div className={styles.search}>
                <input
                  className={styles.input}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cerca: nome, telefono, ordine, indirizzo, note…"
                />
              </div>

              <div className={styles.selects}>
                <select className={styles.select} value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
                  <option value="TUTTI">Tutti i tipi</option>
                  <option value="TAVOLO">Tavolo</option>
                  <option value="ASPORTO">Asporto</option>
                  <option value="CONSEGNA">Consegna</option>
                </select>

                <select className={styles.select} value={stato} onChange={(e) => setStato(e.target.value as any)}>
                  <option value="TUTTI">Tutti gli stati</option>
                  <option value="NUOVO">Nuovo</option>
                  <option value="CONFERMATO">Confermato</option>
                  <option value="CONSEGNATO">Consegnato</option>
                  <option value="ANNULLATO">Annullato</option>
                </select>
              </div>

              <div className={styles.range}>
                <span className={styles.small}>Da</span>
                <input className={styles.date} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                <span className={styles.small}>A</span>
                <input className={styles.date} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>

              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => {
                  setQ("");
                  setTipo("TUTTI");
                  setStato("TUTTI");
                  setFrom("");
                  setTo("");
                }}
              >
                Reset
              </button>

              <div className={styles.counter}>
                {filtered.length}/{rows.length}
              </div>
            </div>
          </div>
        </header>

        {err ? <div className={styles.error}>⚠️ {err}</div> : null}

        {/* DESKTOP TABLE */}
        <div className={styles.tableWrap} aria-busy={loading ? "true" : "false"}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Ora</th>
                <th>Nome</th>
                <th>Telefono</th>
                <th>Tipo</th>
                <th>Ordine</th>
                <th>Allergeni</th>
                <th>Indirizzo</th>
                <th>Stato</th>
                <th>Canale</th>
                <th>Azioni</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className={styles.tdEmpty}>
                    Caricamento…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className={styles.tdEmpty}>
                    Nessun risultato.
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => {
                  const phone = normalizePhone(r.telefono);
                  const telHref = phone ? `tel:${phone}` : undefined;
                  const waHref = phone
                    ? `https://wa.me/${phone.replace("+", "")}?text=${encodeURIComponent(
                        `Ciao ${r.nome}! Confermiamo l'ordine del ${formatDateIT(r.dataISO)} alle ${r.ora}.`
                      )}`
                    : undefined;
                  const mapHref =
                    r.indirizzo && s(r.tipo).toUpperCase() === "CONSEGNA"
                      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.indirizzo)}`
                      : undefined;

                  return (
                    <tr key={`${r.timestamp}-${i}`} className={styles.row}>
                      <td className={styles.mono}>{formatDateIT(r.dataISO)}</td>
                      <td className={styles.mono}>{r.ora || "—"}</td>
                      <td className={styles.name}>{r.nome || "—"}</td>
                      <td className={styles.mono}>{r.telefono || "—"}</td>
                      <td>
                        <span className={typeClass(r.tipo)}>{s(r.tipo).toUpperCase() || "—"}</span>
                      </td>
                      <td className={styles.order}>{r.ordine || "—"}</td>
                      <td className={styles.allergeni}>{r.allergeni || "—"}</td>
                      <td className={styles.addr}>{r.indirizzo || "—"}</td>
                      <td>
                        <span className={statusClass(r.stato)}>{statusKey(r.stato)}</span>
                      </td>
                      <td className={styles.mono}>{r.canale || "—"}</td>
                      <td>
                        <div className={styles.actions}>
                          {telHref ? (
                            <a className={`${styles.actionBtn} ${styles.actionCall}`} href={telHref}>
                              📞 Chiama
                            </a>
                          ) : null}
                          {waHref ? (
                            <a
                              className={`${styles.actionBtn} ${styles.actionWa}`}
                              href={waHref}
                              target="_blank"
                              rel="noreferrer"
                            >
                              💬 WhatsApp
                            </a>
                          ) : null}
                          {mapHref ? (
                            <a
                              className={`${styles.actionBtn} ${styles.actionMap}`}
                              href={mapHref}
                              target="_blank"
                              rel="noreferrer"
                            >
                              📍 Maps
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className={styles.mobileCards}>
          {loading ? (
            <div className={styles.mCard}>Caricamento…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.mCard}>Nessun risultato.</div>
          ) : (
            filtered.map((r, i) => {
              const phone = normalizePhone(r.telefono);
              const telHref = phone ? `tel:${phone}` : undefined;
              const waHref = phone
                ? `https://wa.me/${phone.replace("+", "")}?text=${encodeURIComponent(
                    `Ciao ${r.nome}! Confermiamo l'ordine del ${formatDateIT(r.dataISO)} alle ${r.ora}.`
                  )}`
                : undefined;
              const mapHref =
                r.indirizzo && s(r.tipo).toUpperCase() === "CONSEGNA"
                  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.indirizzo)}`
                  : undefined;

              return (
                <div key={`${r.timestamp}-m-${i}`} className={styles.mCard}>
                  <div className={styles.mTop}>
                    <div>
                      <div className={styles.mName}>{r.nome || "—"}</div>
                      <div className={styles.mSub}>
                        <span className={styles.mono}>{formatDateIT(r.dataISO)}</span> •{" "}
                        <b className={styles.mono}>{r.ora || "—"}</b> •{" "}
                        <span className={styles.mono}>{r.telefono || "—"}</span>
                      </div>
                    </div>
                    <div className={styles.mBadges}>
                      <span className={statusClass(r.stato)}>{statusKey(r.stato)}</span>
                      <span className={typeClass(r.tipo)}>{s(r.tipo).toUpperCase() || "—"}</span>
                    </div>
                  </div>

                  <div className={styles.mGrid}>
                    <div className={styles.mBox}>
                      <div className={styles.mLabel}>Ordine</div>
                      <div className={styles.mValue}>{r.ordine || "—"}</div>
                    </div>
                    <div className={styles.mBox}>
                      <div className={styles.mLabel}>Allergeni</div>
                      <div className={styles.mValue}>{r.allergeni || "—"}</div>
                    </div>
                    <div className={styles.mBox} style={{ gridColumn: "1 / -1" }}>
                      <div className={styles.mLabel}>Indirizzo</div>
                      <div className={styles.mValue}>{r.indirizzo || "—"}</div>
                    </div>
                    <div className={styles.mBox} style={{ gridColumn: "1 / -1" }}>
                      <div className={styles.mLabel}>Note</div>
                      <div className={styles.mValue}>{r.note || "—"}</div>
                    </div>
                  </div>

                  <div className={styles.actions} style={{ marginTop: 12 }}>
                    {telHref ? (
                      <a className={`${styles.actionBtn} ${styles.actionCall}`} href={telHref}>
                        📞 Chiama
                      </a>
                    ) : null}
                    {waHref ? (
                      <a
                        className={`${styles.actionBtn} ${styles.actionWa}`}
                        href={waHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        💬 WhatsApp
                      </a>
                    ) : null}
                    {mapHref ? (
                      <a
                        className={`${styles.actionBtn} ${styles.actionMap}`}
                        href={mapHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        📍 Maps
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}