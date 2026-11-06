"use client";

import React from "react";
import { Check, X, RotateCw, Square, Sparkles, Coins } from "lucide-react";

interface AiBlockActionsProps {
  isStreaming: boolean;
  isPendingReview: boolean;
  onStop: () => void;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate: () => void;
  tokenCount?: {
    inputTokens: number;
    outputTokens: number;
    formattedKes?: string;
    formattedUsd?: string;
  };
  language: "en" | "sw";
}

export function AiBlockActions({
  isStreaming,
  isPendingReview,
  onStop,
  onAccept,
  onReject,
  onRegenerate,
  tokenCount,
  language,
}: AiBlockActionsProps) {
  if (!isStreaming && !isPendingReview) return null;

  const isSwahili = language === "sw";

  return (
    <div className="sticky bottom-6 z-30 mx-auto max-w-xl rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-2.5 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status & Token / Cost Info */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <Sparkles className="h-3 w-3" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                {isStreaming
                  ? isSwahili
                    ? "Inazalisha..."
                    : "Generating..."
                  : isSwahili
                    ? "Kagua Pendekezo"
                    : "Review Suggestion"}
              </span>
              {isStreaming && (
                <span className="inline-flex h-1.5 w-1.5 animate-ping rounded-full bg-indigo-500" />
              )}
            </div>

            {tokenCount && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                <Coins className="h-3 w-3 text-amber-500" />
                <span>
                  {tokenCount.formattedKes || "KSh 0.00"} (
                  {tokenCount.outputTokens} tok)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1 rounded border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-300 hover:opacity-90 transition"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>{isSwahili ? "Sitisha" : "Stop"}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onReject}
                className="flex items-center gap-1 rounded border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title={
                  isSwahili ? "Futa pendekezo hili" : "Discard this suggestion"
                }
              >
                <X className="h-3 w-3 text-zinc-400" />
                <span>{isSwahili ? "Kataa" : "Reject"}</span>
              </button>

              <button
                type="button"
                onClick={onRegenerate}
                className="flex items-center gap-1 rounded border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title={isSwahili ? "Zalisha upya" : "Regenerate alternative"}
              >
                <RotateCw className="h-3 w-3 text-zinc-400" />
                <span>{isSwahili ? "Upya" : "Retry"}</span>
              </button>

              <button
                type="button"
                onClick={onAccept}
                className="flex items-center gap-1 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 px-3 py-1 text-xs font-medium hover:opacity-90 transition shadow-2xs"
                title={
                  isSwahili
                    ? "Kubali na weka kwenye makala"
                    : "Accept and merge into document"
                }
              >
                <Check className="h-3 w-3" />
                <span>{isSwahili ? "Kubali" : "Accept"}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
