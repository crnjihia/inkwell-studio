import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  integer,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { workspaces, users } from "./users";
import { generations } from "./generations";

// TimescaleDB hypertable definition
// Partitioned by `time` with index on (workspaceId, time DESC)
export const usageEvents = pgTable(
  "usage_events",
  {
    time: timestamp("time", { withTimezone: true }).defaultNow().notNull(),
    id: uuid("id").defaultRandom().notNull(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    generationId: uuid("generation_id").references(() => generations.id, {
      onDelete: "set null",
    }),
    modelId: varchar("model_id", { length: 128 }).notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    costKes: numeric("cost_kes", { precision: 10, scale: 4 }).notNull(),
    costUsd: numeric("cost_usd", { precision: 10, scale: 6 }).notNull(),
  },
  (table) => ({
    workspaceTimeIdx: index("usage_events_workspace_time_idx").on(
      table.workspaceId,
      table.time,
    ),
    timeIdx: index("usage_events_time_idx").on(table.time),
  }),
);

export const usageEventsRelations = relations(usageEvents, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [usageEvents.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [usageEvents.userId],
    references: [users.id],
  }),
  generation: one(generations, {
    fields: [usageEvents.generationId],
    references: [generations.id],
  }),
}));

// Raw SQL migration statements to execute against PostgreSQL with TimescaleDB
export const TIMESCALEDB_INIT_SQL = sql`
  -- Ensure TimescaleDB extension is active
  CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

  -- Convert table into hypertable partitioned by time if not already created
  SELECT create_hypertable('usage_events', 'time', if_not_exists => TRUE);

  -- Continuous aggregate for daily workspace token & cost rollup
  CREATE MATERIALIZED VIEW IF NOT EXISTS daily_workspace_usage
  WITH (timescaledb.continuous) AS
  SELECT
    time_bucket('1 day', time) AS bucket,
    workspace_id,
    model_id,
    SUM(input_tokens) AS total_input_tokens,
    SUM(output_tokens) AS total_output_tokens,
    SUM(cost_kes) AS total_cost_kes,
    SUM(cost_usd) AS total_cost_usd,
    COUNT(*) AS total_generations
  FROM usage_events
  GROUP BY bucket, workspace_id, model_id
  WITH NO DATA;
`;
