// app/pannello/login/LoginClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBusinessConfig } from "@/app/config/business";
import styles from "./login.module.css";

type LoginOk = { ok: true; message?: string };
type LoginErr = { ok: false; error?: string; details?: any };
type LoginResponse = LoginOk | LoginErr;

async function safeJson(res: Response) {
  const text = await res.text().catch(() => "");
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: "Risposta non valida dal server.", details: text };
  }
}

export default function LoginClient() {
  const router = useRouter();

  const biz = useMemo(() => {
    try {
      return getBusinessConfig() as any;
    } catch {
      return {} as any;
    }
  }, []);

  const badgeTop = biz?.badgeTop ?? biz?.labelTop ?? "GALAXBOT AI • ADMIN";
  const head = biz?.headline ?? biz?.title ?? "";
  const panelTitle = head ? `Accesso • ${head}` : "Accesso pannello";

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const pw = password.trim();
    if (!pw) {
      setMsg({ type: "err", text: "Inserisci la password admin." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });

      const data = (await safeJson(res)) as LoginResponse;

      if (!(data as any)?.ok) {
        setMsg({ type: "err", text: (data as any)?.error || "Accesso fallito." });
        setSubmitting(false);
        return;
      }

      setMsg({ type: "ok", text: "Accesso effettuato. Ti porto al pannello…" });

      // pulizia
      setPassword("");

      // vai al pannello
      router.replace("/pannello");
      router.refresh();
    } catch {
      setMsg({ type: "err", text: "Errore di rete. Riprova." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.badge}>{badgeTop}</div>
            <h1 className={styles.h1}>{panelTitle}</h1>
            <p className={styles.sub}>
              Inserisci la password admin per aprire il pannello prenotazioni.
            </p>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div className={styles.panelTitle}>Login</div>
            <div style={{ opacity: 0.78, fontSize: 12 }}>
              Sessione sicura (cookie httpOnly)
            </div>
          </div>

          <div className={styles.panelBody}>
            <form onSubmit={onSubmit} className={styles.grid}>
              <div>
                <div className={styles.label}>Password admin</div>
                <input
                  className={styles.input}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <div className={styles.hint}>
                  Suggerimento: salvala in un password manager. Non inviarla in chat a clienti.
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Accesso…" : "Entra nel pannello"}
                </button>

                <button
                  className={`${styles.btn} ${styles.btnDanger}`}
                  type="button"
                  onClick={() => {
                    setPassword("");
                    setMsg(null);
                  }}
                  disabled={submitting}
                >
                  Pulisci
                </button>
              </div>

              {msg?.type === "ok" ? <div className={styles.msgOk}>{msg.text}</div> : null}
              {msg?.type === "err" ? <div className={styles.msgErr}>{msg.text}</div> : null}
            </form>
          </div>
        </div>

        <div className={styles.footer}>GalaxBot AI • Pannello Admin</div>
      </div>
    </div>
  );
}