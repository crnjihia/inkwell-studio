"use client";

import React from "react";
import Link from "next/link";
import {
  PenTool,
  CheckCircle2,
  Clock,
  BarChart3,
  SlidersHorizontal,
  FileText,
  Share2,
} from "lucide-react";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { useLanguage, type Language } from "@/context/LanguageContext";

interface HeaderProps {
  documentTitle?: string;
  onTitleChange?: (newTitle: string) => void;
  saveStatus?: "saved" | "saving" | "unsaved";
  lastSavedAt?: Date | null;
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  onPublish?: () => void;
  isPublishing?: boolean;
}

export function Header({
  documentTitle,
  onTitleChange,
  saveStatus = "saved",
  lastSavedAt,
  language: propLanguage,
  onLanguageChange: propOnLanguageChange,
  onPublish,
  isPublishing,
}: HeaderProps) {
  const { language: contextLanguage, setLanguage: contextSetLanguage } =
    useLanguage();
  const language = propLanguage || contextLanguage;
  const isSwahili = language === "sw";

  const handleLanguageChange = (newLang: Language) => {
    contextSetLanguage(newLang);
    if (propOnLanguageChange) {
      propOnLanguageChange(newLang);
    }
  };

  const formattedSavedTime = lastSavedAt
    ? new Intl.DateTimeFormat("en-KE", {
        timeZone: "Africa/Nairobi",
        hour: "2-digit",
        minute: "2-digit",
      }).format(lastSavedAt)
    : null;

  const isEditorMode =
    documentTitle !== undefined && onTitleChange !== undefined;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md transition-colors duration-150">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
        {/* Brand & Workspace info */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100 group transition"
            title="Return to Home"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-2xs group-hover:scale-105 transition-transform">
              <PenTool className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight hidden sm:inline">
              Inkwell Studio
            </span>
          </Link>
          <span className="hidden text-zinc-300 dark:text-zinc-700 sm:inline">
            /
          </span>
          <span className="hidden md:inline-flex items-center rounded border border-zinc-200/80 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/60 px-2 py-0.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            Nairobi Studio
          </span>
        </div>

        {/* Center: Prominent Document Title Bar Pill (Editor Mode) */}
        {isEditorMode ? (
          <div className="flex flex-1 items-center justify-center max-w-xl mx-2 min-w-0">
            <div className="w-full flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/60 px-3 py-1.5 shadow-2xs transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:ring-2 focus-within:ring-zinc-400/20 dark:focus-within:ring-zinc-600/20">
              <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder={
                  isSwahili ? "Kichwa cha Makala..." : "Untitled Document..."
                }
                className="w-full truncate bg-transparent text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-hidden"
              />
              <div className="flex items-center shrink-0">
                {saveStatus === "saving" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                    <Clock className="h-3 w-3 animate-spin" />
                    <span className="hidden md:inline">
                      {isSwahili ? "Inahifadhi..." : "Saving..."}
                    </span>
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/40">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="hidden md:inline">
                      {formattedSavedTime
                        ? `${formattedSavedTime} EAT`
                        : isSwahili
                          ? "Imehifadhiwa"
                          : "Saved"}
                    </span>
                  </span>
                )}
                {saveStatus === "unsaved" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-200/50 dark:bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-300/40 dark:border-zinc-700/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span className="hidden md:inline">
                      {isSwahili ? "Haijahifadhiwa" : "Unsaved"}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Right: Quick Actions, Navigation, Language & Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <nav className="flex items-center gap-1">
            {!isEditorMode && (
              <Link
                href="/editor/doc_nairobi_01"
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
                title="Editor"
              >
                <PenTool className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {isSwahili ? "Mhariri" : "Editor"}
                </span>
              </Link>
            )}

            <Link
              href="/prompts"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
              title="Prompt Version Control"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">
                {isSwahili ? "Mielekezo" : "Prompts"}
              </span>
            </Link>

            <Link
              href="/usage"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
              title="Usage & Telemetry (KES)"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">
                {isSwahili ? "Matumizi" : "Usage"}
              </span>
            </Link>
          </nav>

          {onPublish && (
            <button
              type="button"
              onClick={onPublish}
              disabled={isPublishing}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 px-2.5 py-1 text-xs font-medium transition hover:opacity-90 disabled:opacity-50 shadow-2xs cursor-pointer"
              title="Publish article"
            >
              <Share2 className="h-3 w-3" />
              <span className="hidden sm:inline">
                {isPublishing
                  ? isSwahili
                    ? "Inachapisha..."
                    : "Publishing..."
                  : isSwahili
                    ? "Chapisha"
                    : "Publish"}
              </span>
            </button>
          )}

          <div className="h-4 w-px bg-zinc-200 dark:border-zinc-800 mx-0.5" />

          <LanguageToggle value={language} onChange={handleLanguageChange} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
