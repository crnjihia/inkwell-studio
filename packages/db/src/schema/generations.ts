import { pgTable, text, timestamp, uuid, varchar, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { workspaces, users } from "./users";
import { documents } from "./documents";
import { promptVersions } from "./prompts";

export const generations = pgTable("generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),
  promptVersionId: uuid("prompt_version_id")
    .notNull()
    .references(() => promptVersions.id),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  inputPrompt: text("input_prompt").notNull(),
  outputContent: text("output_content").default("").notNull(),
  modelId: varchar("model_id", { length: 128 }).notNull(), // Dynamic model string from ANTHROPIC_MODEL
  inputTokens: integer("input_tokens").default(0).notNull(),
  outputTokens: integer("output_tokens").default(0).notNull(),
  latencyMs: integer("latency_ms").default(0).notNull(),
  status: varchar("status", { length: 32 }).default("streaming").notNull(), // 'streaming' | 'completed' | 'failed' | 'cancelled'
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const generationsRelations = relations(generations, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [generations.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [generations.userId],
    references: [users.id],
  }),
  document: one(documents, {
    fields: [generations.documentId],
    references: [documents.id],
  }),
  promptVersion: one(promptVersions, {
    fields: [generations.promptVersionId],
    references: [promptVersions.id],
  }),
}));

