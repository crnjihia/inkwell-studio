"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/common/Header";
import { useLanguage } from "@/context/LanguageContext";
import { StreamComparator } from "@/components/prompts/StreamComparator";
import type { PromptVersionItem } from "@/components/prompts/PromptVersionHistory";
import { ArrowLeft, GitCompare } from "lucide-react";

interface PromptWithVersions {
  id: string;
  name: string;
  description: string;
  contentType: string;
  language: string;
  activeVersionId: string | null;
  versions: PromptVersionItem[];
}

export default function PromptsComparePage() {
  const { language, setLanguage, isSwahili } = useLanguage();
  const [promptsList, setPromptsList] = useState<PromptWithVersions[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPrompts() {
      try {
        const res = await fetch("/api/prompts");
        if (res.ok) {
          const data = await res.json();
          setPromptsList(data.prompts || []);
          if (data.prompts?.length > 0) {
            setSelectedPromptId(data.prompts[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load prompts for comparison:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPrompts();
  }, []);

  const selectedPrompt =
    promptsList.find((p) => p.id === selectedPromptId) || promptsList[0];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <Header language={language} onLanguageChange={setLanguage} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation & Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/prompts"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{isSwahili ? "Rudi kwenye Studio" : "Back to Studio"}</span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                <GitCompare className="h-4 w-4" />
              </div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {isSwahili ? "Ulinganishaji Sambamba wa Matoleo" : "Side-by-Side Prompt Comparator"}
              </h1>
            </div>
          </div>

          {/* Prompt Selector */}
          {promptsList.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="select-prompt" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {isSwahili ? "Chagua Muundo:" : "Target Prompt:"}
              </label>
              <select
                id="select-prompt"
                value={selectedPromptId}
                onChange={(e) => setSelectedPromptId(e.target.value)}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 shadow-2xs focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-hidden"
              >
                {promptsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.versions.length} versions)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Comparator Body */}
        {isLoading ? (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-12 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Loading prompt version comparator...
          </div>
        ) : selectedPrompt && selectedPrompt.versions.length >= 1 ? (
          <StreamComparator
            promptName={selectedPrompt.name}
            versions={selectedPrompt.versions}
            language={language}
          />
        ) : (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-12 text-center text-xs text-zinc-400 dark:text-zinc-500">
            {isSwahili
              ? "Hakuna matoleo ya kutosha ya kulinganisha. Unda angalau matoleo mawili kwenye Studio ya Mielekezo."
              : "Not enough versions to compare. Create at least two versions in Prompt Studio."}
          </div>
        )}
      </main>
    </div>
  );
}
