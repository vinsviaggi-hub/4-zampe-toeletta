// app/config/business.ts

export type FeatureFlags = {
  enableBookings?: boolean;
  enableOrders?: boolean;
  enableOpenAIChat?: boolean;
};

export type WhatsAppTemplates = {
  confirmBooking?: string; // {name} {date} {time} {service}
  cancelBooking?: string; // {name} {date} {time} {service}
  genericHello?: string; // {name}
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
  primary?: string; // main accent
  danger?: string; // rosso/arancio annulla
  accent?: string; // secondario
  background?: string; // opzionale
};

export type CtaLabels = {
  book?: string;
  cancel?: string;
  help?: string;
  openChat?: string;
  closeChat?: string;
};

export type BusinessConfig = {
  slug: string;

  badgeTop: string;
  headline: string;
  subheadline: string;

  servicesShort: string;
  city: string;
  phone: string;

  servicesList?: string[];

  hoursTitle?: string;
  hoursLines?: string[];

  cta?: CtaLabels;
  footerText?: string;
  heroEmoji?: string;
  helpCardTitle?: string;
  helpCardSubtitle?: string;

  address?: string;
  whatsappPhone?: string;
  mapsUrl?: string;
  instagramUrl?: string;

  whatsappTemplates?: WhatsAppTemplates;
  bot?: BotTexts;
  pwa?: PwaConfig;
  features?: FeatureFlags;
  theme?: ThemeConfig;
};

const BUSINESS: BusinessConfig = {
  slug: "4-zampe",

  badgeTop: "GALAXBOT AI · TOELETTATURA",
  headline: "4 Zampe",
  heroEmoji: "🐾",
  subheadline:
    "Prenota bagno, toelettatura e cura del cane in modo semplice. Gestiamo prenotazioni e cancellazioni in pochi secondi.",

  servicesShort: "Bagno, toelettatura, taglio, unghie, pulizia orecchie",
  servicesList: ["Bagno", "Toelettatura", "Taglio", "Unghie", "Pulizia orecchie"],

  city: "Teramo (TE)",
  phone: "333 123 4567",

  hoursTitle: "Orari di apertura",
  hoursLines: ["Lunedì–Sabato: 08:00–13:00 e 15:00–19:00", "Domenica: chiuso"],

  cta: {
    book: "Prenota ora",
    cancel: "Annulla",
    help: "Assistenza",
    openChat: "Apri chat",
    closeChat: "Nascondi",
  },

  helpCardTitle: "Assistenza",
  helpCardSubtitle:
    "Domande su servizi, orari o come preparare il cane? Scrivi qui. Per prenotare usa sempre “Prenota adesso”.",

  footerText: "Powered by GalaxBot AI",

  whatsappTemplates: {
    genericHello: "Ciao {name}!",
    confirmBooking:
      "Ciao {name}! ✅ Prenotazione CONFERMATA per {date} alle {time} ({service}). A presto! 🐾",
    cancelBooking:
      "Ciao {name}. ❌ La prenotazione {service} del {date} alle {time} è ANNULLATA. Se vuoi riprenotare, scrivimi qui. 🐾",
  },

  pwa: {
    name: "4 Zampe",
    shortName: "4 Zampe",
    description: "Prenotazioni e info 24/7",
    themeColor: "#0F766E",
  },

  features: {
    enableBookings: true,
    enableOrders: false,
    enableOpenAIChat: true,
  },

  // ✅ tema “pet grooming”: fresco, chiaro e leggibile
  theme: {
    primary: "#0F766E", // teal profondo
    danger: "#F97316", // arancio (annulla)
    accent: "#2563EB", // blu pulito (dettagli)
  },

  address: "",
  whatsappPhone: "",
  mapsUrl: "",
  instagramUrl: "",
};

export function getBusinessConfig(): BusinessConfig {
  return BUSINESS;
}