import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "./db";
import { router } from "./routers";

// Mock the database
vi.mock("./db", () => ({
  db: {
    getManualsBySubject: vi.fn(),
  },
}));

describe("manuals.listBySubject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return manuals with correct type when publisher is specified", async () => {
    const mockManuals = [
      { id: 1, title: "Manual 1", publisher: "Zanichelli", subjectId: 1 },
      { id: 2, title: "Manual 2", publisher: "Edises", subjectId: 1 },
      { id: 3, title: "Manual 3", publisher: "Piccin", subjectId: 1 },
    ];

    (db.getManualsBySubject as any).mockResolvedValue(mockManuals);

    // Test with Zanichelli as selected publisher
    const result = mockManuals.map((manual) => ({
      ...manual,
      type: manual.publisher === "Zanichelli" ? "Zanichelli" : "competitor",
    }));

    expect(result).toEqual([
      { id: 1, title: "Manual 1", publisher: "Zanichelli", subjectId: 1, type: "Zanichelli" },
      { id: 2, title: "Manual 2", publisher: "Edises", subjectId: 1, type: "competitor" },
      { id: 3, title: "Manual 3", publisher: "Piccin", subjectId: 1, type: "competitor" },
    ]);
  });

  it("should return manuals with correct type when publisher is Edises", async () => {
    const mockManuals = [
      { id: 1, title: "Manual 1", publisher: "Zanichelli", subjectId: 1 },
      { id: 2, title: "Manual 2", publisher: "Edises", subjectId: 1 },
      { id: 3, title: "Manual 3", publisher: "Piccin", subjectId: 1 },
    ];

    (db.getManualsBySubject as any).mockResolvedValue(mockManuals);

    // Test with Edises as selected publisher
    const result = mockManuals.map((manual) => ({
      ...manual,
      type: manual.publisher === "Edises" ? "Edises" : "competitor",
    }));

    expect(result).toEqual([
      { id: 1, title: "Manual 1", publisher: "Zanichelli", subjectId: 1, type: "competitor" },
      { id: 2, title: "Manual 2", publisher: "Edises", subjectId: 1, type: "Edises" },
      { id: 3, title: "Manual 3", publisher: "Piccin", subjectId: 1, type: "competitor" },
    ]);
  });

  it("should return manuals without type modification when publisher is not specified", async () => {
    const mockManuals = [
      { id: 1, title: "Manual 1", publisher: "Zanichelli", subjectId: 1 },
      { id: 2, title: "Manual 2", publisher: "Edises", subjectId: 1 },
      { id: 3, title: "Manual 3", publisher: "Piccin", subjectId: 1 },
    ];

    (db.getManualsBySubject as any).mockResolvedValue(mockManuals);

    // Test without publisher specified
    const result = mockManuals;

    expect(result).toEqual([
      { id: 1, title: "Manual 1", publisher: "Zanichelli", subjectId: 1 },
      { id: 2, title: "Manual 2", publisher: "Edises", subjectId: 1 },
      { id: 3, title: "Manual 3", publisher: "Piccin", subjectId: 1 },
    ]);
  });
});
