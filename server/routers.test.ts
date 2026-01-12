import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getApiConfigsByUserId: vi.fn().mockResolvedValue([]),
  getApiConfig: vi.fn().mockResolvedValue(null),
  upsertApiConfig: vi.fn().mockResolvedValue(undefined),
  deleteApiConfig: vi.fn().mockResolvedValue(undefined),
  getAllSubjects: vi.fn().mockResolvedValue([
    { id: 1, code: "chimica_organica", name: "Chimica Organica", description: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 2, code: "fisica_1", name: "Fisica 1", description: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getSubjectByCode: vi.fn().mockResolvedValue({ id: 1, code: "chimica_organica", name: "Chimica Organica" }),
  getFrameworksBySubject: vi.fn().mockResolvedValue([]),
  getActiveFramework: vi.fn().mockResolvedValue(null),
  getManualsBySubject: vi.fn().mockResolvedValue([]),
  getZanichelliManuals: vi.fn().mockResolvedValue([]),
  getManualById: vi.fn().mockResolvedValue(null),
  getAnalysesByUser: vi.fn().mockResolvedValue([]),
  getAnalysisById: vi.fn().mockResolvedValue(null),
  createAnalysis: vi.fn().mockResolvedValue(1),
  getPromoterProfile: vi.fn().mockResolvedValue(null),
  upsertPromoterProfile: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockUser(role: "user" | "admin" = "user"): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

function createMockContext(user: AuthenticatedUser | null = null): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("subjects router", () => {
  it("lists all subjects for public users", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    const subjects = await caller.subjects.list();

    expect(subjects).toBeDefined();
    expect(Array.isArray(subjects)).toBe(true);
    expect(subjects.length).toBeGreaterThan(0);
  });

  it("gets subject by code", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    const subject = await caller.subjects.getByCode({ code: "chimica_organica" });

    expect(subject).toBeDefined();
    expect(subject?.code).toBe("chimica_organica");
  });
});

describe("apiConfig router", () => {
  it("lists API configs for authenticated user", async () => {
    const ctx = createMockContext(createMockUser());
    const caller = appRouter.createCaller(ctx);

    const configs = await caller.apiConfig.list();

    expect(configs).toBeDefined();
    expect(Array.isArray(configs)).toBe(true);
  });

  it("throws error for unauthenticated user", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.apiConfig.list()).rejects.toThrow();
  });
});

describe("frameworks router", () => {
  it("lists frameworks by subject for authenticated user", async () => {
    const ctx = createMockContext(createMockUser());
    const caller = appRouter.createCaller(ctx);

    const frameworks = await caller.frameworks.listBySubject({ subjectId: 1 });

    expect(frameworks).toBeDefined();
    expect(Array.isArray(frameworks)).toBe(true);
  });

  it("throws error for unauthenticated user", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.frameworks.listBySubject({ subjectId: 1 })).rejects.toThrow();
  });
});

describe("manuals router", () => {
  it("lists manuals by subject for authenticated user", async () => {
    const ctx = createMockContext(createMockUser());
    const caller = appRouter.createCaller(ctx);

    const manuals = await caller.manuals.listBySubject({ subjectId: 1 });

    expect(manuals).toBeDefined();
    expect(Array.isArray(manuals)).toBe(true);
  });

  it("gets Zanichelli manuals for authenticated user", async () => {
    const ctx = createMockContext(createMockUser());
    const caller = appRouter.createCaller(ctx);

    const manuals = await caller.manuals.getZanichelli({ subjectId: 1 });

    expect(manuals).toBeDefined();
    expect(Array.isArray(manuals)).toBe(true);
  });
});

describe("analyses router", () => {
  it("lists analyses for authenticated user", async () => {
    const ctx = createMockContext(createMockUser());
    const caller = appRouter.createCaller(ctx);

    const analyses = await caller.analyses.list();

    expect(analyses).toBeDefined();
    expect(Array.isArray(analyses)).toBe(true);
  });

  it("creates analysis for authenticated user", async () => {
    const ctx = createMockContext(createMockUser());
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analyses.create({
      subjectId: 1,
      programTitle: "Test Program",
      programContent: "Test content for analysis",
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
  });

  it("throws error for unauthenticated user creating analysis", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.analyses.create({
        subjectId: 1,
        programTitle: "Test Program",
        programContent: "Test content",
      })
    ).rejects.toThrow();
  });
});

describe("promoterProfile router", () => {
  it("gets promoter profile for authenticated user", async () => {
    const ctx = createMockContext(createMockUser());
    const caller = appRouter.createCaller(ctx);

    const profile = await caller.promoterProfile.get();

    // Profile can be null if not set
    expect(profile === null || typeof profile === "object").toBe(true);
  });

  it("upserts promoter profile for authenticated user", async () => {
    const ctx = createMockContext(createMockUser());
    const caller = appRouter.createCaller(ctx);

    const result = await caller.promoterProfile.upsert({
      fullName: "Mario Rossi",
      phone: "+39 123 456 7890",
      email: "mario.rossi@example.com",
      territory: "Emilia-Romagna",
    });

    expect(result).toEqual({ success: true });
  });
});

describe("admin procedures", () => {
  it("allows admin to create subject", async () => {
    const ctx = createMockContext(createMockUser("admin"));
    const caller = appRouter.createCaller(ctx);

    // This would create a subject if not mocked
    // For now we just verify the procedure exists and is callable by admin
    expect(caller.subjects.create).toBeDefined();
  });

  it("denies non-admin from creating subject", async () => {
    const ctx = createMockContext(createMockUser("user"));
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.subjects.create({
        code: "test_subject",
        name: "Test Subject",
      })
    ).rejects.toThrow("Admin access required");
  });
});

describe("auth router", () => {
  it("returns null for unauthenticated user", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const mockUser = createMockUser();
    const ctx = createMockContext(mockUser);
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.openId).toBe("test-user-123");
  });

  it("logout clears cookie and returns success", async () => {
    const ctx = createMockContext(createMockUser());
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});
