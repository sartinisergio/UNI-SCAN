import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  apiConfigs, InsertApiConfig, ApiConfig,
  subjects, InsertSubject, Subject,
  frameworks, InsertFramework, Framework,
  manuals, InsertManual, Manual,
  manualEvaluations, InsertManualEvaluation, ManualEvaluation,
  analyses, InsertAnalysis, Analysis,
  promoterProfiles, InsertPromoterProfile, PromoterProfile
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USERS ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserLlmProvider(userId: number, provider: "manus" | "openai"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ llmProvider: provider }).where(eq(users.id, userId));
}

// ============ API CONFIGS ============
export async function getApiConfigsByUserId(userId: number): Promise<ApiConfig[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apiConfigs).where(eq(apiConfigs.userId, userId));
}

export async function getApiConfig(userId: number, provider: ApiConfig["provider"]): Promise<ApiConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(apiConfigs)
    .where(and(eq(apiConfigs.userId, userId), eq(apiConfigs.provider, provider), eq(apiConfigs.isActive, true)))
    .limit(1);
  return result[0];
}

export async function upsertApiConfig(config: InsertApiConfig): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select().from(apiConfigs)
    .where(and(eq(apiConfigs.userId, config.userId), eq(apiConfigs.provider, config.provider)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(apiConfigs)
      .set({ apiKey: config.apiKey, isActive: config.isActive ?? true })
      .where(eq(apiConfigs.id, existing[0].id));
  } else {
    await db.insert(apiConfigs).values(config);
  }
}

export async function deleteApiConfig(userId: number, provider: ApiConfig["provider"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(apiConfigs).where(and(eq(apiConfigs.userId, userId), eq(apiConfigs.provider, provider)));
}

export async function updateApiConfigTokens(
  userId: number,
  provider: ApiConfig["provider"],
  accessToken: string,
  expiresAt: Date,
  refreshToken?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Record<string, unknown> = {
    apiKey: accessToken,
    tokenExpiresAt: expiresAt,
  };
  
  if (refreshToken) {
    updateData.refreshToken = refreshToken;
  }
  
  await db.update(apiConfigs)
    .set(updateData)
    .where(and(eq(apiConfigs.userId, userId), eq(apiConfigs.provider, provider)));
}

export async function upsertApiConfigWithRefresh(
  userId: number,
  provider: ApiConfig["provider"],
  accessToken: string,
  refreshToken: string,
  expiresAt: Date,
  appKey?: string,
  appSecret?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select().from(apiConfigs)
    .where(and(eq(apiConfigs.userId, userId), eq(apiConfigs.provider, provider)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(apiConfigs)
      .set({ 
        apiKey: accessToken, 
        refreshToken: refreshToken,
        tokenExpiresAt: expiresAt,
        appKey: appKey || existing[0].appKey,
        appSecret: appSecret || existing[0].appSecret,
        isActive: true 
      })
      .where(eq(apiConfigs.id, existing[0].id));
  } else {
    await db.insert(apiConfigs).values({
      userId,
      provider,
      apiKey: accessToken,
      refreshToken: refreshToken,
      tokenExpiresAt: expiresAt,
      appKey: appKey || null,
      appSecret: appSecret || null,
      isActive: true,
    });
  }
}

// ============ SUBJECTS ============
export async function getAllSubjects(): Promise<Subject[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subjects).where(eq(subjects.isActive, true));
}

export async function getSubjectByCode(code: string): Promise<Subject | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subjects).where(eq(subjects.code, code)).limit(1);
  return result[0];
}

export async function getSubjectById(id: number): Promise<Subject | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
  return result[0];
}

export async function createSubject(subject: InsertSubject): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(subjects).values(subject);
  return result[0].insertId;
}

export async function updateSubject(id: number, data: Partial<InsertSubject>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(subjects).set(data).where(eq(subjects.id, id));
}

// ============ FRAMEWORKS ============
export async function getFrameworksBySubject(subjectId: number): Promise<Framework[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(frameworks)
    .where(and(eq(frameworks.subjectId, subjectId), eq(frameworks.isActive, true)))
    .orderBy(desc(frameworks.createdAt));
}

