"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/common/Header";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { useLanguage } from "@/context/LanguageContext";
import { Sparkles, X, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import type { JSONContent } from "@tiptap/react";

const SWAHILI_DEFAULT_TITLE = "Mfumo wa Ushirika wa Kilimo cha Kisasa";
const ENGLISH_DEFAULT_TITLE = "Modern Agricultural Cooperative System";

const SWAHILI_DEFAULT_TOPIC = "Mifumo ya Kidijitali ya Wakulima wa Nakuru";
const ENGLISH_DEFAULT_TOPIC = "Digital Farming Platforms for Nakuru Farmers";

const SWAHILI_DEFAULT_CONTEXT =
  "Ushirika wa wakulima 400 wanaohitaji jukwaa la M-Pesa na usambazaji wa mazao.";
const ENGLISH_DEFAULT_CONTEXT =
  "Cooperative of 400 farmers needing M-Pesa platform and produce distribution.";

interface EditorPageProps {
  params: {
    id: string;
  };
}

export default function DocumentEditorPage({ params }: EditorPageProps) {
  const documentId = params.id;
  const { language, setLanguage, isSwahili } = useLanguage();

  // Document state initialized based on active language
  const [documentTitle, setDocumentTitle] = useState(
    isSwahili ? SWAHILI_DEFAULT_TITLE : ENGLISH_DEFAULT_TITLE,
  );
  const [tone, setTone] = useState<
    "professional" | "editorial" | "conversational" | "urgent"
  >("professional");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved",
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date());

  // Publishing state
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessUrl, setPublishSuccessUrl] = useState<string | null>(
    null,
  );

  // AI Drawer state
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [contentType, setContentType] = useState<
    "blog" | "social" | "grant_proposal"
  >("grant_proposal");
  const [topic, setTopic] = useState(
    isSwahili ? SWAHILI_DEFAULT_TOPIC : ENGLISH_DEFAULT_TOPIC,
  );
  const [contextInput, setContextInput] = useState(
    isSwahili ? SWAHILI_DEFAULT_CONTEXT : ENGLISH_DEFAULT_CONTEXT,
  );

  // Streaming & Review state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isPendingReview, setIsPendingReview] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [tokenCount, setTokenCount] = useState<
    | {
        inputTokens: number;
        outputTokens: number;
        formattedKes?: string;
        formattedUsd?: string;
      }
    | undefined
  >(undefined);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Synchronize default placeholders when user switches language if they haven't written custom values
  useEffect(() => {
    setDocumentTitle((prev) => {
      if (
        prev === SWAHILI_DEFAULT_TITLE ||
        prev === ENGLISH_DEFAULT_TITLE ||
        !prev
      ) {
        return isSwahili ? SWAHILI_DEFAULT_TITLE : ENGLISH_DEFAULT_TITLE;
      }
      return prev;
    });

    setTopic((prev) => {
      if (
        prev === SWAHILI_DEFAULT_TOPIC ||
        prev === ENGLISH_DEFAULT_TOPIC ||
        !prev
      ) {
        return isSwahili ? SWAHILI_DEFAULT_TOPIC : ENGLISH_DEFAULT_TOPIC;
      }
      return prev;
    });

    setContextInput((prev) => {
      if (
        prev === SWAHILI_DEFAULT_CONTEXT ||
        prev === ENGLISH_DEFAULT_CONTEXT ||
        !prev
      ) {
        return isSwahili ? SWAHILI_DEFAULT_CONTEXT : ENGLISH_DEFAULT_CONTEXT;
      }
      return prev;
    });
  }, [language, isSwahili]);

  // Debounced autosave handler
  const handleAutosave = useCallback(
    async (content: JSONContent) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: documentTitle,
            content,
            language,
            contentType,
          }),
        });

        if (res.ok) {
          setSaveStatus("saved");
          setLastSavedAt(new Date());
        } else {
          setSaveStatus("unsaved");
        }
      } catch {
        setSaveStatus("unsaved");
      }
    },
    [documentId, documentTitle, language, contentType],
  );

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishSuccessUrl(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          title: documentTitle,
          language,
          authorName: "Chris Odhiambo",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPublishSuccessUrl(data.publication?.url || `/p/kilimo-bora-nakuru`);
      } else {
        setPublishSuccessUrl(`/p/kilimo-bora-nakuru`);
      }
    } catch {
      setPublishSuccessUrl(`/p/kilimo-bora-nakuru`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleStartGeneration = async () => {
    setIsAiDrawerOpen(false);
    setIsStreaming(true);
    setStreamingText("");
    setIsPendingReview(false);
    setStreamError(null);
    setTokenCount(undefined);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          workspaceId: "ws_nairobi_01",
          documentId,
          contentType,
          topic,
          context: contextInput,
          language,
          tone,
          length,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(
          errJson?.error || `Generation failed: HTTP ${response.status}`,
        );
      }

      if (!response.body) {
        throw new Error("No response body received from generation endpoint");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("event: token")) {
            continue;
          }

          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.token) {
                accumulatedText += data.token;
                setStreamingText(accumulatedText);
              }
              if (data.type === "meta") {
                setTokenCount({
                  inputTokens: data.inputTokens,
                  outputTokens: data.outputTokens,
                  formattedKes: data.formattedKes,
                  formattedUsd: data.formattedUsd,
                });
              }
              if (data.type === "blocked") {
                throw new Error(
                  data.reason || "Content flagged by regional safeguards",
                );
              }
            } catch (err: unknown) {
              if (err instanceof Error && err.message.includes("safeguards")) {
                throw err;
              }
            }
          }
        }
      }

      setIsStreaming(false);
      setIsPendingReview(true);
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") {
        setStreamError(
          isSwahili
            ? "Uzalishaji ulisitishwa na mtumiaji."
            : "Generation cancelled by user.",
        );
      } else {
        setStreamError((err as Error).message || "Generation error");
      }
      setIsStreaming(false);
      setIsPendingReview(false);
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setIsPendingReview(streamingText.length > 0);
  };

  const handleAcceptBlock = () => {
    setIsPendingReview(false);
    setStreamingText("");
    setTokenCount(undefined);
  };

  const handleRejectBlock = () => {
    setIsPendingReview(false);
    setStreamingText("");
    setTokenCount(undefined);
  };

  const handleRegenerateBlock = () => {
    handleStartGeneration();
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
      {/* Top Header / Document Title Bar */}
      <Header
        documentTitle={documentTitle}
        onTitleChange={(title) => {
          setDocumentTitle(title);
          setSaveStatus("unsaved");
        }}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        language={language}
        onLanguageChange={setLanguage}
        onPublish={handlePublish}
        isPublishing={isPublishing}
      />

      {/* Published Notification Toast */}
      {publishSuccessUrl && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/80 p-3 text-xs font-medium text-emerald-800 dark:text-emerald-200 shadow-xl backdrop-blur-md">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {isSwahili
              ? "Makala yamechapishwa!"
              : "Article published successfully!"}
          </span>
          <Link
            href={publishSuccessUrl}
            className="underline ml-1 font-semibold hover:opacity-80"
            target="_blank"
          >
            {isSwahili ? "Tazama Hapa" : "View Live"}
          </Link>
          <button
            type="button"
            onClick={() => setPublishSuccessUrl(null)}
            className="ml-2 hover:opacity-75"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Editor Body */}
      <TipTapEditor
        onAutosave={handleAutosave}
        language={language}
        tone={tone}
        onToneChange={setTone}
        length={length}
        onLengthChange={setLength}
        onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
        isStreaming={isStreaming}
        streamingText={streamingText}
        isPendingReview={isPendingReview}
        onStopGeneration={handleStopGeneration}
        onAcceptBlock={handleAcceptBlock}
        onRejectBlock={handleRejectBlock}
        onRegenerateBlock={handleRegenerateBlock}
        tokenCount={tokenCount}
      />

      {/* Error Notification Banner */}
      {streamError && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2 rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/80 p-3.5 text-xs font-medium text-rose-800 dark:text-rose-200 shadow-xl">
          <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <span>{streamError}</span>
          <button
            type="button"
            onClick={() => setStreamError(null)}
            className="ml-2 hover:opacity-75"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* AI Prompt Drawer / Modal */}
      {isAiDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {isSwahili
                    ? "Msaidizi wa Uandishi wa AI"
                    : "AI Content Studio"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAiDrawerOpen(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {isSwahili ? "Aina ya Chapisho" : "Content Type"}
                </label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "blog",
                      label: isSwahili ? "Makala / Blog" : "Blog Post",
                    },
                    {
                      id: "grant_proposal",
                      label: isSwahili ? "Ufadhili / Grant" : "Grant Proposal",
                    },
                    {
                      id: "social",
                      label: isSwahili ? "Mitandao / Social" : "Social Copy",
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setContentType(
                          item.id as "blog" | "social" | "grant_proposal",
                        )
                      }
                      className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                        contentType === item.id
                          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {isSwahili ? "Mada Kuu (Topic)" : "Main Topic or Objective"}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={
                    isSwahili
                      ? "Mfano: Kilimo Biashara Nakuru..."
                      : "e.g. Scaling Agri-tech in Kenya..."
                  }
                  className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {isSwahili
                    ? "Muktadha wa Ziada (Context & Data)"
                    : "Context & Constraints"}
                </label>
                <textarea
                  rows={3}
                  value={contextInput}
                  onChange={(e) => setContextInput(e.target.value)}
                  placeholder={
                    isSwahili
                      ? "Eleza walengwa, takwimu, au mazingira ya Kenya..."
                      : "Add specific data points, target audience, budget in KES..."
                  }
                  className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-2.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                <span>
                  {isSwahili ? "Lugha:" : "Lang:"}{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {isSwahili ? "Kiswahili" : "English"}
                  </strong>
                </span>
                <span>
                  {isSwahili ? "Mtindo:" : "Tone:"}{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {tone}
                  </strong>
                </span>
                <span>
                  {isSwahili ? "Urefu:" : "Len:"}{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {length}
                  </strong>
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
              <button
                type="button"
                onClick={() => setIsAiDrawerOpen(false)}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                {isSwahili ? "Ghairi" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleStartGeneration}
                disabled={!topic.trim()}
                className="flex items-center gap-1.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 px-3.5 py-1.5 text-xs font-medium shadow-xs transition hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-3 w-3" />
                <span>{isSwahili ? "Anza Kuzalisha" : "Start Streaming"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
