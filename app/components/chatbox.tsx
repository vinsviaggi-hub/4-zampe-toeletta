// app/components/chatbox.tsx
"use client";

import React, { useRef, useState } from "react";

type Role = "user" | "assistant";
type ChatMsg = { role: Role; content: string };

const QUICK = [
  "Menu pizze",
  "Avete impasto senza glutine?",
  "Allergeni: cosa contiene la margherita?",
  "Tempi consegna?",
  "Fate anche bevande/dolci?",
];

export default function ChatBox() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Ciao! Sono l’assistente info di Pala Pizza 🍕\n\nPosso aiutarti con:\n• Menu e pizze disponibili\n• Senza glutine / allergeni\n• Ingredienti e aggiunte\n• Tempi consegna e info consegna/asporto/tavolo\n\nPer ordini/prenotazioni usa il modulo a sinistra 🙂",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
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
        setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${data?.error || "Errore chat."}` }]);
        return;
      }

      const reply = (data?.reply ?? "").toString().trim();
      setMessages((prev) => [...prev, { role: "assistant", content: reply || "Ok ✅" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "❌ Errore di rete. Riprova." }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="chatBox">
      <div className="quickChips">
        {QUICK.map((q) => (
          <button key={q} className="chip" type="button" onClick={() => send(q)}>
            {q}
          </button>
        ))}
      </div>

      <div className="chatArea">
        {messages.map((m, idx) => (
          <div key={idx} className={`msgRow ${m.role}`}>
            <div className={`bubble ${m.role}`}>{m.content}</div>
          </div>
        ))}

        {loading && (
          <div className="msgRow assistant">
            <div className="bubble assistant">Sto scrivendo…</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chatInputRow">
        <textarea
          className="textarea chatTextarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Scrivi qui… (Invio per inviare, Shift+Invio per andare a capo)"
        />
        <button
          className={`btn btnGreen chatSend ${loading || !input.trim() ? "btnDisabled" : ""}`}
          type="button"
          disabled={loading || !input.trim()}
          onClick={() => send()}
        >
          {loading ? "..." : "Invia"}
        </button>
      </div>
    </div>
  );
}