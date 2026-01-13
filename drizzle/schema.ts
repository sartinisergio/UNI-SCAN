import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  llmProvider: mysqlEnum("llmProvider", ["manus", "openai"]).default("manus").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * API configurations per user (OpenAI, Perplexity, Claude, Dropbox)
 */
export const apiConfigs = mysqlTable("api_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", ["openai", "perplexity", "claude", "dropbox"]).notNull(),
  apiKey: text("apiKey").notNull(), // For Dropbox: access_token
  refreshToken: text("refreshToken"), // For Dropbox OAuth refresh
  tokenExpiresAt: timestamp("tokenExpiresAt"), // When the access token expires
  appKey: varchar("appKey", { length: 255 }), // For Dropbox: App Key (client_id)
  appSecret: varchar("appSecret", { length: 255 }), // For Dropbox: App Secret (client_secret)
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiConfig = typeof apiConfigs.$inferSelect;
export type InsertApiConfig = typeof apiConfigs.$inferInsert;

/**
 * Materie (subjects) supported by the system
 */
export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;

/**
 * Frameworks per materia (evaluation criteria)
 */
export const frameworks = mysqlTable("frameworks", {
  id: int("id").autoincrement().primaryKey(),
  subjectId: int("subjectId").notNull(),
  version: varchar("version", { length: 32 }).notNull(),
  content: json("content").notNull(), // JSON structure with modules and criteria
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Framework = typeof frameworks.$inferSelect;
export type InsertFramework = typeof frameworks.$inferInsert;

/**
 * Manuali (textbooks) - both Zanichelli and competitors
 */
export const manuals = mysqlTable("manuals", {
  id: int("id").autoincrement().primaryKey(),
  subjectId: int("subjectId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  author: varchar("author", { length: 500 }).notNull(),
  publisher: varchar("publisher", { length: 255 }).notNull(),
  edition: varchar("edition", { length: 32 }),
  year: int("year"),
  totalPages: int("totalPages"),
  type: mysqlEnum("type", ["zanichelli", "competitor"]).notNull(),
  indexContent: json("indexContent"), // JSON structure with chapters/sections
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Manual = typeof manuals.$inferSelect;
export type InsertManual = typeof manuals.$inferInsert;

/**
 * Valutazioni manuali (pre-generated evaluations)
 */
export const manualEvaluations = mysqlTable("manual_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  manualId: int("manualId").notNull(),
  frameworkId: int("frameworkId").notNull(),
  content: json("content").notNull(), // Full evaluation JSON
  overallScore: int("overallScore"), // 0-100
  verdict: varchar("verdict", { length: 64 }), // Eccellente, Buono, Sufficiente, Sconsigliato
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ManualEvaluation = typeof manualEvaluations.$inferSelect;
export type InsertManualEvaluation = typeof manualEvaluations.$inferInsert;

/**
 * Analyses (Scenario 1 results)
 */
export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subjectId: int("subjectId").notNull(),
  
  // Input data
  programTitle: varchar("programTitle", { length: 500 }).notNull(),
  programContent: text("programContent").notNull(), // text type, will truncate if needed
  universityName: varchar("universityName", { length: 255 }),
  professorName: varchar("professorName", { length: 255 }),
  degreeCourse: varchar("degreeCourse", { length: 255 }),
  
  // Bibliografia strutturata
  primaryManualId: int("primaryManualId"), // Manuale principale (dal database)
  primaryManualCustom: json("primaryManualCustom"), // Manuale principale custom {title, author, publisher} se non nel DB
  alternativeManuals: json("alternativeManuals"), // Array di {manualId?: number, custom?: {title, author, publisher}}
  
  // Analysis results
  contextualAnalysis: json("contextualAnalysis"), // Profilo pedagogico
  technicalAnalysis: json("technicalAnalysis"), // Copertura vs framework
  identifiedManualId: int("identifiedManualId"), // Manuale adottato identificato
  recommendedManualId: int("recommendedManualId"), // Manuale Zanichelli raccomandato
  gaps: json("gaps"), // Array of identified gaps
  postIt: json("postIt"), // Generated post-it content
  generatedEmail: json("generatedEmail"), // Generated email content
  
  // Status
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;

/**
 * Promoter profiles (for email generation)
 */
export const promoterProfiles = mysqlTable("promoter_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  email: varchar("email", { length: 320 }),
  territory: varchar("territory", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PromoterProfile = typeof promoterProfiles.$inferSelect;
export type InsertPromoterProfile = typeof promoterProfiles.$inferInsert;
