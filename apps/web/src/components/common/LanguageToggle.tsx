"use client";

import React from "react";
import { Languages } from "lucide-react";
import { useLanguage, type Language } from "@/context/LanguageContext";

interface LanguageToggleProps {
  value?: Language;
  onChange?: (language: Language) => void;
  disabled?: boolean;
}

export function LanguageToggle({ value: propValue, onChange: propOnChange, disabled }: LanguageToggleProps) {
  const { language: contextLang, setLanguage: contextSetLang } = useLanguage();

  const currentLang = propValue !== undefined ? propValue : contextLang;

  const handleSelect = (lang: Language) => {
    if (disabled) return;
    contextSetLang(lang);
    if (propOnChange) {
      propOnChange(lang);
    }
  };

  return (
    <div
      className="inline-flex items-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 shadow-2xs"
      role="group"
      aria-label="Language selection"
    >
      <div className="flex items-center gap-1 px-1.5 text-xs text-zinc-400 dark:text-zinc-500">
        <Languages className="h-3 w-3" />
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleSelect("en")}
        title="Switch to English"
        aria-pressed={currentLang === "en"}
        className={`rounded px-2 py-0.5 text-xs font-medium transition ${
          currentLang === "en"
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-2xs"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        EN
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleSelect("sw")}
        title="Badilisha lugha kuwa Kiswahili"
        aria-pressed={currentLang === "sw"}
        className={`rounded px-2 py-0.5 text-xs font-medium transition ${
          currentLang === "sw"
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-2xs"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        SW
      </button>
    </div>
  );
}