export async function getActiveFramework(subjectId: number): Promise<Framework | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(frameworks)
    .where(and(eq(frameworks.subjectId, subjectId), eq(frameworks.isActive, true)))
    .orderBy(desc(frameworks.createdAt))
    .limit(1);
  return result[0];
}

export async function createFramework(framework: InsertFramework): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(frameworks).values(framework);
  return result[0].insertId;
}

export async function updateFramework(id: number, data: Partial<InsertFramework>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(frameworks).set(data).where(eq(frameworks.id, id));
}

export async function getFrameworkById(id: number): Promise<Framework | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(frameworks).where(eq(frameworks.id, id)).limit(1);
  return result[0];
}

// ============ MANUALS ============
export async function getManualsBySubject(subjectId: number): Promise<Manual[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(manuals)
    .where(and(eq(manuals.subjectId, subjectId), eq(manuals.isActive, true)));
}

export async function getZanichelliManuals(subjectId: number): Promise<Manual[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(manuals)
    .where(and(eq(manuals.subjectId, subjectId), eq(manuals.type, "zanichelli"), eq(manuals.isActive, true)));
}

export async function getManualById(id: number): Promise<Manual | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(manuals).where(eq(manuals.id, id)).limit(1);
  return result[0];
}

export async function createManual(manual: InsertManual): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(manuals).values(manual);
  return result[0].insertId;
}

export async function updateManual(id: number, data: Partial<InsertManual>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(manuals).set(data).where(eq(manuals.id, id));
}

export async function deleteManual(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(manuals).set({ isActive: false }).where(eq(manuals.id, id));
}

// ============ MANUAL EVALUATIONS ============
export async function getEvaluationByManual(manualId: number): Promise<ManualEvaluation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(manualEvaluations)
    .where(eq(manualEvaluations.manualId, manualId))
    .orderBy(desc(manualEvaluations.generatedAt))
    .limit(1);
  return result[0];
}

export async function getEvaluationsBySubject(subjectId: number): Promise<Record<number, ManualEvaluation>> {
  const db = await getDb();
  if (!db) return {};
  
  const manualsForSubject = await getManualsBySubject(subjectId);
  const manualIds = manualsForSubject.map(m => m.id);
  
  if (manualIds.length === 0) return {};
  
  const evaluationsMap: Record<number, ManualEvaluation> = {};
  for (const manual of manualsForSubject) {
    const eval_ = await getEvaluationByManual(manual.id);
    if (eval_) {
      evaluationsMap[manual.id] = eval_;
    }
  }
  return evaluationsMap;
}

export async function createEvaluation(evaluation: InsertManualEvaluation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(manualEvaluations).values(evaluation);
  return result[0].insertId;
}

export async function updateEvaluation(id: number, data: Partial<InsertManualEvaluation>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(manualEvaluations).set(data).where(eq(manualEvaluations.id, id));
}

// ============ ANALYSES ============
export async function getAnalysesByUser(userId: number): Promise<Analysis[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(analyses)
    .where(eq(analyses.userId, userId))
    .orderBy(desc(analyses.createdAt));
}

export async function getAnalysisById(id: number): Promise<Analysis | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1);
  return result[0];
}

export async function createAnalysis(analysis: InsertAnalysis): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(analyses).values(analysis);
  return result[0].insertId;
}

export async function updateAnalysis(id: number, data: Partial<InsertAnalysis>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(analyses).set(data).where(eq(analyses.id, id));
}

export async function deleteAnalysis(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(analyses).where(eq(analyses.id, id));
}

// ============ PROMOTER PROFILES ============
export async function getPromoterProfile(userId: number): Promise<PromoterProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(promoterProfiles)
    .where(eq(promoterProfiles.userId, userId))
    .limit(1);
  return result[0];
}

export async function upsertPromoterProfile(profile: InsertPromoterProfile): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getPromoterProfile(profile.userId);
  if (existing) {
    await db.update(promoterProfiles)
      .set(profile)
      .where(eq(promoterProfiles.userId, profile.userId));
  } else {
    await db.insert(promoterProfiles).values(profile);
  }
}
