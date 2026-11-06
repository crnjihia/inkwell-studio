"use client";

import React, { useState } from "react";
import { History, RotateCcw, GitCompare, CheckCircle2 } from "lucide-react";

export interface PromptVersionItem {
  id: string;
  versionNumber: string;
  versionCounter: number;
  systemPrompt: string;
  userPromptTemplate: string;
  isActive: boolean;
  changeSummary: string;
  createdAt: string | Date;
  createdById: string;
}

interface PromptVersionHistoryProps {
  promptId: string;
  promptName: string;
  versions: PromptVersionItem[];
  onRollback: (versionId: string, versionNumber: string) => Promise<void>;
  onViewDiff: (
    versionA: PromptVersionItem,
    versionB: PromptVersionItem,
  ) => void;
  language: "en" | "sw";
}

export function PromptVersionHistory({
  promptName,
  versions,
  onRollback,
  onViewDiff,
  language,
}: PromptVersionHistoryProps) {
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);
  const isSwahili = language === "sw";

  const activeVersion = versions.find((v) => v.isActive) || versions[0];

  const handleRollbackClick = async (version: PromptVersionItem) => {
    const confirmed = window.confirm(
      isSwahili
        ? `Una uhakika unataka kurudisha maagizo haya kwenye Toleo ${version.versionNumber}? Toleo la sasa litazimwa.`
        : `Are you sure you want to rollback to Version ${version.versionNumber}? The current active version will be deactivated.`,
    );

    if (confirmed) {
      setRollingBackId(version.id);
      try {
        await onRollback(version.id, version.versionNumber);
      } finally {
        setRollingBackId(null);
      }
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 shadow-xs transition-colors">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {isSwahili
                ? "Historia na Kumbukumbu ya Matoleo"
                : "Version History & Audit Trail"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {promptName} • {versions.length}{" "}
              {isSwahili ? "matoleo yaliyosajiliwa" : "immutable versions"}
            </p>
          </div>
        </div>

        {activeVersion && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isSwahili ? "Toleo Linalotumika Sasa:" : "Active Version:"} v
              {activeVersion.versionNumber}
            </span>
          </div>
        )}
      </div>

      <div className="relative border-l border-zinc-200 dark:border-zinc-800 pl-6 space-y-5 ml-2">
        {versions.map((ver) => {
          const formattedDate = new Intl.DateTimeFormat("en-KE", {
            timeZone: "Africa/Nairobi",
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(ver.createdAt));

          return (
            <div key={ver.id} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-[31px] top-2 flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-all ${
                  ver.isActive
                    ? "border-emerald-500 bg-emerald-500 ring-4 ring-emerald-500/20"
                    : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 group-hover:border-zinc-500"
                }`}
              />

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/30 p-4 transition-all hover:bg-white dark:hover:bg-zinc-900/70 hover:shadow-2xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        v{ver.versionNumber}
                      </span>
                      {ver.isActive ? (
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          {isSwahili ? "Linalotumika" : "Active"}
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                          {isSwahili ? "Kihistoria" : "Historical"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {formattedDate} EAT • {ver.createdById}
                    </p>
                  </div>

                  {/* Actions: Diff and Rollback */}
                  <div className="flex items-center gap-2">
                    {activeVersion && ver.id !== activeVersion.id && (
                      <button
                        type="button"
                        onClick={() => onViewDiff(ver, activeVersion)}
                        className="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        title="Compare with active version"
                      >
                        <GitCompare className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                        <span>
                          {isSwahili
                            ? "Linganisha na ya Sasa"
                            : "Diff with Active"}
                        </span>
                      </button>
                    )}

                    {!ver.isActive && (
                      <button
                        type="button"
                        disabled={rollingBackId === ver.id}
                        onClick={() => handleRollbackClick(ver)}
                        className="flex items-center gap-1 rounded-lg border border-amber-500/30 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 transition hover:bg-amber-100 dark:hover:bg-amber-900/60 disabled:opacity-50"
                        title="Set this version active"
                      >
                        <RotateCcw
                          className={`h-3 w-3 ${rollingBackId === ver.id ? "animate-spin" : ""}`}
                        />
                        <span>
                          {isSwahili
                            ? "Rejesha Toleo Hili"
                            : "Rollback to This"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Audit summary */}
                <div className="mt-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/50 p-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {isSwahili
                      ? "Muhtasari wa Mabadiliko (Audit):"
                      : "Change Summary (Audit):"}{" "}
                  </span>
                  <span>{ver.changeSummary}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
