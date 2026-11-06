import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { workspaces, users } from "./users";

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(), // TipTap ProseMirror doc JSON
  currentVersion: integer("current_version").default(1).notNull(),
  language: varchar("language", { length: 10 }).default("en").notNull(), // 'en' | 'sw'
  contentType: varchar("content_type", { length: 32 })
    .default("blog")
    .notNull(), // 'blog' | 'social' | 'grant_proposal'
  createdById: varchar("created_by_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const documentVersions = pgTable("document_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  createdById: varchar("created_by_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const documentsRelations = relations(documents, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [documents.workspaceId],
    references: [workspaces.id],
  }),
  author: one(users, {
    fields: [documents.createdById],
    references: [users.id],
  }),
  versions: many(documentVersions),
}));

export const documentVersionsRelations = relations(
  documentVersions,
  ({ one }) => ({
    document: one(documents, {
      fields: [documentVersions.documentId],
      references: [documents.id],
    }),
    author: one(users, {
      fields: [documentVersions.createdById],
      references: [users.id],
    }),
  }),
);
