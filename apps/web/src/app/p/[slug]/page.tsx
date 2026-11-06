import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db, publications, eq } from "@inkwell/db";
import { env } from "@/env";
import {
  PublishedArticleReader,
  type ArticleData,
} from "@/components/reader/PublishedArticleReader";

interface PublishedPageProps {
  params: {
    slug: string;
  };
}

// Generate Dynamic Open Graph & Twitter Metadata
export async function generateMetadata({
  params,
}: PublishedPageProps): Promise<Metadata> {
  let publication;
  try {
    publication = await db.query.publications.findFirst({
      where: eq(publications.slug, params.slug),
    });
  } catch {
    // Database offline fallback
  }

  if (!publication && params.slug === "kilimo-bora-nakuru") {
    publication = {
      id: "pub_01",
      slug: "kilimo-bora-nakuru",
      title: "Kilimo cha Kisasa Kaunti ya Nakuru",
      excerpt:
        "Ubunifu wa kiteknolojia na kilimo cha kisasa katika kaunti za Kenya.",
      authorName: "Chris Odhiambo",
      language: "sw",
      publishedAt: new Date(),
      ogImageUrl: null,
    };
  }

  if (!publication) {
    return {
      title: "Story Not Found | Inkwell Studio",
    };
  }

  const url = `${env.NEXT_PUBLIC_APP_URL}/p/${publication.slug}`;

  return {
    title: `${publication.title} | Inkwell Studio`,
    description: publication.excerpt || publication.title,
    authors: [{ name: publication.authorName }],
    openGraph: {
      title: publication.title,
      description: publication.excerpt || publication.title,
      url,
      siteName: "Inkwell Studio",
      images: [
        {
          url:
            publication.ogImageUrl ||
            `${env.NEXT_PUBLIC_APP_URL}/og-default.png`,
          width: 1200,
          height: 630,
          alt: publication.title,
        },
      ],
      locale: publication.language === "sw" ? "sw_KE" : "en_KE",
      type: "article",
      publishedTime: publication.publishedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: publication.title,
      description: publication.excerpt || publication.title,
      creator: "@chris_nairobi",
    },
  };
}

export default async function PublishedArticlePage({
  params,
}: PublishedPageProps) {
  let publication;
  try {
    publication = await db.query.publications.findFirst({
      where: eq(publications.slug, params.slug),
    });
  } catch {
    // Database offline fallback
  }

  if (!publication) {
    if (params.slug === "kilimo-bora-nakuru") {
      publication = {
        id: "pub_synthetic_01",
        workspaceId: "ws_nairobi_01",
        documentId: "doc_nairobi_01",
        slug: "kilimo-bora-nakuru",
        title: "Kilimo cha Kisasa Kaunti ya Nakuru",
        contentHtml:
          "<h1>Kilimo cha Kisasa Kaunti ya Nakuru</h1><p>Mradi huu unalenga kuwawezesha wakulima 400 wa Kenya kupata pembejeo bora na masoko ya kidijitali.</p><blockquote>Ubunifu wa kidijitali ndio nguzo kuu ya kilimo endelevu Afrika Mashariki.</blockquote><p>Kupitia ushirikiano na serikali za kaunti, tunaleta teknolojia inayoeleweka na kuboresha mapato ya kaya.</p>",
        excerpt:
          "Ubunifu wa kiteknolojia na kilimo cha kisasa katika kaunti za Kenya.",
        authorName: "Chris Odhiambo",
        language: "sw" as const,
        publishedAt: new Date(),
        updatedAt: new Date(),
        ogImageUrl: null,
      };
    } else {
      notFound();
    }
  }

  // JSON-LD Structured Data Schema for NewsArticle / CreativeWork
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: publication.title,
    description: publication.excerpt,
    image: publication.ogImageUrl,
    datePublished: publication.publishedAt.toISOString(),
    dateModified: publication.updatedAt.toISOString(),
    inLanguage: publication.language === "sw" ? "sw-KE" : "en-KE",
    author: {
      "@type": "Person",
      name: publication.authorName,
      jobTitle: "Editor & Software Engineer",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Nairobi",
        addressCountry: "KE",
      },
    },
    publisher: {
      "@type": "Organization",
      name: "Inkwell Studio",
      url: env.NEXT_PUBLIC_APP_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${env.NEXT_PUBLIC_APP_URL}/p/${publication.slug}`,
    },
  };

  const articleData: ArticleData = {
    id: publication.id,
    slug: publication.slug,
    title: publication.title,
    titleEn:
      publication.slug === "kilimo-bora-nakuru"
        ? "Modern Agriculture in Nakuru County"
        : publication.title,
    excerpt: publication.excerpt,
    excerptEn:
      publication.slug === "kilimo-bora-nakuru"
        ? "Technological innovation and modern agricultural practices across Kenyan counties."
        : publication.excerpt,
    contentHtml: publication.contentHtml,
    contentHtmlEn:
      publication.slug === "kilimo-bora-nakuru"
        ? "<h1>Modern Agriculture in Nakuru County</h1><p>This initiative empowers 400 Kenyan farmers with quality inputs and digital market access.</p><blockquote>Digital innovation is the primary pillar for sustainable agriculture in East Africa.</blockquote><p>Through county government partnerships, we deploy accessible technology to elevate household incomes.</p>"
        : publication.contentHtml,
    authorName: publication.authorName,
    language: (publication.language as "en" | "sw") || "sw",
    publishedAt: publication.publishedAt.toISOString(),
    updatedAt: publication.updatedAt.toISOString(),
    ogImageUrl: publication.ogImageUrl,
    appUrl: env.NEXT_PUBLIC_APP_URL,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublishedArticleReader article={articleData} />
    </>
  );
}
