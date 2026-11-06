"use client";

import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "./EditorToolbar";
import { AiBlockActions } from "./AiBlockActions";

const SWAHILI_SAMPLE_HEADING = "Mfumo wa Ushirika wa Kilimo cha Kisasa Kenya";
const ENGLISH_SAMPLE_HEADING = "Modern Agricultural Cooperative System Kenya";

interface TipTapEditorProps {
  initialContent?: JSONContent;
  onAutosave?: (content: JSONContent) => void;
  language: "en" | "sw";
  tone: "professional" | "editorial" | "conversational" | "urgent";
  onToneChange: (
    tone: "professional" | "editorial" | "conversational" | "urgent",
  ) => void;
  length: "short" | "medium" | "long";
  onLengthChange: (length: "short" | "medium" | "long") => void;
  onOpenAiDrawer: () => void;
  // Streaming state
  isStreaming: boolean;
  streamingText: string;
  isPendingReview: boolean;
  onStopGeneration: () => void;
  onAcceptBlock: () => void;
  onRejectBlock: () => void;
  onRegenerateBlock: () => void;
  tokenCount?: {
    inputTokens: number;
    outputTokens: number;
    formattedKes?: string;
    formattedUsd?: string;
  };
}

export function TipTapEditor({
  initialContent,
  onAutosave,
  language,
  tone,
  onToneChange,
  length,
  onLengthChange,
  onOpenAiDrawer,
  isStreaming,
  streamingText,
  isPendingReview,
  onStopGeneration,
  onAcceptBlock,
  onRejectBlock,
  onRegenerateBlock,
  tokenCount,
}: TipTapEditorProps) {
  const isSwahili = language === "sw";
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const defaultContent: JSONContent = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [
          {
            type: "text",
            text: isSwahili ? SWAHILI_SAMPLE_HEADING : ENGLISH_SAMPLE_HEADING,
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: isSwahili
              ? "Mradi huu unalenga kuwawezesha wakulima wadogo katika kaunti za Nakuru, Uasin Gishu na Machakos kutumia teknolojia ya simu za mkononi kwa usambazaji wa mazao."
              : "This initiative empowers smallholder farmers across Nakuru, Uasin Gishu, and Machakos counties using mobile technology for agricultural produce distribution.",
          },
        ],
      },
    ],
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: isSwahili
          ? "Anza kuandika hapa, au bofya 'Zalisha kwa AI' kutengeneza rasimu..."
          : "Start writing here, or click 'AI Assist' to draft content...",
      }),
    ],
    content: initialContent || defaultContent,
    editorProps: {
      attributes: {
        class:
          "focus:outline-hidden prose prose-zinc dark:prose-invert max-w-none min-h-[500px]",
      },
    },
    onUpdate: ({ editor }) => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = setTimeout(() => {
        onAutosave?.(editor.getJSON());
      }, 1000);
    },
  });

  // Dynamically adapt default sample content if untouched by the user
  useEffect(() => {
    if (!editor) return;
    const text = editor.getText();
    if (
      text.includes(SWAHILI_SAMPLE_HEADING) ||
      text.includes(ENGLISH_SAMPLE_HEADING) ||
      text.trim().length === 0
    ) {
      if (isSwahili) {
        editor.commands.setContent({
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: SWAHILI_SAMPLE_HEADING }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Mradi huu unalenga kuwawezesha wakulima wadogo katika kaunti za Nakuru, Uasin Gishu na Machakos kutumia teknolojia ya simu za mkononi kwa usambazaji wa mazao.",
                },
              ],
            },
          ],
        });
      } else {
        editor.commands.setContent({
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: ENGLISH_SAMPLE_HEADING }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "This initiative empowers smallholder farmers across Nakuru, Uasin Gishu, and Machakos counties using mobile technology for agricultural produce distribution.",
                },
              ],
            },
          ],
        });
      }
    }
  }, [language, isSwahili, editor]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const handleAccept = () => {
    if (editor && streamingText.trim()) {
      const paragraphs = streamingText.split("\n\n").filter(Boolean);
      for (const para of paragraphs) {
        if (para.startsWith("# ")) {
          editor.commands.insertContent({
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: para.replace(/^#\s+/, "") }],
          });
        } else if (para.startsWith("## ")) {
          editor.commands.insertContent({
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: para.replace(/^##\s+/, "") }],
          });
        } else if (para.startsWith("### ")) {
          editor.commands.insertContent({
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: para.replace(/^###\s+/, "") }],
          });
        } else {
          editor.commands.insertContent({
            type: "paragraph",
            content: [{ type: "text", text: para }],
          });
        }
      }
    }
    onAcceptBlock();
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-150">
      {/* Editor Formatting & AI Toolbar */}
      <EditorToolbar
        editor={editor}
        tone={tone}
        onToneChange={onToneChange}
        length={length}
        onLengthChange={onLengthChange}
        onOpenAiDrawer={onOpenAiDrawer}
        isStreaming={isStreaming}
        language={language}
      />

      {/* Main Document Canvas */}
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-8 sm:p-12 shadow-xs transition-colors">
            <EditorContent editor={editor} />
          </div>

          {/* AI Streaming Pending Block Preview */}
          {(isStreaming || isPendingReview) && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
                  <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  {isStreaming
                    ? isSwahili
                      ? "Inatiririsha..."
                      : "Streaming tokens..."
                    : isSwahili
                      ? "Rasimu ya AI (Inasubiri ukaguzi)"
                      : "AI Block (Pending review)"}
                </span>

                {tokenCount && (
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                    {tokenCount.formattedKes} ({tokenCount.outputTokens} tok)
                  </span>
                )}
              </div>

              <div className="ai-streaming-block border border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/20 rounded-lg p-5">
                <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                  {streamingText}
                  {isStreaming && (
                    <span className="inline-block h-3.5 w-1 animate-pulse bg-indigo-500 align-middle ml-1" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar during Streaming / Pending Review */}
      <AiBlockActions
        isStreaming={isStreaming}
        isPendingReview={isPendingReview}
        onStop={onStopGeneration}
        onAccept={handleAccept}
        onReject={onRejectBlock}
        onRegenerate={onRegenerateBlock}
        tokenCount={tokenCount}
        language={language}
      />
    </div>
  );
}
