// app/config/business.ts

export type FeatureFlags = {
  enableBookings?: boolean;
  enableOrders?: boolean;
  enableOpenAIChat?: boolean;
};

export type WhatsAppTemplates = {
  confirmBooking?: string; // {name} {date} {time} {service}
  cancelBooking?: string;  // {name} {date} {time} {service}
  genericHello?: string;   // {name}
};

export type BotTexts = {
  greeting?: string;
  bookingGuide?: string;
  cancelGuide?: string;
  fallback?: string;
};

export type PwaConfig = {
  name?: string;
  shortName?: string;
  description?: string;
  themeColor?: string;
};

export type ThemeConfig = {
  primary?: string; // main accent (es ORO)
  danger?: string;  // rosso
  accent?: string;  // extra (es blu/ciano o viola)
  background?: string; // opzionale se vuoi forzare
};

export type CtaLabels = {
  book?: string;       // bottone hero prenota
  cancel?: string;     // bottone hero annulla
  help?: string;       // bottone hero assistenza (toggle)
  openChat?: string;   // bottone nella card chat
  closeChat?: string;  // quando chat aperta
};

export type BusinessConfig = {
  slug: string;

  // Hero
  badgeTop: string;
  headline: string;
  subheadline: string;

  // Info box
  servicesShort: string;
  city: string;
  phone: string;

  // ✅ lista servizi per FastBookingForm (così non tocchi più il file)
  servicesList?: string[];

  // Orari
  hoursTitle?: string;
  hoursLines?: string[];

  // Labels CTA / testi UI
  cta?: CtaLabels;
  footerText?: string;     // es: "Powered by GalaxBot AI"
  heroEmoji?: string;      // es: "💈" / "🍕" / "✨"
  helpCardTitle?: string;  // es: "Assistenza"
  helpCardSubtitle?: string;

  // Extra contatti (opzionali)
  address?: string;
  whatsappPhone?: string;
  mapsUrl?: string;
  instagramUrl?: string;

  // WhatsApp templates (opzionale)
  whatsappTemplates?: WhatsAppTemplates;

  // Bot/chat (opzionale)
  bot?: BotTexts;

  // PWA (opzionale)
  pwa?: PwaConfig;

  // feature flags (opzionale)
  features?: FeatureFlags;

  // theme (opzionale)
  theme?: ThemeConfig;
};

const BUSINESS: BusinessConfig = {
  slug: "idee-per-la-testa",

  badgeTop: "GALAXBOT AI · BARBER SHOP",
  headline: "Idee per la Testa",
  heroEmoji: "💈",
  subheadline:
    "Un assistente virtuale che gestisce richieste, prenotazioni e cancellazioni per il tuo barber shop, 24 ore su 24.",

  servicesShort: "Taglio, barba, sfumature, styling, bimbi",
  servicesList: ["Taglio uomo", "Barba", "Taglio + barba", "Sfumatura", "Bimbo", "Styling"],

  city: "Castelnuovo Vomano (TE)",
  phone: "333 123 4567",

  hoursTitle: "Orari di apertura",
  hoursLines: ["Lunedì–Sabato: 8:30–12:30 e 15:00–20:00", "Domenica: chiuso"],

  cta: {
    book: "Prenota ora",
    cancel: "Annulla",
    help: "Assistenza",
    openChat: "Apri chat",
    closeChat: "Nascondi",
  },

  helpCardTitle: "Assistenza",
  helpCardSubtitle:
    "Domande su servizi, orari o info generali. Per prenotare usa sempre il box “Prenota adesso”.",

  footerText: "Powered by GalaxBot AI",

  whatsappTemplates: {
    genericHello: "Ciao {name}!",
    confirmBooking:
      "Ciao {name}! ✅ Il tuo appuntamento è CONFERMATO per {date} alle {time} ({service}). A presto!",
    cancelBooking:
      "Ciao {name}. ❌ Il tuo appuntamento {service} del {date} alle {time} è ANNULLATO. Se vuoi riprenotare, scrivimi qui.",
  },

  pwa: {
    name: "Idee per la Testa",
    shortName: "Idee 💈",
    description: "Prenotazioni e info 24/7",
    themeColor: "#0b1220",
  },

  features: {
    enableBookings: true,
    enableOrders: false,
    enableOpenAIChat: true,
  },

  // ✅ tema barbiere
  theme: {
    primary: "#D4AF37", // ORO
    danger: "#EF4444",  // ROSSO
    accent: "#38BDF8",  // CIANO (facoltativo)
  },

  // opzionali
  address: "",
  whatsappPhone: "",
  mapsUrl: "",
  instagramUrl: "",
};

export function getBusinessConfig(): BusinessConfig {
  return BUSINESS;
}