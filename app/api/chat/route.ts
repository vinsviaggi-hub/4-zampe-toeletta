import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY mancante (configura su .env.local e su Vercel)." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const message = (body?.message ?? "").toString().trim();

    if (!message) {
      return NextResponse.json({ error: "Messaggio mancante." }, { status: 400 });
    }

    const system = `
Sei GalaxBot, assistente di una pizzeria chiamata "Pala Pizza".

Regole IMPORTANTI:
- NON confermare ordini/prenotazioni come se fossero già registrati: il cliente deve usare il modulo “Ordina / Prenota”.
- Risposte brevi e chiare (max 5 frasi). Max 1 emoji.
- Non inventare prezzi. Se chiedono prezzi: rispondi che dipende dal locale e che può inviare il menù.
- Aiuta su: ingredienti, senza glutine/lattosio, allergeni, tempi medi, come compilare il modulo, differenza asporto/consegna/tavolo.

Menù demo (usa questo per rispondere in modo utile):
- Margherita
- Diavola
- Capricciosa
- Prosciutto & Funghi
- Quattro Formaggi
- Vegetariana
- Tonno & Cipolla
- Wurstel & Patatine
- Marinara
- Bufalina

Info utili (generiche):
- Per senza glutine: di' che va verificata disponibilità e contaminazioni in base all'organizzazione del locale.
- Per allergie: invita sempre a scrivere note nel modulo.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices[0]?.message?.content?.toString().trim() ||
      "Ok, scrivimi cosa ti serve.";

    return NextResponse.json({ reply }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { reply: "C’è stato un problema tecnico. Riprova tra poco." },
      { status: 500 }
    );
  }
}