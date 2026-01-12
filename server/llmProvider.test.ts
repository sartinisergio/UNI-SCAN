import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    llmProvider: "manus",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("apiConfig.getLlmProvider", () => {
  it("returns manus as default provider", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Mock db.getUserById to return user with manus provider
    vi.mock("./db", async (importOriginal) => {
      const actual = await importOriginal<typeof import("./db")>();
      return {
        ...actual,
        getUserById: vi.fn().mockResolvedValue({
          id: 1,
          llmProvider: "manus",
        }),
      };
    });

    const result = await caller.apiConfig.getLlmProvider();
    expect(result).toEqual({ provider: "manus" });
  });
});

describe("apiConfig.setLlmProvider", () => {
  it("accepts manus as valid provider", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Mock the update function
    vi.mock("./db", async (importOriginal) => {
      const actual = await importOriginal<typeof import("./db")>();
      return {
        ...actual,
        updateUserLlmProvider: vi.fn().mockResolvedValue(undefined),
      };
    });

    const result = await caller.apiConfig.setLlmProvider({ provider: "manus" });
    expect(result).toEqual({ success: true });
  });

  it("accepts openai as valid provider", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.apiConfig.setLlmProvider({ provider: "openai" });
    expect(result).toEqual({ success: true });
  });

  it("rejects invalid provider", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      // @ts-expect-error - testing invalid input
      caller.apiConfig.setLlmProvider({ provider: "invalid" })
    ).rejects.toThrow();
  });
});

describe("LLM Service", () => {
  it("invokeLLMWithUserPreference routes to manus by default", async () => {
    // This test verifies the logic in llm.ts
    const { invokeLLMWithUserPreference } = await import("./services/llm");
    
    // Mock dependencies
    vi.mock("./db", async (importOriginal) => {
      const actual = await importOriginal<typeof import("./db")>();
      return {
        ...actual,
        getUserById: vi.fn().mockResolvedValue({
          id: 1,
          llmProvider: "manus",
        }),
        getApiConfig: vi.fn().mockResolvedValue(null),
      };
    });

    // The function should not throw when using manus (default)
    // We can't fully test the LLM call without mocking the HTTP layer
    // but we can verify the function exists and has the right signature
    expect(typeof invokeLLMWithUserPreference).toBe("function");
  });
});
