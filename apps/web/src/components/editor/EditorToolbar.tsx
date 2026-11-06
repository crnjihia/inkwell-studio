"use client";

import React from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Sparkles,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
  tone: "professional" | "editorial" | "conversational" | "urgent";
  onToneChange: (tone: "professional" | "editorial" | "conversational" | "urgent") => void;
  length: "short" | "medium" | "long";
  onLengthChange: (length: "short" | "medium" | "long") => void;
  onOpenAiDrawer: () => void;
  isStreaming?: boolean;
  language: "en" | "sw";
}

export function EditorToolbar({
  editor,
  tone,
  onToneChange,
  length,
  onLengthChange,
  onOpenAiDrawer,
  isStreaming,
  language,
}: EditorToolbarProps) {
  if (!editor) return null;

  const isSwahili = language === "sw";

  return (
    <div className="sticky top-14 z-30 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md transition-colors duration-150">
      <div className="mx-auto flex max-w-7xl w-full flex-wrap items-center justify-between gap-2 px-4 sm:px-6 lg:px-8 py-1.5">
        {/* Rich Text Controls */}
        <div className="flex flex-wrap items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition ${
              editor.isActive("bold") ? "bg-zinc-200 dark:bg-zinc-800 font-bold text-zinc-900 dark:text-zinc-100" : ""
            }`}
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition ${
              editor.isActive("italic") ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : ""
            }`}
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>

          <div className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition ${
              editor.isActive("heading", { level: 1 }) ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : ""
            }`}
            title="Heading 1"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition ${
              editor.isActive("heading", { level: 2 }) ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : ""
            }`}
            title="Heading 2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </button>

          <div className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition ${
              editor.isActive("bulletList") ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : ""
            }`}
            title="Bullet List"
          >
            <List className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition ${
              editor.isActive("orderedList") ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : ""
            }`}
            title="Numbered List"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition ${
              editor.isActive("blockquote") ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : ""
            }`}
            title="Blockquote"
          >
            <Quote className="h-3.5 w-3.5" />
          </button>

          <div className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="rounded p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 transition"
            title="Undo"
          >
            <Undo className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="rounded p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 transition"
            title="Redo"
          >
            <Redo className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* AI Controls and Parameters */}
        <div className="flex items-center gap-2">
          {/* Tone Selector */}
          <div className="flex items-center gap-1">
            <label className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline">
              {isSwahili ? "Toni:" : "Tone:"}
            </label>
            <select
              value={tone}
              onChange={(e) => onToneChange(e.target.value as "professional" | "editorial" | "conversational" | "urgent")}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-hidden"
            >
              <option value="professional">{isSwahili ? "Rasmi" : "Professional"}</option>
              <option value="editorial">{isSwahili ? "Makala" : "Editorial"}</option>
              <option value="conversational">{isSwahili ? "Mazungumzo" : "Conversational"}</option>
              <option value="urgent">{isSwahili ? "Dharura" : "Urgent"}</option>
            </select>
          </div>

          {/* Length Selector */}
          <div className="flex items-center gap-1">
            <label className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline">
              {isSwahili ? "Urefu:" : "Len:"}
            </label>
            <select
              value={length}
              onChange={(e) => onLengthChange(e.target.value as "short" | "medium" | "long")}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-hidden"
            >
              <option value="short">{isSwahili ? "Fupi" : "Short"}</option>
              <option value="medium">{isSwahili ? "Wastani" : "Medium"}</option>
              <option value="long">{isSwahili ? "Ndefu" : "Long"}</option>
            </select>
          </div>

          {/* AI Action Trigger Button */}
          <button
            type="button"
            onClick={onOpenAiDrawer}
            disabled={isStreaming}
            className="flex items-center gap-1.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 px-2.5 py-1 text-xs font-medium transition hover:opacity-90 disabled:opacity-40 shadow-2xs"
          >
            <Sparkles className="h-3 w-3" />
            <span>{isSwahili ? "Zalisha kwa AI" : "AI Assist"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
