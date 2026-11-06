"use client";

import React, { useState } from "react";
import { Play, Sparkles, Coins, Zap, CheckCircle2 } from "lucide-react";
import type { PromptVersionItem } from "./PromptVersionHistory";

interface StreamComparatorProps {
  promptName: string;
  versions: PromptVersionItem[];
  language: "en" | "sw";
}

interface VariantResult {
  variant: "A" | "B";
  versionNumber: string;
  outputText: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  formattedKes: string;
  formattedUsd: string;
}

const SWAHILI_COMPARE_TOPIC = "Ujumuishaji wa Teknolojia ya Kilimo Kaunti ya Nakuru";
const ENGLISH_COMPARE_TOPIC = "Agritech Digital Integration in Nakuru County";

const SWAHILI_COMPARE_CONTEXT = "Ushirika wa wakulima 450, bajeti ya KSh 2,500,000.";
const ENGLISH_COMPARE_CONTEXT = "Cooperative of 450 smallholders, budget KSh 2,500,000.";

export function StreamComparator({
  promptName,
  versions,
  language,
}: StreamComparatorProps) {
  const isSwahili = language === "sw";

  const [versionIdA, setVersionIdA] = useState(versions[0]?.id || "");
  const [versionIdB, setVersionIdB] = useState(versions[1]?.id || versions[0]?.id || "");

  const [topic, setTopic] = useState(
    isSwahili ? SWAHILI_COMPARE_TOPIC : ENGLISH_COMPARE_TOPIC
  );
  const [context, setContext] = useState(
    isSwahili ? SWAHILI_COMPARE_CONTEXT : ENGLISH_COMPARE_CONTEXT
  );
  const [tone, setTone] = useState<"professional" | "editorial" | "conversational" | "urgent">("professional");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");

  // Synchronize defaults on language change if user hasn't typed custom inputs
  React.useEffect(() => {
    setTopic((prev) => {
      if (prev === SWAHILI_COMPARE_TOPIC || prev === ENGLISH_COMPARE_TOPIC || !prev) {
        return isSwahili ? SWAHILI_COMPARE_TOPIC : ENGLISH_COMPARE_TOPIC;
      }
      return prev;
    });
    setContext((prev) => {
      if (prev === SWAHILI_COMPARE_CONTEXT || prev === ENGLISH_COMPARE_CONTEXT || !prev) {
        return isSwahili ? SWAHILI_COMPARE_CONTEXT : ENGLISH_COMPARE_CONTEXT;
      }
      return prev;
    });
  }, [language, isSwahili]);

  const [isRunning, setIsRunning] = useState(false);
  const [resultA, setResultA] = useState<VariantResult | null>(null);
  const [resultB, setResultB] = useState<VariantResult | null>(null);
  const [comparison, setComparison] = useState<{
    costDiffKes: number;
    tokenDiff: number;
    latencyDiffMs: number;
    moreEconomical: "A" | "B";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunComparison = async () => {
    if (!versionIdA || !versionIdB || !topic.trim()) return;

    setIsRunning(true);
    setError(null);
    setResultA(null);
    setResultB(null);
    setComparison(null);

    try {
      const res = await fetch("/api/prompts/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionIdA,
          versionIdB,
          topic,
          context,
          language,
          contentType: "grant_proposal",
          tone,
          length,
        }),
      });

      if (!res.ok) {
        throw new Error(`Comparison API returned HTTP status ${res.status}`);
      }

      const data = await res.json();
      setResultA(data.variantA);
      setResultB(data.variantB);
      setComparison(data.comparison);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Comparison failed";
      setError(msg);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Parameters Bar */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 shadow-xs transition-colors">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {isSwahili ? "Majaribio Sambamba ya Matoleo (A/B Testbench)" : "Side-by-Side Prompt A/B Testbench"}
            </h3>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{promptName}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {isSwahili ? "Toleo A (Msingi / Baseline)" : "Version A (Baseline)"}
            </label>
            <select
              value={versionIdA}
              onChange={(e) => setVersionIdA(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-hidden"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber} {v.isActive ? "(Active)" : ""} - {v.changeSummary.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {isSwahili ? "Toleo B (Mbadala / Challenger)" : "Version B (Challenger)"}
            </label>
            <select
              value={versionIdB}
              onChange={(e) => setVersionIdB(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-hidden"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber} {v.isActive ? "(Active)" : ""} - {v.changeSummary.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">{isSwahili ? "Mtindo" : "Tone"}</label>
            <select
              value={tone}
              onChange={(e) =>
                setTone(e.target.value as "professional" | "editorial" | "conversational" | "urgent")
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-hidden"
            >
              <option value="professional">Professional</option>
              <option value="editorial">Editorial</option>
              <option value="conversational">Conversational</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">{isSwahili ? "Urefu" : "Length"}</label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as "short" | "medium" | "long")}
              className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-hidden"
            >
              <option value="short">Short (~300 words)</option>
              <option value="medium">Medium (~750 words)</option>
              <option value="long">Long (~1500 words)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {isSwahili ? "Mada ya Kujaribia" : "Test Topic"}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleRunComparison}
              disabled={isRunning || !topic.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-xs font-medium text-white dark:text-zinc-900 shadow-2xs transition hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>
                {isRunning
                  ? isSwahili
                    ? "Inazalisha Sambamba..."
                    : "Running Concurrent Streams..."
                  : isSwahili
                  ? "Anza Jaribio la A/B"
                  : "Run Dual A/B Comparison"}
              </span>
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-400">Error: {error}</p>}
      </div>

      {/* Comparison Summary Banner */}
      {comparison && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/60 p-3.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {isSwahili ? "Uchambuzi wa Matokeo:" : "Execution Summary:"}
              </span>
              <span className="text-zinc-600 dark:text-zinc-400">
                {isSwahili
                  ? `Toleo ${comparison.moreEconomical} lina ufanisi bora zaidi wa kiuchumi (Tofauti ya KSh ${Math.abs(
                      comparison.costDiffKes
                    ).toFixed(4)}).`
                  : `Variant ${comparison.moreEconomical} was more economical (Delta: KSh ${Math.abs(
                      comparison.costDiffKes
                    ).toFixed(4)} / ${Math.abs(comparison.tokenDiff)} tokens).`}
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
              <span>Token Delta: {comparison.tokenDiff > 0 ? `+${comparison.tokenDiff}` : comparison.tokenDiff}</span>
              <span>Speed: {comparison.latencyDiffMs}ms</span>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-side Dual Panes */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Pane A */}
        <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 px-4 py-2.5">
            <div>
              <span className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 font-mono">
                Variant A: v{resultA?.versionNumber || versions.find((v) => v.id === versionIdA)?.versionNumber}
              </span>
            </div>

            {resultA && (
              <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                <span className="inline-flex items-center gap-1">
                  <Coins className="h-3 w-3 text-amber-500" />
                  {resultA.formattedKes}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Zap className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                  {resultA.latencyMs}ms
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 p-5">
            <div className="text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap min-h-[300px]">
              {resultA ? (
                resultA.outputText
              ) : isRunning ? (
                <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 italic">
                  <span className="h-2 w-2 rounded-full bg-zinc-500 animate-ping" />
                  Streaming variant A...
                </div>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500 italic">
                  {isSwahili ? "Bofya 'Anza Jaribio la A/B' kutazama matokeo ya Toleo A." : "Click Run Dual A/B Comparison to stream Variant A."}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pane B */}
        <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 px-4 py-2.5">
            <div>
              <span className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 font-mono">
                Variant B: v{resultB?.versionNumber || versions.find((v) => v.id === versionIdB)?.versionNumber}
              </span>
            </div>

            {resultB && (
              <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                <span className="inline-flex items-center gap-1">
                  <Coins className="h-3 w-3 text-amber-500" />
                  {resultB.formattedKes}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Zap className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                  {resultB.latencyMs}ms
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 p-5">
            <div className="text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap min-h-[300px]">
              {resultB ? (
                resultB.outputText
              ) : isRunning ? (
                <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 italic">
                  <span className="h-2 w-2 rounded-full bg-zinc-500 animate-ping" />
                  Streaming variant B...
                </div>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500 italic">
                  {isSwahili ? "Bofya 'Anza Jaribio la A/B' kutazama matokeo ya Toleo B." : "Click Run Dual A/B Comparison to stream Variant B."}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
