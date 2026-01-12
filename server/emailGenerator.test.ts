import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM module
vi.mock("./services/llm", () => ({
  invokeLLMWithUserPreference: vi.fn(),
}));

import { invokeLLMWithUserPreference } from "./services/llm";
import { generateEmail, generateEmailFromAnalysis } from "./services/emailGenerator";

const mockInvokeLLM = vi.mocked(invokeLLMWithUserPreference);

describe("Email Generator Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateEmail", () => {
    it("should generate email with proper structure", async () => {
      const mockResponse = {
        oggetto: "Aggiornamenti per il corso di Economia Politica",
        corpo: "Gentile Prof. Rossi,\n\nSto aggiornando i docenti...",
        gap_primario: "depth_gap",
        gap_secondari: ["currency_gap"],
        note_per_promotore: "Questa email si concentra sul gap di profondità..."
      };

      mockInvokeLLM.mockResolvedValueOnce({
        content: JSON.stringify(mockResponse)
      } as any);

      const result = await generateEmail({
        userId: 1,
        analisiContestuale: { profilo_docente: { orientamento: "teorico" } },
        analisiTecnica: { gap_analysis: [] },
        gapRilevati: [{
          type: "depth_gap",
          argomento: "Microeconomia avanzata",
          importanza: "ALTA",
          descrizione: "Trattazione superficiale"
        }],
        datiPromotore: {
          nome: "Marco Bianchi",
          telefono: "+39 123456789",
          email: "marco@zanichelli.it"
        },
        titoloCorso: "Economia Politica",
        areaDisciplinare: "Economia"
      });

      expect(result).toHaveProperty("oggetto");
      expect(result).toHaveProperty("corpo");
      expect(result).toHaveProperty("gap_primario");
      expect(mockInvokeLLM).toHaveBeenCalledTimes(1);
    });

    it("should handle LLM response with markdown code blocks", async () => {
      const mockResponse = {
        oggetto: "Test oggetto",
        corpo: "Test corpo",
        gap_primario: "coverage_gap",
        gap_secondari: [],
        note_per_promotore: "Note test"
      };

      mockInvokeLLM.mockResolvedValueOnce({
        content: "```json\n" + JSON.stringify(mockResponse) + "\n```"
      } as any);

      const result = await generateEmail({
        userId: 1,
        analisiContestuale: {},
        analisiTecnica: {},
        gapRilevati: [{
          type: "coverage_gap",
          argomento: "Test",
          importanza: "MEDIA",
          descrizione: "Test"
        }],
        datiPromotore: { nome: "Test" },
        titoloCorso: "Test",
        areaDisciplinare: "Test"
      });

      expect(result.oggetto).toBe("Test oggetto");
    });

    it("should throw error when LLM fails", async () => {
      mockInvokeLLM.mockRejectedValueOnce(new Error("LLM error"));

      await expect(generateEmail({
        userId: 1,
        analisiContestuale: {},
        analisiTecnica: {},
        gapRilevati: [],
        datiPromotore: { nome: "Test" },
        titoloCorso: "Test",
        areaDisciplinare: "Test"
      })).rejects.toThrow("Errore nella generazione dell'email");
    });
  });

  describe("generateEmailFromAnalysis", () => {
    it("should extract gaps from analysis and generate email", async () => {
      const mockResponse = {
        oggetto: "Proposta per il corso",
        corpo: "Gentile Prof...",
        gap_primario: "depth_gap",
        gap_secondari: [],
        note_per_promotore: "Note"
      };

      mockInvokeLLM.mockResolvedValueOnce({
        content: JSON.stringify(mockResponse)
      } as any);

      const analysisResult = {
        analisi_contestuale: {
          profilo_docente: { orientamento: "pratico" },
          manuale_identificato: {
            titolo: "Manuale di Economia",
            autori: "Autore Test",
            anno: "2020"
          }
        },
        analisi_tecnica: {
          gap_analysis: [{
            tipo: "profondità",
            argomento: "Teoria dei giochi",
            importanza: "ALTA",
            descrizione: "Trattazione insufficiente"
          }]
        },
        sintesi_commerciale: {
          raccomandazione_manuale: {
            titolo: "Economia Moderna",
            autori: "Zanichelli",
            anno: "2024"
          }
        },
        metadata: {
          professor_name: "Prof. Rossi",
          course_name: "Economia Politica",
          subject_name: "Economia"
        }
      };

      const result = await generateEmailFromAnalysis(
        1,
        analysisResult,
        { nome: "Marco Bianchi" },
        { nomeDocente: "Rossi" }
      );

      expect(result).toHaveProperty("oggetto");
      expect(result).toHaveProperty("corpo");
      expect(mockInvokeLLM).toHaveBeenCalledTimes(1);
    });

    it("should create default gap when none found in analysis", async () => {
      const mockResponse = {
        oggetto: "Proposta",
        corpo: "Corpo email",
        gap_primario: "depth_gap",
        gap_secondari: [],
        note_per_promotore: ""
      };

      mockInvokeLLM.mockResolvedValueOnce({
        content: JSON.stringify(mockResponse)
      } as any);

      const analysisResult = {
        analisi_contestuale: {},
        analisi_tecnica: {},
        metadata: {}
      };

      const result = await generateEmailFromAnalysis(
        1,
        analysisResult,
        { nome: "Test" }
      );

      expect(result).toBeDefined();
      // Verify LLM was called with at least one gap
      const callArgs = mockInvokeLLM.mock.calls[0][1];
      expect(callArgs.messages[1].content).toContain("gapRilevati");
    });
  });
});
