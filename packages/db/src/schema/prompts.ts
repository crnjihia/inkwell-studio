import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { workspaces, users } from "./users";

export const prompts = pgTable("prompts", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  contentType: varchar("content_type", { length: 32 }).notNull(), // 'blog' | 'social' | 'grant_proposal'
  language: varchar("language", { length: 10 }).default("en").notNull(), // 'en' | 'sw'
  activeVersionId: uuid("active_version_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Immutable prompt versions table: updates create a new version row
export const promptVersions = pgTable("prompt_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  promptId: uuid("prompt_id")
    .notNull()
    .references(() => prompts.id, { onDelete: "cascade" }),
  versionNumber: varchar("version_number", { length: 32 }).notNull(), // semver format e.g. "1.0.0", "1.1.0"
  versionCounter: integer("version_counter").notNull(), // sequential integer counter: 1, 2, 3
  systemPrompt: text("system_prompt").notNull(),
  userPromptTemplate: text("user_prompt_template").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  changeSummary: text("change_summary").notNull(), // Audit log entry for why this version was published
  createdById: varchar("created_by_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [prompts.workspaceId],
    references: [workspaces.id],
  }),
  versions: many(promptVersions),
}));

export const promptVersionsRelations = relations(promptVersions, ({ one }) => ({
  prompt: one(prompts, {
    fields: [promptVersions.promptId],
    references: [prompts.id],
  }),
  author: one(users, {
    fields: [promptVersions.createdById],
    references: [users.id],
  }),
}));
