"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/common/Header";
import { useLanguage } from "@/context/LanguageContext";
import { BudgetAlertBanner } from "@/components/usage/BudgetAlertBanner";
import { CostChart, type DailyUsageItem } from "@/components/usage/CostChart";
import { Coins, Zap, Shield, Sparkles, Clock, ArrowDownUp } from "lucide-react";

interface UsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostKes: number;
  totalCostUsd: number;
  formattedCostKes: string;
  formattedCostUsd: string;
  totalGenerations: number;
}

interface BudgetStatusData {
  allowed: boolean;
  hardStopActive: boolean;
  budgetMonthlyKes: number;
  currentSpendKes: number;
  percentage: number;
  alertLevel: "ok" | "warning_80" | "exceeded_100";
}

interface RecentUsageEvent {
  id: string;
  time: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  costKes: number;
  costUsd: number;
  formattedKes: string;
}

export default function UsageDashboardPage() {
  const { language, setLanguage, isSwahili } = useLanguage();
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatusData | null>(null);
  const [dailyData, setDailyData] = useState<DailyUsageItem[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentUsageEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/usage");
        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary);
          setBudgetStatus(data.budgetStatus);
          setDailyData(data.dailyUsage || []);
          setRecentEvents(data.recentEvents || []);
        }
      } catch (err) {
        console.error("Failed to fetch usage metrics:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsage();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <Header language={language} onLanguageChange={setLanguage} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Page Title */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                <Coins className="h-4 w-4" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {isSwahili ? "Dashibodi ya Matumizi na Gharama" : "Usage & Cost Telemetry"}
              </h1>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {isSwahili
                ? "Uhasibu wa tokeni na makadirio ya gharama za KES na USD kwa kutumia TimescaleDB."
                : "Real-time token telemetry, dual-currency accounting (KES & USD), and budget protection."}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 shadow-2xs font-mono">
            <span>Saa: <strong>Africa/Nairobi (EAT)</strong></span>
          </div>
        </div>

        {/* Budget Alert Banner */}
        {budgetStatus && (
          <BudgetAlertBanner
            percentage={budgetStatus.percentage}
            budgetKes={budgetStatus.budgetMonthlyKes}
            currentSpendKes={budgetStatus.currentSpendKes}
            hardStopActive={budgetStatus.hardStopActive}
            hardStopEnabled={true}
            language={language}
          />
        )}

        {/* Top Metric Cards */}
        {summary && budgetStatus && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: KES Spend */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 shadow-xs transition-colors">
              <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {isSwahili ? "Gharama Jumla (KES)" : "Total Spend (KES)"}
                </span>
                <Coins className="h-4 w-4" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{summary.formattedCostKes}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {summary.formattedCostUsd} USD (1 USD = 130 KES)
              </p>
            </div>

            {/* Card 2: Token Volume */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 shadow-xs transition-colors">
              <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {isSwahili ? "Tokeni Zilizotumika" : "Total Tokens"}
                </span>
                <Zap className="h-4 w-4" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {summary.totalTokens.toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                In: {summary.totalInputTokens.toLocaleString()} • Out: {summary.totalOutputTokens.toLocaleString()}
              </p>
            </div>

            {/* Card 3: Budget Consumption */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 shadow-xs transition-colors">
              <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {isSwahili ? "Ukomo wa Bajeti" : "Budget Target"}
                </span>
                <Shield className="h-4 w-4" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {budgetStatus.percentage}%
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                KSh {budgetStatus.budgetMonthlyKes.toLocaleString()} {isSwahili ? "kila mwezi" : "monthly allocation"}
              </p>
            </div>

            {/* Card 4: Generations Count */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 shadow-xs transition-colors">
              <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {isSwahili ? "Machapisho ya AI" : "Generations"}
                </span>
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {summary.totalGenerations}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {isSwahili ? "Kupitia Claude 3.5 Sonnet" : "Across Claude 3.5 Sonnet"}
              </p>
            </div>
          </div>
        )}

        {/* Daily Continuous Aggregate Chart */}
        <CostChart dailyData={dailyData} language={language} />

        {/* Recent Events Ledger */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 shadow-xs transition-colors">
          <div className="mb-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {isSwahili ? "Daftari la Matukio ya Hivi Karibuni (Usage Ledger)" : "Recent Usage Events Ledger"}
              </h3>
            </div>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">TimescaleDB Hypertable</span>
          </div>

          {recentEvents.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
              {isSwahili ? "Hakuna matukio yaliyorekodiwa bado." : "No usage events found."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-medium">
                    <th className="py-2.5 px-3">Timestamp (EAT)</th>
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">Input Tok</th>
                    <th className="py-2.5 px-3">Output Tok</th>
                    <th className="py-2.5 px-3 text-right">Cost (KES)</th>
                    <th className="py-2.5 px-3 text-right">Cost (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono text-zinc-700 dark:text-zinc-300">
                  {recentEvents.map((evt) => {
                    const formattedTime = new Intl.DateTimeFormat("en-KE", {
                      timeZone: "Africa/Nairobi",
                      dateStyle: "short",
                      timeStyle: "medium",
                    }).format(new Date(evt.time));

                    return (
                      <tr key={evt.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-sans">
                          <Clock className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                          {formattedTime}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-zinc-900 dark:text-zinc-100">{evt.modelId}</td>
                        <td className="py-2.5 px-3">{evt.inputTokens.toLocaleString()}</td>
                        <td className="py-2.5 px-3">{evt.outputTokens.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                          {evt.formattedKes}
                        </td>
                        <td className="py-2.5 px-3 text-right text-zinc-500 dark:text-zinc-400">${evt.costUsd.toFixed(4)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
