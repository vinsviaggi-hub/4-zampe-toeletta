import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const apiKey = process.env.OPENAI_API_KEY;

const client = new OpenAI({
  apiKey: apiKey ?? "",
});

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY non configurata sul server." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const userMessage = body?.message?.toString().trim();

    if (!userMessage) {
      return NextResponse.json({ error: "Messaggio mancante." }, { status: 400 });
    }

    const systemPrompt = `
Sei l’assistente virtuale di "Pala Pizza" (pizzeria).
Obiettivo: rispondere in modo CHIARO, VELOCE e AMICHEVOLE su:
- orari indicativi, dove siamo, consegna/asporto/tavolo
- come funziona l’ordine e in quanto tempo è pronto
- allergeni (invita a segnalarli nel modulo ordine)
- pagamenti (se non sai, dillo e fai 1 sola domanda)

REGOLE IMPORTANTI:
1) NON prendere ordini in chat e NON chiedere tutti i dati uno per uno.
2) Se l'utente vuole ordinare (parole tipo: ordino, prenoto, consegna, asporto, tavolo, vorrei una pizza, mi servono, stasera, domani, ora, indirizzo),
   rispondi SEMPRE con questa frase (puoi aggiungere 1 riga di info prima):
   "Per ordinare compila il modulo nella sezione **Ordina** (su PC nel menu / su telefono nella tab **Ordina**)."
3) Se chiedono prezzi e non hai listino: dì che "il listino è in aggiornamento" e rimanda al modulo.
4) Massimo 6-7 righe, niente papiri.
5) Se manca un’informazione, fai AL MASSIMO 1 domanda.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Dimmi pure cosa ti serve 🙂";

    return NextResponse.json({ ok: true, reply });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Errore server chat.", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}