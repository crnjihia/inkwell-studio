"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/common/Header";
import { useLanguage } from "@/context/LanguageContext";
import { PromptVersionHistory, type PromptVersionItem } from "@/components/prompts/PromptVersionHistory";
import { PromptDiffViewer } from "@/components/prompts/PromptDiffViewer";
import { SlidersHorizontal, Plus, GitCompare, Sparkles, Check, X } from "lucide-react";

interface PromptWithVersions {
  id: string;
  name: string;
  description: string;
  contentType: string;
  language: string;
  activeVersionId: string | null;
  versions: PromptVersionItem[];
}

export default function PromptsStudioPage() {
  const { language, setLanguage, isSwahili } = useLanguage();
  const [promptsList, setPromptsList] = useState<PromptWithVersions[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [diffComparison, setDiffComparison] = useState<{
    versionA: PromptVersionItem;
    versionB: PromptVersionItem;
  } | null>(null);

  // New version form state
  const [systemPromptInput, setSystemPromptInput] = useState("");
  const [templateInput, setTemplateInput] = useState("");
  const [changeSummaryInput, setChangeSummaryInput] = useState("");
  const [changeType, setChangeType] = useState<"major" | "minor" | "patch">("minor");
  const [makeActiveCheck, setMakeActiveCheck] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch prompts
  const loadPrompts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/prompts");
      if (res.ok) {
        const data = await res.json();
        setPromptsList(data.prompts || []);
        if (data.prompts?.length > 0 && !selectedPromptId) {
          setSelectedPromptId(data.prompts[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load prompts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  const selectedPrompt =
    promptsList.find((p) => p.id === selectedPromptId) || promptsList[0];

  // Handle Rollback
  const handleRollback = async (versionId: string, versionNumber: string) => {
    if (!selectedPrompt) return;
    try {
      const res = await fetch(`/api/prompts/${selectedPrompt.id}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetVersionId: versionId,
          rollbackReason: `Restored version ${versionNumber} via prompt studio`,
        }),
      });

      if (res.ok) {
        await loadPrompts();
      } else {
        alert("Failed to execute rollback");
      }
    } catch {
      alert("Error contacting rollback endpoint");
    }
  };

  // Open modal prefilled with current active version
  const handleOpenCreateModal = () => {
    const activeVer = selectedPrompt?.versions.find((v) => v.isActive) || selectedPrompt?.versions[0];
    if (activeVer) {
      setSystemPromptInput(activeVer.systemPrompt);
      setTemplateInput(activeVer.userPromptTemplate);
    } else {
      setSystemPromptInput("");
      setTemplateInput("");
    }
    setChangeSummaryInput("");
    setIsNewVersionModalOpen(true);
  };

  // Submit new version
  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrompt || !systemPromptInput.trim() || !changeSummaryInput.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: selectedPrompt.id,
          systemPrompt: systemPromptInput,
          userPromptTemplate: templateInput,
          changeSummary: changeSummaryInput,
          changeType,
          makeActive: makeActiveCheck,
          userId: "user_chris_nairobi",
        }),
      });

      if (res.ok) {
        setIsNewVersionModalOpen(false);
        await loadPrompts();
      } else {
        alert("Failed to create version");
      }
    } catch {
      alert("Error submitting new version");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <Header language={language} onLanguageChange={setLanguage} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Title & Navigation Banner */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {isSwahili ? "Studio ya Mielekezo ya AI" : "AI Prompt Version Studio"}
              </h1>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {isSwahili
                ? "Dhibiti na urejeshe matoleo ya maagizo ya mfumo kama msimbo wa programu (code). Hakuna kupoteza ubora."
                : "Version, audit, diff, and rollback system prompts like code. Zero quality regressions."}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/prompts/compare"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60 shadow-2xs"
            >
              <GitCompare className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>{isSwahili ? "Linganisha Matoleo (A/B Test)" : "Compare Versions (A/B Test)"}</span>
            </Link>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              disabled={!selectedPrompt}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3.5 py-1.5 text-xs font-medium text-white dark:text-zinc-900 shadow-2xs transition hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isSwahili ? "Chapisha Toleo Jipya" : "Publish New Version"}</span>
            </button>
          </div>
        </div>

        {/* Studio Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Prompts List */}
          <div className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
              {isSwahili ? "Mielekezo Iliyopo (Templates)" : "Registered Prompts"}
            </h2>

            {isLoading ? (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                Loading prompts...
              </div>
            ) : promptsList.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                No prompts seeded yet. Run database seeder.
              </div>
            ) : (
              promptsList.map((prompt) => {
                const isSelected = prompt.id === selectedPrompt?.id;
                const activeVer = prompt.versions.find((v) => v.isActive) || prompt.versions[0];

                return (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => setSelectedPromptId(prompt.id)}
                    className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? "border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900 shadow-xs ring-1 ring-zinc-900/10 dark:ring-zinc-100/20"
                        : "border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100">{prompt.name}</span>
                      <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-400">
                        v{activeVer?.versionNumber || "1.0.0"}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{prompt.description}</p>

                    <div className="mt-3 flex items-center gap-1.5 text-[11px]">
                      <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-medium text-zinc-700 dark:text-zinc-300">
                        {prompt.contentType}
                      </span>
                      <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-zinc-600 dark:text-zinc-400">
                        {prompt.language === "sw" ? "🇰🇪 Kiswahili" : "🇬🇧 English"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Version History & Actions */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPrompt ? (
              <PromptVersionHistory
                promptId={selectedPrompt.id}
                promptName={selectedPrompt.name}
                versions={selectedPrompt.versions}
                onRollback={handleRollback}
                onViewDiff={(vA, vB) => setDiffComparison({ versionA: vA, versionB: vB })}
                language={language}
              />
            ) : null}

            {/* Diff Viewer Modal / Dock */}
            {diffComparison && (
              <div className="mt-6">
                <PromptDiffViewer
                  versionANumber={diffComparison.versionA.versionNumber}
                  versionBNumber={diffComparison.versionB.versionNumber}
                  textA={diffComparison.versionA.systemPrompt}
                  textB={diffComparison.versionB.systemPrompt}
                  title={`${isSwahili ? "Ulinganisho wa Mfumo:" : "System Prompt Diff:"} v${
                    diffComparison.versionA.versionNumber
                  } vs v${diffComparison.versionB.versionNumber}`}
                  onClose={() => setDiffComparison(null)}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal: Publish New Immutable Prompt Version */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {isSwahili ? "Chapisha Toleo Jipya la Maagizo" : "Publish New Prompt Version"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewVersionModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVersion} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {isSwahili ? "Maagizo ya Mfumo (System Prompt)" : "System Prompt"}
                </label>
                <textarea
                  rows={4}
                  required
                  value={systemPromptInput}
                  onChange={(e) => setSystemPromptInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {isSwahili ? "Kiolezo cha Mtumiaji (User Template with {{topic}})" : "User Prompt Template"}
                </label>
                <textarea
                  rows={2}
                  required
                  value={templateInput}
                  onChange={(e) => setTemplateInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {isSwahili ? "Aina ya Mabadiliko (Semver)" : "Change Type"}
                  </label>
                  <select
                    value={changeType}
                    onChange={(e) => setChangeType(e.target.value as "major" | "minor" | "patch")}
                    className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-hidden"
                  >
                    <option value="patch">Patch (e.g. 1.0.1 - Minor wording tweak)</option>
                    <option value="minor">Minor (e.g. 1.1.0 - New guidance or formatting)</option>
                    <option value="major">Major (e.g. 2.0.0 - Complete prompt rewrite)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={makeActiveCheck}
                      onChange={(e) => setMakeActiveCheck(e.target.checked)}
                      className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500"
                    />
                    <span>{isSwahili ? "Weka toleo hili kuwa linalotumika sasa" : "Set as active immediately"}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {isSwahili ? "Muhtasari wa Mabadiliko (Audit Change Summary)" : "Audit Change Summary"}
                </label>
                <input
                  type="text"
                  required
                  value={changeSummaryInput}
                  onChange={(e) => setChangeSummaryInput(e.target.value)}
                  placeholder={
                    isSwahili
                      ? "Mfano: Kuboresha msamiati wa kilimo kaunti za Nakuru na Uasin Gishu"
                      : "e.g. Tightened budget justifications and added KES currency rules"
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-hidden"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewVersionModalOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {isSwahili ? "Ghairi" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !changeSummaryInput.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3.5 py-1.5 text-xs font-medium text-white dark:text-zinc-900 shadow-2xs transition hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? (isSwahili ? "Inasajili..." : "Publishing...") : isSwahili ? "Sajili Toleo" : "Publish Version"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
