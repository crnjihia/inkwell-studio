"use client";

import React from "react";
import { computeLineDiff } from "@/lib/diff";
import { GitCompare, Plus, Minus } from "lucide-react";

interface PromptDiffViewerProps {
  versionANumber: string;
  versionBNumber: string;
  textA: string;
  textB: string;
  title?: string;
  onClose?: () => void;
}

export function PromptDiffViewer({
  versionANumber,
  versionBNumber,
  textA,
  textB,
  title = "System Prompt Diff",
  onClose,
}: PromptDiffViewerProps) {
  const diffLines = computeLineDiff(textA, textB);

  const additions = diffLines.filter((l) => l.type === "added").length;
  const deletions = diffLines.filter((l) => l.type === "removed").length;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden transition-colors">
      {/* Diff Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <GitCompare className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{title}</span>
          <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-400">
            v{versionANumber} → v{versionBNumber}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">
              <Plus className="h-3 w-3" />
              {additions}
            </span>
            <span className="inline-flex items-center text-rose-600 dark:text-rose-400">
              <Minus className="h-3 w-3" />
              {deletions}
            </span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded px-2 py-0.5 text-xs font-medium text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 dark:text-zinc-400"
            >
              Funga
            </button>
          )}
        </div>
      </div>

      {/* Diff Content Canvas */}
      <div className="max-h-96 overflow-y-auto font-mono text-xs leading-5">
        <table className="w-full border-collapse">
          <tbody>
            {diffLines.map((line, idx) => {
              let rowBg = "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300";
              let marker = " ";
              let markerColor = "text-zinc-400 dark:text-zinc-600";

              if (line.type === "added") {
                rowBg = "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200";
                marker = "+";
                markerColor = "text-emerald-600 dark:text-emerald-400 font-bold";
              } else if (line.type === "removed") {
                rowBg = "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 line-through opacity-80";
                marker = "-";
                markerColor = "text-rose-600 dark:text-rose-400 font-bold";
              }

              return (
                <tr key={idx} className={`${rowBg} transition-colors hover:brightness-95 dark:hover:brightness-110`}>
                  <td className="w-10 select-none border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 text-right text-zinc-400 dark:text-zinc-600 text-[11px]">
                    {line.oldLineNumber ?? ""}
                  </td>
                  <td className="w-10 select-none border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 text-right text-zinc-400 dark:text-zinc-600 text-[11px]">
                    {line.newLineNumber ?? ""}
                  </td>
                  <td className={`w-6 select-none px-2 text-center ${markerColor}`}>{marker}</td>
                  <td className="whitespace-pre-wrap px-3 py-0.5">{line.text || " "}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
