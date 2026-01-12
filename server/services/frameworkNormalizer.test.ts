import { describe, it, expect } from "vitest";
import {
  normalizeFramework,
  extractModules,
  isValidFramework,
  getFrameworkFormat,
} from "./frameworkNormalizer";

describe("frameworkNormalizer", () => {
  describe("normalizeFramework", () => {
    it("should normalize framework with 'modules' field (Chimica Generale format)", () => {
      const framework = {
        modules: [
          { id: 1, nome: "Modulo 1", argomenti: ["argomento1", "argomento2"] },
          { id: 2, nome: "Modulo 2", argomenti: ["argomento3"] },
        ],
        classes_analyzed: ["L-13"],
      };

      const normalized = normalizeFramework(framework);

      expect(normalized.modules).toHaveLength(2);
      expect(normalized.modules[0].nome).toBe("Modulo 1");
      expect(normalized.modules[0].argomenti).toEqual(["argomento1", "argomento2"]);
      expect(normalized.classes_analyzed).toEqual(["L-13"]);
    });

    it("should normalize framework with 'syllabus_modules' field (Istologia format)", () => {
      const framework = {
        syllabus_modules: [
          {
            id: 1,
            name: "Modulo 1",
            matched_concepts: [
              { name: "concetto1", frequency: 10 },
              { name: "concetto2", frequency: 5 },
            ],
            coverage_percentage: 85,
          },
          {
            id: 2,
            name: "Modulo 2",
            matched_concepts: [{ name: "concetto3", frequency: 8 }],
            coverage_percentage: 90,
          },
        ],
        classes_analyzed: ["LM-41"],
      };

      const normalized = normalizeFramework(framework);

      expect(normalized.modules).toHaveLength(2);
      expect(normalized.modules[0].nome).toBe("Modulo 1");
      expect(normalized.modules[0].argomenti).toEqual(["concetto1", "concetto2"]);
      expect(normalized.modules[0].coverage_percentage).toBe(85);
      expect(normalized.classes_analyzed).toEqual(["LM-41"]);
    });

    it("should normalize framework with 'moduli' field (generic format)", () => {
      const framework = {
        moduli: [
          { id: 1, nome: "Modulo 1", argomenti: ["argomento1"] },
          { id: 2, nome: "Modulo 2", argomenti: ["argomento2"] },
        ],
      };

      const normalized = normalizeFramework(framework);

      expect(normalized.modules).toHaveLength(2);
      expect(normalized.modules[0].nome).toBe("Modulo 1");
    });

    it("should handle framework with chapters field", () => {
      const framework = {
        chapters: [
          { id: 1, title: "Chapter 1", topics: ["topic1", "topic2"] },
          { id: 2, title: "Chapter 2", topics: ["topic3"] },
        ],
      };

      const normalized = normalizeFramework(framework);

      expect(normalized.modules).toHaveLength(2);
      expect(normalized.modules[0].nome).toBe("Chapter 1");
      expect(normalized.modules[0].argomenti).toEqual(["topic1", "topic2"]);
    });

    it("should return empty modules array for invalid framework", () => {
      const normalized = normalizeFramework(null);
      expect(normalized.modules).toHaveLength(0);

      const normalized2 = normalizeFramework({});
      expect(normalized2.modules).toHaveLength(0);

      const normalized3 = normalizeFramework("invalid");
      expect(normalized3.modules).toHaveLength(0);
    });

    it("should preserve additional framework fields", () => {
      const framework = {
        modules: [{ id: 1, nome: "Modulo 1", argomenti: ["arg1"] }],
        name: "Framework Name",
        description: "Framework Description",
        version: "1.0",
      };

      const normalized = normalizeFramework(framework);

      expect(normalized.name).toBe("Framework Name");
      expect(normalized.description).toBe("Framework Description");
      expect(normalized.version).toBe("1.0");
    });
  });

  describe("extractModules", () => {
    it("should extract modules from framework with modules field", () => {
      const framework = {
        modules: [
          { id: 1, nome: "Modulo 1", argomenti: ["arg1"] },
          { id: 2, nome: "Modulo 2", argomenti: ["arg2"] },
        ],
      };

      const modules = extractModules(framework);

      expect(modules).toHaveLength(2);
      expect(modules[0].nome).toBe("Modulo 1");
    });

    it("should extract modules from framework with syllabus_modules field", () => {
      const framework = {
        syllabus_modules: [
          {
            id: 1,
            name: "Modulo 1",
            matched_concepts: [{ name: "concetto1" }],
          },
        ],
      };

      const modules = extractModules(framework);

      expect(modules).toHaveLength(1);
      expect(modules[0].argomenti).toEqual(["concetto1"]);
    });

    it("should return empty array for invalid framework", () => {
      const modules = extractModules(null);
      expect(modules).toHaveLength(0);

      const modules2 = extractModules({});
      expect(modules2).toHaveLength(0);
    });
  });

  describe("isValidFramework", () => {
    it("should return true for valid framework", () => {
      const framework = {
        modules: [{ id: 1, nome: "Modulo 1", argomenti: ["arg1"] }],
      };

      expect(isValidFramework(framework)).toBe(true);
    });

    it("should return false for invalid framework", () => {
      expect(isValidFramework(null)).toBe(false);
      expect(isValidFramework({})).toBe(false);
      expect(isValidFramework({ modules: [] })).toBe(false);
    });
  });

  describe("getFrameworkFormat", () => {
    it("should detect 'modules' format", () => {
      const framework = {
        modules: [{ id: 1, nome: "Modulo 1", argomenti: [] }],
      };

      expect(getFrameworkFormat(framework)).toBe("modules");
    });

    it("should detect 'syllabus_modules' format", () => {
      const framework = {
        syllabus_modules: [{ id: 1, name: "Modulo 1" }],
      };

      expect(getFrameworkFormat(framework)).toBe("syllabus_modules");
    });

    it("should detect 'moduli' format", () => {
      const framework = {
        moduli: [{ id: 1, nome: "Modulo 1", argomenti: [] }],
      };

      expect(getFrameworkFormat(framework)).toBe("moduli");
    });

    it("should detect 'chapters' format", () => {
      const framework = {
        chapters: [{ id: 1, title: "Chapter 1" }],
      };

      expect(getFrameworkFormat(framework)).toBe("chapters");
    });

    it("should return 'unknown' for unrecognized format", () => {
      expect(getFrameworkFormat({})).toBe("unknown");
      expect(getFrameworkFormat(null)).toBe("invalid");
      expect(getFrameworkFormat("invalid")).toBe("invalid");
    });
  });

  describe("edge cases", () => {
    it("should handle modules with missing fields", () => {
      const framework = {
        modules: [
          { id: 1 }, // Missing nome and argomenti
          { nome: "Modulo 2" }, // Missing id and argomenti
          { argomenti: ["arg1"] }, // Missing id and nome
        ],
      };

      const normalized = normalizeFramework(framework);

      expect(normalized.modules).toHaveLength(3);
      expect(normalized.modules[0].nome).toBe("Modulo 1"); // Generated default
      expect(normalized.modules[0].argomenti).toEqual([]);
      expect(normalized.modules[1].id).toBe(2); // Generated default
      expect(normalized.modules[2].nome).toBe("Modulo 3"); // Generated default
    });

    it("should handle syllabus_modules with matched_concepts", () => {
      const framework = {
        syllabus_modules: [
          {
            id: 1,
            name: "Modulo 1",
            matched_concepts: [
              { name: "concetto1", frequency: 10 },
              { name: "concetto2", frequency: 5 },
            ],
          },
        ],
      };

      const modules = extractModules(framework);

      expect(modules[0].argomenti).toEqual(["concetto1", "concetto2"]);
      expect(modules[0].matched_concepts).toBeDefined();
      expect(modules[0].matched_concepts).toHaveLength(2);
    });

    it("should handle framework with nested structure", () => {
      const framework = {
        metadata: { version: "1.0" },
        modules: [
          {
            id: 1,
            nome: "Modulo 1",
            argomenti: ["arg1"],
            class_data: {
              "L-13": { coverage: 100, status: "eccellente" },
            },
          },
        ],
      };

      const normalized = normalizeFramework(framework);

      expect(normalized.modules[0].class_data).toBeDefined();
      expect(normalized.modules[0].class_data["L-13"]).toEqual({
        coverage: 100,
        status: "eccellente",
      });
    });
  });
});
