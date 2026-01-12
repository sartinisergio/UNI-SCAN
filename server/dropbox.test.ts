import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock per testare la struttura delle cartelle Dropbox
describe("Dropbox Integration", () => {
  it("getFolderStructure returns proper structure when Dropbox is not configured", async () => {
    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "test-user",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: vi.fn(),
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    
    // Questo test verifica che la procedura gestisca correttamente
    // il caso in cui Dropbox non è configurato
    const result = await caller.dropbox.getFolderStructure();
    
    // Dovrebbe restituire un errore o una struttura vuota
    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });
});
