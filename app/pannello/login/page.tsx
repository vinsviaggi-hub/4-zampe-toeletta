// app/pannello/login/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./login.module.css";

type MeResponse = {
  ok?: boolean;
  loggedIn?: boolean;
  isLoggedIn?: boolean;
  authenticated?: boolean;
};

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const redirectToPanel = () => {
    window.location.href = "/pannello";
  };

  const checkSession = async () => {
    try {
      setChecking(true);
      setMsg(null);

      const r = await fetch("/api/admin/me", { cache: "no-store" });
      const data = (await r.json().catch(() => null)) as MeResponse | null;

      const logged =
        Boolean(data?.loggedIn) || Boolean(data?.isLoggedIn) || Boolean(data?.authenticated);

      if (logged) {
        setMsg({ type: "ok", text: "Sessione già attiva ✅ ti porto nel pannello…" });
        setTimeout(redirectToPanel, 350);
        return;
      }

      setMsg({ type: "err", text: "Accesso richiesto. Inserisci la password admin." });
    } catch {
      setMsg({ type: "err", text: "Non riesco a verificare la sessione. Riprova." });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setMsg({ type: "err", text: "Inserisci la password." });
      return;
    }

    try {
      setLoading(true);
      setMsg(null);

      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ password }),
      });

      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) {
        setMsg({ type: "err", text: data?.error || "Password errata." });
        return;
      }

      setMsg({ type: "ok", text: "Accesso effettuato ✅" });
      setTimeout(redirectToPanel, 250);
    } catch {
      setMsg({ type: "err", text: "Errore di rete. Riprova tra poco." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topBadge}>GALAXBOT AI • BARBER SHOP</div>

        <div className={styles.hero}>
          <div className={styles.brandRow}>
            <div className={styles.logoWrap} aria-hidden="true">
              <Image
                src="/icons/logo-idee.png"
                alt="Idee per la Testa"
                width={84}
                height={84}
                priority
              />
            </div>

            <div className={styles.titles}>
              <h1 className={styles.h1}>Idee per la Testa</h1>
              <p className={styles.subtitle}>
                Accesso amministratore al pannello prenotazioni.
              </p>
            </div>
          </div>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.h2}>Login Admin</h2>
              <p className={styles.small}>
                Inserisci la password e premi <b>Entra</b>.
              </p>
            </div>

            {msg && (
              <div className={msg.type === "ok" ? styles.alertOk : styles.alertErr}>
                {msg.text}
              </div>
            )}

            <form onSubmit={doLogin} className={styles.form}>
              <label className={styles.label}>
                Password admin
                <input
                  className={styles.input}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Inserisci password"
                  autoComplete="current-password"
                  inputMode="text"
                />
              </label>

              <div className={styles.actions}>
                <button
                  type="submit"
                  className={styles.primary}
                  disabled={loading || checking}
                >
                  {loading ? "Accesso…" : "Entra"}
                </button>

                <button
                  type="button"
                  className={styles.secondary}
                  onClick={checkSession}
                  disabled={loading || checking}
                  title="Verifica se la sessione è già attiva"
                >
                  {checking ? "Controllo…" : "Rileva sessione"}
                </button>
              </div>

              <div className={styles.footerHint}>
                Se hai perso la password, contatta l’amministratore.
              </div>
            </form>
          </section>

          <div className={styles.bottomNote}>
            Ideale su telefono, tablet e PC • UI ottimizzata per schermi piccoli
          </div>
        </div>
      </div>
    </main>
  );
}