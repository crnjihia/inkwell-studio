"use client";

import React from "react";
import { AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

interface BudgetAlertBannerProps {
  percentage: number;
  budgetKes: number;
  currentSpendKes: number;
  hardStopActive: boolean;
  hardStopEnabled: boolean;
  language: "en" | "sw";
}

export function BudgetAlertBanner({
  percentage,
  budgetKes,
  currentSpendKes,
  hardStopActive,
  hardStopEnabled,
  language,
}: BudgetAlertBannerProps) {
  const isSwahili = language === "sw";

  const formattedBudget = `KSh ${budgetKes.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
  const formattedSpend = `KSh ${currentSpendKes.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;

  if (hardStopActive || percentage >= 100) {
    return (
      <div className="rounded-2xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20 p-4 shadow-2xs transition-colors">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white shadow-2xs">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold text-rose-950 dark:text-rose-200">
                {isSwahili
                  ? "Tahadhari: Ukomo wa Bajeti ya AI Umefikiwa (100%)"
                  : "Alert: AI Budget Limit Reached (100%)"}
              </h4>
              <span className="rounded-md bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 text-xs font-mono font-semibold text-rose-800 dark:text-rose-300">
                {percentage.toFixed(1)}%
              </span>
            </div>

            <p className="mt-1 text-xs text-rose-800 dark:text-rose-300/80 leading-relaxed">
              {isSwahili
                ? `Workspace yako imetumia ${formattedSpend} kati ya bajeti ya ${formattedBudget}. ${
                    hardStopEnabled
                      ? "Sera ya Hard-Stop imeanzishwa; uzalishaji mpya wa AI umezuiwa hadi bajeti iongezwe au mwezi mpya uanze."
                      : "Tafadhali kagua matumizi yako ili kuepuka gharama zaidi."
                  }`
                : `Your workspace has consumed ${formattedSpend} of your ${formattedBudget} budget. ${
                    hardStopEnabled
                      ? "Hard-stop policy is active; further AI generations are blocked until budget is increased or the billing cycle resets."
                      : "Please review token usage to prevent unexpected overages."
                  }`}
            </p>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-rose-200 dark:bg-rose-950">
              <div
                className="h-full bg-rose-600 dark:bg-rose-500 rounded-full"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (percentage >= 80) {
    return (
      <div className="rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 shadow-2xs transition-colors">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold text-amber-950 dark:text-amber-200">
                {isSwahili
                  ? "Uangalifu: Asilimia 80 ya Bajeti Imefikiwa"
                  : "Warning: 80% Monthly Budget Threshold Reached"}
              </h4>
              <span className="rounded-md bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 text-xs font-mono font-semibold text-amber-800 dark:text-amber-300">
                {percentage.toFixed(1)}%
              </span>
            </div>

            <p className="mt-1 text-xs text-amber-800 dark:text-amber-300/80 leading-relaxed">
              {isSwahili
                ? `Umetumia ${formattedSpend} kati ya ${formattedBudget}. Taarifa ya barua pepe imetumwa kwa msimamizi wa akaunti.`
                : `You have consumed ${formattedSpend} of your ${formattedBudget} allocation. An email notification has been dispatched to the workspace admin.`}
            </p>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-amber-200 dark:bg-amber-950">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/15 p-3.5 shadow-2xs transition-colors">
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">
            {isSwahili ? "Hali ya Bajeti: Salama" : "Budget Status: Healthy"}
          </span>
          <span className="text-emerald-700 dark:text-emerald-400/80 text-[11px]">
            ({formattedSpend} / {formattedBudget})
          </span>
        </div>

        <span className="font-mono text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          {percentage.toFixed(1)}%
        </span>
      </div>

      <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-emerald-200 dark:bg-emerald-950">
        <div
          className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full"
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}
