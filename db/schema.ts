import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  numeric,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pools = pgTable("pools", {
  id: uuid("id").defaultRandom().primaryKey(),

  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  poolType: text("pool_type").notNull(),
  description: text("description"),
  rules: text("rules"),

  isPublished: boolean("is_published").default(false).notNull(),
  status: text("status").default("draft").notNull(),

  entryFee: numeric("entry_fee", { precision: 10, scale: 2 }),
  maxEntriesPerUser: integer("max_entries_per_user").default(1).notNull(),

  entryOpenAt: timestamp("entry_open_at"),
  entryDeadlineAt: timestamp("entry_deadline_at"),

  scoringSettings: jsonb("scoring_settings").default({}).notNull(),
  tiebreakerSettings: jsonb("tiebreaker_settings").default({}).notNull(),

  winnerEntryId: uuid("winner_entry_id"),
  winnerName: text("winner_name"),
  completedAt: timestamp("completed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const poolPeriods = pgTable("pool_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  poolId: uuid("pool_id")
    .references(() => pools.id)
    .notNull(),

  name: text("name").notNull(),
  periodKey: text("period_key").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),

  startsAt: timestamp("starts_at"),
  locksAt: timestamp("locks_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const poolAnnouncements = pgTable("pool_announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  poolId: uuid("pool_id")
    .references(() => pools.id)
    .notNull(),

  title: text("title").notNull(),
  body: text("body").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const entries = pgTable("entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  poolId: uuid("pool_id")
    .references(() => pools.id)
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),

  participantName: text("participant_name").notNull(),
  entryName: text("entry_name").notNull(),

  isPaid: boolean("is_paid").default(false).notNull(),
  isLocked: boolean("is_locked").default(false).notNull(),

  currentScore: numeric("current_score", { precision: 10, scale: 2 }),
  currentRank: integer("current_rank"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pickGroups = pgTable("pick_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  poolId: uuid("pool_id")
    .references(() => pools.id)
    .notNull(),

  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  minPicks: integer("min_picks").default(0).notNull(),
  maxPicks: integer("max_picks").default(1).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pickOptions = pgTable("pick_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  poolId: uuid("pool_id")
    .references(() => pools.id)
    .notNull(),
  groupId: uuid("group_id").references(() => pickGroups.id),

  name: text("name").notNull(),
  displayName: text("display_name"),
  sourceId: text("source_id"),
  sourceName: text("source_name"),

  metadata: jsonb("metadata").default({}).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const entryPicks = pgTable("entry_picks", {
  id: uuid("id").defaultRandom().primaryKey(),
  entryId: uuid("entry_id")
    .references(() => entries.id)
    .notNull(),
  poolId: uuid("pool_id")
    .references(() => pools.id)
    .notNull(),
  periodId: uuid("period_id").references(() => poolPeriods.id),
  pickOptionId: uuid("pick_option_id")
    .references(() => pickOptions.id)
    .notNull(),

  pickValue: text("pick_value"),
  metadata: jsonb("metadata").default({}).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leaderboardSources = pgTable("leaderboard_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  poolId: uuid("pool_id")
    .references(() => pools.id)
    .notNull(),

  sourceType: text("source_type").notNull(),
  sourceUrl: text("source_url").notNull(),
  isActive: boolean("is_active").default(true).notNull(),

  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leaderboardResults = pgTable("leaderboard_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  poolId: uuid("pool_id")
    .references(() => pools.id)
    .notNull(),
  pickOptionId: uuid("pick_option_id").references(() => pickOptions.id),

  sourceId: text("source_id"),
  name: text("name").notNull(),

  position: integer("position"),
  displayPosition: text("display_position"),
  status: text("status"),
  scoreValue: numeric("score_value", { precision: 10, scale: 2 }),

  metadata: jsonb("metadata").default({}).notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payoutRules = pgTable("payout_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  poolId: uuid("pool_id")
    .references(() => pools.id)
    .notNull(),

  place: integer("place").notNull(),
  payoutPercent: numeric("payout_percent", { precision: 5, scale: 2 }),
  payoutAmount: numeric("payout_amount", { precision: 10, scale: 2 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});