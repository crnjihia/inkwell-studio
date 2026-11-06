"use client";

import React from "react";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";

export interface DailyUsageItem {
  date: string;
  inputTokens: number;
  outputTokens: number;
  costKes: number;
  costUsd: number;
}

interface CostChartProps {
  dailyData: DailyUsageItem[];
  language: "en" | "sw";
}

export function CostChart({ dailyData, language }: CostChartProps) {
  const isSwahili = language === "sw";

  const maxCostKes = Math.max(...dailyData.map((d) => d.costKes), 1.0);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 shadow-xs transition-colors">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {isSwahili ? "Mwenendo wa Matumizi ya Kila Siku (Timescale Rollup)" : "Daily Usage Trends (Timescale Rollup)"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isSwahili ? "Mkusanyiko wa gharama za KES na tokeni za AI" : "Continuous aggregates of KES spend & AI token volume"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
            <span className="h-2 w-2 rounded-xs bg-zinc-800 dark:bg-zinc-200" />
            Input Tokens
          </span>
          <span className="flex items-center gap-1.5 font-medium text-zinc-500 dark:text-zinc-400">
            <span className="h-2 w-2 rounded-xs bg-zinc-400 dark:bg-zinc-600" />
            Output Tokens
          </span>
        </div>
      </div>

      {dailyData.length === 0 ? (
        <div className="py-12 text-center text-xs text-zinc-400 dark:text-zinc-500">
          {isSwahili ? "Hakuna matumizi yaliyorekodiwa bado." : "No usage data recorded for this period."}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 items-end h-48 pt-4">
            {dailyData.slice(0, 14).reverse().map((day) => {
              const heightPct = Math.max(8, Math.min(100, (day.costKes / maxCostKes) * 100));

              return (
                <div key={day.date} className="flex flex-col items-center gap-1.5 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] rounded-md py-1 px-2 whitespace-nowrap z-20 shadow-lg pointer-events-none">
                    <span className="font-semibold">KSh {day.costKes.toFixed(2)}</span>
                    <span className="text-zinc-400 dark:text-zinc-600">
                      {(day.inputTokens + day.outputTokens).toLocaleString()} tok
                    </span>
                  </div>

                  <div className="w-full flex flex-col justify-end h-36 bg-zinc-100 dark:bg-zinc-800/60 rounded-md overflow-hidden">
                    <div
                      className="w-full bg-zinc-800 dark:bg-zinc-200 rounded-t-xs transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>

                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate w-full text-center">
                    {day.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              Siku 14 zilizopita (Rolling 14-day aggregate)
            </span>

            <span className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-medium">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              KES / USD Dual Currency
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
