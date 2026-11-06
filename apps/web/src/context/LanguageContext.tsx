"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export type Language = "en" | "sw";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isSwahili: boolean;
  t: (sw: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "sw",
  setLanguage: () => {},
  isSwahili: true,
  t: (sw: string) => sw,
});

const STORAGE_KEY = "inkwell_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("sw");
  const [isMounted, setIsMounted] = useState(false);

  // Sync from localStorage on initial client mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "sw") {
        setLanguageState(stored);
        document.documentElement.lang = stored;
      } else {
        document.documentElement.lang = "sw";
      }
    } catch {
      // Ignore localStorage access failures (SSR / private mode)
    }
  }, []);

  // Update language, persist to localStorage, update <html> lang attribute, and broadcast event
  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
      window.dispatchEvent(
        new CustomEvent("inkwell:language", { detail: newLang }),
      );
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Synchronize across tabs and custom events
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === STORAGE_KEY &&
        (e.newValue === "en" || e.newValue === "sw")
      ) {
        setLanguageState(e.newValue);
        document.documentElement.lang = e.newValue;
      }
    };

    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent<Language>).detail;
      if (detail === "en" || detail === "sw") {
        setLanguageState(detail);
        document.documentElement.lang = detail;
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("inkwell:language", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("inkwell:language", handleCustom);
    };
  }, []);

  const isSwahili = language === "sw";

  const t = useCallback(
    (sw: string, en: string) => (language === "sw" ? sw : en),
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isSwahili, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  return context;
}
