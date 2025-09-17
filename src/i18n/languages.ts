// =============================================================================
// FILE: src/i18n/languages.ts
// =============================================================================

export interface Language {
  code: string;
  name: string;       // Language name in English
  nativeName: string; // Native script name
  flag: string;       // Short flag/label (can be emoji or shorthand)
  rtl?: boolean;      // Right-to-left (none of these are RTL)
}

export const supportedLanguages: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "EN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "HI" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "BN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "TE" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "MR" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "TA" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "GU" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "KN" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", flag: "OR" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "PA" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", flag: "AS" },
];

export const getLanguageByCode = (code: string): Language | undefined => {
  return supportedLanguages.find((lang) => lang.code === code);
};

export const getLanguageName = (code: string): string => {
  const language = getLanguageByCode(code);
  return language?.nativeName || language?.name || code;
};
