// =============================================================================
// FILE: src/i18n/index.ts
// =============================================================================

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

// Import all translation files (create these JSON files under src/i18n/locales/)
import en from "./locales/en.json";
import hi from "./locales/hi.json";  // Hindi
import bn from "./locales/bn.json";  // Bengali
import te from "./locales/te.json";  // Telugu
import mr from "./locales/mr.json";  // Marathi
import ta from "./locales/ta.json";  // Tamil
import gu from "./locales/gu.json";  // Gujarati
import kn from "./locales/kn.json";  // Kannada
import or from "./locales/or.json";  // Odia
import pa from "./locales/pu.json";  // Punjabi
import as from "./locales/as.json";  // Assamese

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  bn: { translation: bn },
  te: { translation: te },
  mr: { translation: mr },
  ta: { translation: ta },
  gu: { translation: gu },
  kn: { translation: kn },
  or: { translation: or },
  pa: { translation: pa },
  as: { translation: as },
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",

    detection: {
      order: ["localStorage", "sessionStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "i18nextLng",
      lookupSessionStorage: "i18nextLng",
      caches: ["localStorage", "sessionStorage"],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
