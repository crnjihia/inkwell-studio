import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { workspaces } from "./users";
import { documents } from "./documents";

export const publications = pgTable("publications", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  contentHtml: text("content_html").notNull(),
  contentJson: jsonb("content_json").$type<Record<string, unknown>>().notNull(),
  language: varchar("language", { length: 10 }).default("en").notNull(), // 'en' | 'sw'
  authorName: varchar("author_name", { length: 255 }).notNull(),
  ogImageUrl: text("og_image_url"),
  publishedAt: timestamp("published_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  cachePurgedAt: timestamp("cache_purged_at", { withTimezone: true }),
});

export const publicationsRelations = relations(publications, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [publications.workspaceId],
    references: [workspaces.id],
  }),
  document: one(documents, {
    fields: [publications.documentId],
    references: [documents.id],
  }),
}));
