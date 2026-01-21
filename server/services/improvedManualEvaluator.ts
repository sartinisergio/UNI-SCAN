/**
 * Improved manual evaluator with two-phase approach:
 * Phase 1: Evaluate manual against framework
 * Phase 2: Evaluate degree compatibility
 */

import { invokeLLM } from "../_core/llm";

export interface ImprovedEvaluationResult {
  overview: string;
  strengths: Array<{ title: string; explanation: string }>;
  weaknesses: Array<{ title: string; explanation: string }>;
  moduleByModuleAnalysis: Array<{ moduleName: string; coverage: number; explanation: string }>;
  degreeCompatibility: Array<{
    degreeProgram: string;
    compatible: "Ideale" | "Buono" | "Parziale" | "Non consigliato";
    reasoning: string;
    criticalModules: string[];
    gaps: string[];
    recommendations: string;
  }>;
  overallScore: number;
  verdict: "Eccellente" | "Buono" | "Sufficiente" | "Sconsigliato";
  executiveSummary: string;
}

// Extract modules from framework
function extractModules(framework: any) {
  if (!framework) return [];
  
  const content = framework.content || framework;
  
  if (content.content?.syllabus_modules) {
    return content.content.syllabus_modules;
  } else if (content.syllabus_modules) {
    return content.content.syllabus_modules;
  }
  
  return [];
}

function getPhase1JsonSchema() {
  return {
    type: "object",
    properties: {
      overview: { type: "string" },
      strengths: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            explanation: { type: "string" }
          },
          required: ["title", "explanation"],
          additionalProperties: false
        }
      },
      weaknesses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            explanation: { type: "string" }
          },
          required: ["title", "explanation"],
          additionalProperties: false
        }
      },
      moduleByModuleAnalysis: {
        type: "array",
        items: {
          type: "object",
          properties: {
            moduleName: { type: "string" },
            coverage: { type: "integer", minimum: 0, maximum: 100 },
            explanation: { type: "string" }
          },
          required: ["moduleName", "coverage", "explanation"],
          additionalProperties: false
        }
      },
      overallScore: { type: "integer", minimum: 0, maximum: 100 },
      verdict: { type: "string", enum: ["Eccellente", "Buono", "Sufficiente", "Sconsigliato"] }
    },
    required: ["overview", "strengths", "weaknesses", "moduleByModuleAnalysis", "overallScore", "verdict"],
    additionalProperties: false
  };
}

function getPhase2JsonSchema() {
  return {
    type: "object",
    properties: {
      degreeCompatibility: {
        type: "array",
        items: {
          type: "object",
          properties: {
            degreeProgram: { type: "string" },
            compatible: { type: "string", enum: ["Ideale", "Buono", "Parziale", "Non consigliato"] },
            reasoning: { type: "string" },
            criticalModules: { type: "array", items: { type: "string" } },
            gaps: { type: "array", items: { type: "string" } },
            recommendations: { type: "string" }
          },
          required: ["degreeProgram", "compatible", "reasoning", "criticalModules", "gaps", "recommendations"],
          additionalProperties: false
        }
      }
    },
    required: ["degreeCompatibility"],
    additionalProperties: false
  };
}

