"use client";

import React, { useMemo, useRef, useState } from "react";

type Role = "user" | "assistant";
type ChatMsg = { role: Role; content: string };

export default function ChatBox() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Ciao! Sono l’assistente info di Pala Pizza 🍕\n\nPosso aiutarti con:\n• Menu e pizze disponibili\n• Senza glutine / allergeni\n• Ingredienti e aggiunte\n• Info su consegna / asporto / tavolo\n\n👉 Per ORDINI o PRENOTAZIONI usa il modulo a sinistra.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const styles = useMemo(() => {
    const container: React.CSSProperties = {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    };

    const chatArea: React.CSSProperties = {
      height: 420,
      background: "rgba(255,255,255,0.75)",
      border: "1px solid rgba(0,0,0,0.10)",
      borderRadius: 18,
      padding: 12,
      overflowY: "auto",
      backdropFilter: "blur(8px)",
    };

    const rowBase: React.CSSProperties = {
      display: "flex",
      width: "100%",
      marginBottom: 10,
    };

    const rowByRole: Record<Role, React.CSSProperties> = {
      user: { justifyContent: "flex-end" },
      assistant: { justifyContent: "flex-start" },
    };

    const bubbleBase: React.CSSProperties = {
      maxWidth: "88%",
      padding: "11px 12px",
      borderRadius: 16,
      whiteSpace: "pre-wrap",
      lineHeight: 1.35,
      fontSize: 15.5,
      border: "1px solid rgba(0,0,0,0.10)",
      boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
      color: "#111827",
    };

    const bubbleByRole: Record<Role, React.CSSProperties> = {
      user: {
        background: "linear-gradient(135deg, rgba(180,83,9,0.95), rgba(234,88,12,0.92))",
        color: "#111",
        borderTopRightRadius: 8,
      },
      assistant: {
        background: "rgba(255,255,255,0.92)",
        color: "#111827",
        borderTopLeftRadius: 8,
      },
    };

    const chipsRow: React.CSSProperties = {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 10,
    };

    const chip: React.CSSProperties = {
      border: "1px solid rgba(0,0,0,0.12)",
      background: "rgba(255,255,255,0.85)",
      borderRadius: 999,
      padding: "8px 10px",
      fontSize: 13.5,
      fontWeight: 700,
      color: "#111827",
      cursor: "pointer",
    };

    const inputWrap: React.CSSProperties = {
      display: "flex",
      gap: 10,
      alignItems: "flex-end",
      background: "rgba(255,255,255,0.75)",
      border: "1px solid rgba(0,0,0,0.10)",
      borderRadius: 16,
      padding: 10,
      backdropFilter: "blur(8px)",
    };

    const textarea: React.CSSProperties = {
      flex: 1,
      resize: "none",
      minHeight: 46,
      maxHeight: 120,
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.12)",
      outline: "none",
      background: "rgba(255,255,255,0.95)",
      color: "#111827",
      fontSize: 15,
    };

    const button: React.CSSProperties = {
      padding: "11px 14px",
      borderRadius: 12,
      border: "none",
      cursor: "pointer",
      fontWeight: 900,
      background: "linear-gradient(135deg, rgba(5,150,105,0.95), rgba(16,185,129,0.92))",
      color: "white",
      minWidth: 105,
      opacity: 1,
    };

    const buttonDisabled: React.CSSProperties = {
      opacity: 0.6,
      cursor: "not-allowed",
    };

    return {
      container,
      chatArea,
      rowBase,
      rowByRole,
      bubbleBase,
      bubbleByRole,
      inputWrap,
      textarea,
      button,
      buttonDisabled,
      chipsRow,
      chip,
    };
  }, []);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }

  async function sendMessage(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    setInput("");
    const nextMessages = [...messages, { role: "user", content: text } as ChatMsg];
    setMessages(nextMessages);
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errMsg = data?.error || "Errore chat.";
        setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${errMsg}` }]);
        return;
      }

      const reply = (data?.reply ?? "").toString().trim();
      setMessages((prev) => [...prev, { role: "assistant", content: reply || "Ok ✅" }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Errore di rete. Riprova." },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const quick = [
    "Che pizze avete oggi?",
    "Avete impasto senza glutine?",
    "Allergeni: cosa contiene la margherita?",
    "Quanto tempo ci mette la consegna?",
  ];

  return (
    <div style={styles.container}>
      <div style={styles.chatArea}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              ...styles.rowBase,
              ...styles.rowByRole[m.role],
            }}
          >
            <div
              style={{
                ...styles.bubbleBase,
                ...styles.bubbleByRole[m.role],
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.rowBase, ...styles.rowByRole.assistant }}>
            <div style={{ ...styles.bubbleBase, ...styles.bubbleByRole.assistant }}>
              Sto scrivendo…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={styles.chipsRow}>
        {quick.map((q) => (
          <button key={q} type="button" style={styles.chip} onClick={() => sendMessage(q)}>
            {q}
          </button>
        ))}
      </div>

      <div style={styles.inputWrap}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Chiedi menu, senza glutine, allergeni, ingredienti…"
          style={styles.textarea}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={{
            ...styles.button,
            ...(loading || !input.trim() ? styles.buttonDisabled : {}),
          }}
        >
          {loading ? "..." : "Invia"}
        </button>
      </div>
    </div>
  );
}