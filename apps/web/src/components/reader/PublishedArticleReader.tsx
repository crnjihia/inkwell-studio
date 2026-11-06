"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Share2, PenTool } from "lucide-react";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";

export interface ArticleData {
  id: string;
  slug: string;
  title: string;
  titleEn?: string;
  excerpt: string | null;
  excerptEn?: string | null;
  contentHtml: string;
  contentHtmlEn?: string;
  authorName: string;
  language: "en" | "sw";
  publishedAt: string;
  updatedAt: string;
  ogImageUrl: string | null;
  appUrl: string;
}

interface PublishedArticleReaderProps {
  article: ArticleData;
}

export function PublishedArticleReader({
  article,
}: PublishedArticleReaderProps) {
  const { language, setLanguage, isSwahili } = useLanguage();

  const title = isSwahili ? article.title : article.titleEn || article.title;
  const excerpt = isSwahili
    ? article.excerpt
    : article.excerptEn || article.excerpt;
  const contentHtml = isSwahili
    ? article.contentHtml
    : article.contentHtmlEn || article.contentHtml;

  const wordCount = contentHtml.replace(/<[^>]+>/g, " ").split(/\s+/).length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const publishedDate = new Date(article.publishedAt);
  const formattedDate = new Intl.DateTimeFormat(isSwahili ? "sw-KE" : "en-KE", {
    timeZone: "Africa/Nairobi",
    dateStyle: "long",
  }).format(publishedDate);

  const shareUrl = `${article.appUrl}/p/${article.slug}`;

  return (
    <article className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
      {/* Top Reading Navigation */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{isSwahili ? "Rudi Nyumbani" : "Home"}</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <LanguageToggle value={language} onChange={setLanguage} />
            <ThemeToggle />
            <div className="h-3 w-px bg-zinc-200 dark:border-zinc-800 mx-1" />
            <Link
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                title,
              )}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded p-1 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
              title="Share on X / Twitter"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Article Header & Typography */}
      <header className="mx-auto max-w-3xl px-4 pt-16 pb-8 sm:px-6">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight leading-tight">
          {title}
        </h1>

        {excerpt && (
          <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            {excerpt}
          </p>
        )}

        {/* Metadata Banner: Author, Date, Read Time in Nairobi Timezone */}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-y border-zinc-200 dark:border-zinc-800/80 py-3 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold flex items-center justify-center text-[10px]">
              CO
            </div>
            <span className="font-sans font-medium text-zinc-900 dark:text-zinc-200">
              {article.authorName}
            </span>
          </div>

          <span className="text-zinc-300 dark:text-zinc-700">•</span>

          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-zinc-400" />
            <time dateTime={article.publishedAt}>{formattedDate} (EAT)</time>
          </div>

          <span className="text-zinc-300 dark:text-zinc-700">•</span>

          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-zinc-400" />
            <span>
              {readTimeMin} {isSwahili ? "dakika za kusoma" : "min read"}
            </span>
          </div>
        </div>
      </header>

      {/* Article Rendered Body */}
      <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <div
          className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-zinc-700 dark:prose-p:text-zinc-300"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* Author Bio Footer */}
        <div className="mt-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs">
              <PenTool className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {isSwahili
                  ? "Imechapishwa na Inkwell Studio"
                  : "Published via Inkwell Studio"}
              </h4>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {isSwahili
                  ? "Jukwaa la kipekee la maudhui ya AI na uandishi wa kushirikiana lililoundwa Nairobi kwa ajili ya waandishi na wajasiriamali wa Afrika Mashariki."
                  : "AI content and collaborative publishing engineered in Nairobi for East African innovators."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