async function phase1Evaluation(
  framework: any,
  manual: any,
  subjectName: string
) {
  const frameworkModules = extractModules(framework);
  const modulesList = frameworkModules.map((m: any) => m.nome || m.name || m.title).join("\n");

  const prompt = `Valuta il manuale "${manual.title}" di ${manual.author} (${manual.publisher}) per la materia ${subjectName}.

FRAMEWORK MODULI (${frameworkModules.length} totali):
${modulesList}

INDICE DEL MANUALE:
${JSON.stringify(manual.index || manual.indexContent || {}, null, 2)}

GENERA UNA VALUTAZIONE CON:

1. overview: 2-3 paragrafi su approccio didattico, pubblico target, profondità
2. strengths: array di 3+ punti di forza (titolo + spiegazione 2-3 frasi)
3. weaknesses: array di 3+ punti di debolezza (titolo + spiegazione 2-3 frasi)
4. moduleByModuleAnalysis: ARRAY con TUTTI i ${frameworkModules.length} moduli
   - Ogni modulo: { moduleName, coverage (0-100), explanation (2-3 frasi) }
5. overallScore: 0-100
6. verdict: Eccellente/Buono/Sufficiente/Sconsigliato

VINCOLI:
- moduleByModuleAnalysis DEVE avere ESATTAMENTE ${frameworkModules.length} elementi
- Sii esplicativo e specifico con esempi concreti
- Non inventare moduli non nel framework
- La valutazione si basa SOLO sulla copertura dei moduli del framework

RISPONDI ESCLUSIVAMENTE CON JSON VALIDO.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Sei un valutatore esperto di manuali universitari. Valuta TUTTI i moduli forniti. Rispondi sempre e solo con JSON valido." } as any,
      { role: "user", content: prompt } as any
    ],
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "manual_evaluation_phase1",
        strict: true,
        schema: getPhase1JsonSchema()
      }
    }
  });

  return JSON.parse(response.choices[0].message.content as string);
}

async function phase2Evaluation(
  framework: any,
  manual: any,
  phase1Result: any,
  subjectName: string
) {
  const content = framework.content || framework;
  let degreesToEvaluate: string[] = [];
  if (content.content?.target_degrees) {
    degreesToEvaluate = content.content.target_degrees;
  } else if (content.target_degrees) {
    degreesToEvaluate = content.target_degrees;
  }

  const degreesList = degreesToEvaluate.join("\n");
  const modulesSummary = phase1Result.moduleByModuleAnalysis
    .map((m: any) => `- ${m.moduleName} (${m.coverage}%)`)
    .join("\n");

  const prompt = `Valuta la compatibilità del manuale "${manual.title}" per le seguenti classi di laurea.

MANUALE: ${manual.title} di ${manual.author}
MATERIA: ${subjectName}

ANALISI MODULI (dal primo step):
${modulesSummary}

PUNTI DI FORZA DEL MANUALE:
${phase1Result.strengths.map((s: any) => `- ${s.title}: ${s.explanation}`).join("\n")}

PUNTI DI DEBOLEZZA DEL MANUALE:
${phase1Result.weaknesses.map((w: any) => `- ${w.title}: ${w.explanation}`).join("\n")}

CLASSI DI LAUREA DA VALUTARE (${degreesToEvaluate.length} totali):
${degreesList}

PER OGNI CLASSE DI LAUREA, GENERA:
- degreeProgram: nome della classe
- compatible: Ideale/Buono/Parziale/Non consigliato (basato SOLO sulla copertura dei moduli)
- reasoning: 3-4 frasi che spiegano il giudizio
- criticalModules: array dei moduli più importanti per questa classe
- gaps: array dei moduli del framework scarsamente coperti (SOLO moduli del framework)
- recommendations: 2-3 frasi su come usare il manuale per questa classe

VINCOLI RIGOROSI:
- degreeCompatibility DEVE avere ESATTAMENTE ${degreesToEvaluate.length} elementi
- Valuta TUTTE le classi, non saltarne nessuna
- La compatibilità si basa SOLO sulla copertura dei moduli del framework
- Non inventare moduli non nel framework
- Non fare assunzioni su insegnamenti successivi/precedenti
- I gap devono riguardare SOLO moduli del framework scarsamente coperti

RISPONDI ESCLUSIVAMENTE CON JSON VALIDO.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Sei un valutatore esperto di manuali universitari. Valuta TUTTE le classi di laurea fornite. Rispondi sempre e solo con JSON valido." } as any,
      { role: "user", content: prompt } as any
    ],
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "manual_evaluation_phase2",
        strict: true,
        schema: getPhase2JsonSchema()
      }
    }
  });

  return JSON.parse(response.choices[0].message.content as string);
}

export async function generateImprovedManualEvaluation(
  userId: number | string,
  framework: any,
  manual: any,
  subjectName: string = "Materia non specificata"
): Promise<ImprovedEvaluationResult> {
  
  // Phase 1: Evaluate manual against framework
  const phase1 = await phase1Evaluation(framework, manual, subjectName);
  
  // Phase 2: Evaluate degree compatibility
  const phase2 = await phase2Evaluation(framework, manual, phase1, subjectName);
  
  // Generate executive summary
  const executiveSummary = `${manual.title} di ${manual.author} è un manuale ${phase1.verdict.toLowerCase()} per ${subjectName}. ` +
    `Con un punteggio di ${phase1.overallScore}/100, il manuale eccelle in ${phase1.strengths[0]?.title.toLowerCase() || "qualità didattica"} ` +
    `ma presenta limitazioni in ${phase1.weaknesses[0]?.title.toLowerCase() || "alcuni aspetti"}. ` +
    `È particolarmente adatto per ${phase2.degreeCompatibility.find((d: any) => d.compatible === "Ideale")?.degreeProgram || "studenti specializzati"}.`;

  return {
    overview: phase1.overview,
    strengths: phase1.strengths,
    weaknesses: phase1.weaknesses,
    moduleByModuleAnalysis: phase1.moduleByModuleAnalysis,
    degreeCompatibility: phase2.degreeCompatibility,
    overallScore: phase1.overallScore,
    verdict: phase1.verdict,
    executiveSummary: executiveSummary
  };
}
