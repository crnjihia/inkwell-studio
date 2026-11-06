"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/common/Header";
import { useLanguage } from "@/context/LanguageContext";
import {
  PenTool,
  Sparkles,
  SlidersHorizontal,
  Coins,
  Globe,
  ArrowRight,
  ShieldCheck,
  Users,
} from "lucide-react";

export default function RootHomePage() {
  const { language, setLanguage, isSwahili } = useLanguage();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-150">
      <Header language={language} onLanguageChange={setLanguage} />

      <main className="flex-1">
        {/* Minimal Hero Section */}
        <section className="relative border-b border-zinc-200 dark:border-zinc-800/80 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Regional Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 px-3 py-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mb-8 shadow-2xs">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{isSwahili ? "🇰🇪 Nairobi Studio • Afrika Mashariki" : "🇰🇪 Nairobi Studio • East Africa"}</span>
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-6xl">
              Inkwell Studio
            </h1>

            <p className="mt-5 text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-normal">
              {isSwahili
                ? "Jukwaa la kisasa la AI la uandishi wa makala na mapendekezo ya miradi kwa Kiswahili na Kiingereza. Dhibiti mielekezo ya mfumo kwa toleo na uchapishe kwa haraka."
                : "Minimalist AI content platform for East African creators. Stream essays and grant proposals in English and Swahili with collaborative editing, prompt versioning, and edge caching."}
            </p>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/editor/doc_nairobi_01"
                className="inline-flex items-center gap-2 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 px-4 py-2 text-xs font-medium hover:opacity-90 transition shadow-2xs"
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>{isSwahili ? "Fungua Mhariri wa TipTap" : "Open TipTap Editor"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <Link
                href="/prompts"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shadow-2xs"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" />
                <span>{isSwahili ? "Mielekezo ya AI (Prompts)" : "Prompt Versions"}</span>
              </Link>

              <Link
                href="/usage"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shadow-2xs"
              >
                <Coins className="h-3.5 w-3.5 text-amber-500" />
                <span>{isSwahili ? "Matumizi (KES)" : "Usage & Costs (KES)"}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Minimal Bento Grid */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-left mb-10">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {isSwahili ? "Usanifu na Nguzo za Mfumo" : "Architectural Pillars"}
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {isSwahili
                  ? "Vipengele vilivyoundwa kwa viwango vya uzalishaji vya Cloudflare Workers, TipTap CRDTs na TimescaleDB."
                  : "Engineered with Cloudflare Workers edge caching, Yjs Durable Objects, and TimescaleDB telemetry."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: TipTap Streaming */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 mb-3">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {isSwahili ? "Mtiririko wa AI (SSE)" : "Streaming TipTap Co-Authoring"}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                  {isSwahili
                    ? "Tengeneza maudhui kwa Kiswahili au Kiingereza kwa kuchagua toni na urefu, na kukubali au kukataa mabadiliko ya aya kwa mbofyo mmoja."
                    : "Stream Anthropic tokens directly into ProseMirror editor with diff block accept/reject actions and regional Swahili prompt injection."}
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400 dark:text-zinc-500">Phase 2 & 3</span>
                  <Link href="/editor/doc_nairobi_01" className="text-zinc-900 dark:text-zinc-300 hover:underline flex items-center gap-1 font-sans">
                    <span>{isSwahili ? "Fungua" : "Open"}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Card 2: Yjs Durable Objects */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 mb-3">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {isSwahili ? "Ushirikiano wa Moja kwa Moja" : "Durable Object Collaboration"}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                  {isSwahili
                    ? "Waandishi wengi huunganishwa kupitia vyumba vya Cloudflare Durable Objects na kugeuza matini bila migongano ya data."
                    : "Multi-user CRDT document collaboration powered by Cloudflare Durable Objects (`DocumentRoom`) and Yjs awareness presence."}
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                  <span>Phase 5</span>
                  <span className="font-sans">CRDT Convergent</span>
                </div>
              </div>

              {/* Card 3: Prompt Versioning */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 mb-3">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {isSwahili ? "Udhibiti wa Matoleo ya Mielekezo" : "Prompt Version Control & Rollback"}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                  {isSwahili
                    ? "Dhibiti mielekezo ya mfumo kwa SemVer (v1.0.0, v1.1.0), kagua tofauti za mistari (diff), na rudisha toleo lililopita mara moja."
                    : "Semantic versioning for system prompts with side-by-side visual line diffs, A/B output comparison, and non-destructive rollbacks."}
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400 dark:text-zinc-500">Phase 4</span>
                  <Link href="/prompts" className="text-zinc-900 dark:text-zinc-300 hover:underline flex items-center gap-1 font-sans">
                    <span>{isSwahili ? "Tazama" : "View"}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Card 4: Edge Cache & Purge */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 mb-3">
                  <Globe className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {isSwahili ? "Uchapishaji & Kufuta Cache" : "Static Publishing & Sub-Second Purge"}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                  {isSwahili
                    ? "Chapisha makala kwa mbofyo mmoja yakizalisha metadata ya Open Graph na schema ya JSON-LD na kufuta cache chini ya sekunde moja."
                    : "One-click static publication generating Open Graph tags and JSON-LD schema with instant sub-second edge cache purge (<1000ms SLA)."}
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400 dark:text-zinc-500">Phase 6 & 7</span>
                  <Link href="/p/kilimo-bora-nakuru" className="text-zinc-900 dark:text-zinc-300 hover:underline flex items-center gap-1 font-sans">
                    <span>{isSwahili ? "Soma" : "Read"}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Card 5: TimescaleDB Analytics */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 mb-3">
                  <Coins className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {isSwahili ? "Takwimu za Matumizi (KES)" : "Usage Analytics & KES Budgets"}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                  {isSwahili
                    ? "Ufuatiliaji wa kina wa sarafu pacha (KES na USD) kupitia Timescale continuous aggregates na tahadhari ya barua pepe."
                    : "Dual-currency token cost rollups via Timescale hypertables with continuous aggregates and email threshold alerts at 80% and 100%."}
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400 dark:text-zinc-500">Phase 8</span>
                  <Link href="/usage" className="text-zinc-900 dark:text-zinc-300 hover:underline flex items-center gap-1 font-sans">
                    <span>{isSwahili ? "Dashibodi" : "Dashboard"}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Card 6: AI Safeguards & PII Hygiene */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 mb-3">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {isSwahili ? "Ulinzi & Usiri wa Data (PII)" : "PII Hygiene & Injection Defense"}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                  {isSwahili
                    ? "Kizuizi dhidi ya uvamizi wa mielekezo, mipaka ya muktadha usioaminika, na kufuta nambari za simu za Kenya na M-Pesa kutoka kwenye logi."
                    : "Indirect prompt injection sanitization, delimiter tags, bilingual moderation, and automatic redaction of Kenyan phone numbers and M-Pesa receipts."}
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                  <span>Phase 9</span>
                  <span className="font-sans">Zero-Leakage</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal Footer / Demo Links */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Inkwell Studio</span>
              <span>•</span>
              <span>Nairobi Innovators Studio</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/editor/doc_nairobi_01" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition">Editor</Link>
              <Link href="/prompts" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition">Prompts</Link>
              <Link href="/usage" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition">Usage</Link>
              <Link href="/p/kilimo-bora-nakuru" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition">Sample Post</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
