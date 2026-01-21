/**
 * Metrics Extractor - Extracts concrete, quantifiable metrics from manual indices
 * Provides data-driven evaluation instead of subjective assessments
 */

import { invokeLLMWithUserPreference } from "./llm";

export interface ManualMetrics {
  // Exercise metrics
  totalExercises: number;
  exercisesPerModule: Record<string, number>;
  exercisesWithSolutions: number;
  exercisesDifficulty: {
    basic: number;
    intermediate: number;
    advanced: number;
  };

  // Content metrics
  totalPages: number;
  pagesPerModule: Record<string, number>;
  estimatedExamplesPerModule: Record<string, number>;

  // Coverage metrics
  modulesWithDedicatedChapters: string[];
  modulesWithPartialCoverage: string[];
  modulesNotCovered: string[];

  // Quality indicators
  hasAnswerKey: boolean;
  hasPracticeSections: boolean;
  hasCaseStudies: boolean;
  hasRealWorldApplications: boolean;
  hasVisualAids: boolean;

  // Structure metrics
  averageChapterLength: number;
  numberOfAppendices: number;
  hasIndex: boolean;
  hasBibliography: boolean;

  // Specific observations
  observations: string[];
}

interface MetricsExtractionResult {
  metrics: ManualMetrics;
  confidence: number; // 0-100, how confident the extraction is
  notes: string;
}

function getMetricsExtractionSchema() {
  return {
    type: "object",
    properties: {
      metrics: {
        type: "object",
        properties: {
          totalExercises: { type: "integer" },
          exercisesPerModule: {
            type: "object",
            additionalProperties: { type: "integer" }
          },
          exercisesWithSolutions: { type: "integer" },
          exercisesDifficulty: {
            type: "object",
            properties: {
              basic: { type: "integer" },
              intermediate: { type: "integer" },
              advanced: { type: "integer" }
            },
            required: ["basic", "intermediate", "advanced"],
            additionalProperties: false
          },
          totalPages: { type: "integer" },
          pagesPerModule: {
            type: "object",
            additionalProperties: { type: "integer" }
          },
          estimatedExamplesPerModule: {
            type: "object",
            additionalProperties: { type: "integer" }
          },
          modulesWithDedicatedChapters: { type: "array", items: { type: "string" } },
          modulesWithPartialCoverage: { type: "array", items: { type: "string" } },
          modulesNotCovered: { type: "array", items: { type: "string" } },
          hasAnswerKey: { type: "boolean" },
          hasPracticeSections: { type: "boolean" },
          hasCaseStudies: { type: "boolean" },
          hasRealWorldApplications: { type: "boolean" },
          hasVisualAids: { type: "boolean" },
          averageChapterLength: { type: "number" },
          numberOfAppendices: { type: "integer" },
          hasIndex: { type: "boolean" },
          hasBibliography: { type: "boolean" },
          observations: { type: "array", items: { type: "string" } }
        },
        required: [
          "totalExercises",
          "exercisesPerModule",
          "exercisesWithSolutions",
          "exercisesDifficulty",
          "totalPages",
          "pagesPerModule",
          "estimatedExamplesPerModule",
          "modulesWithDedicatedChapters",
          "modulesWithPartialCoverage",
          "modulesNotCovered",
          "hasAnswerKey",
          "hasPracticeSections",
          "hasCaseStudies",
          "hasRealWorldApplications",
          "hasVisualAids",
          "averageChapterLength",
          "numberOfAppendices",
          "hasIndex",
          "hasBibliography",
          "observations"
        ],
        additionalProperties: false
      },
      confidence: { type: "integer", minimum: 0, maximum: 100 },
      notes: { type: "string" }
    },
    required: ["metrics", "confidence", "notes"],
    additionalProperties: false
  };
}

export async function extractManualMetrics(
  userId: number,
  manual: { title: string; author: string; publisher: string },
  indexContent: any,
  frameworkModules: Array<{ nome: string; argomenti: string[] }>,
  subjectName: string
): Promise<MetricsExtractionResult> {
  
  const moduleNames = frameworkModules.map(m => m.nome);

  const prompt = `Sei un esperto di analisi di manuali universitari. Il tuo compito è ESTRARRE DATI CONCRETI e QUANTITATIVI dall'indice del manuale fornito.

MANUALE:
- Titolo: ${manual.title}
- Autore: ${manual.author}
- Editore: ${manual.publisher}
- Materia: ${subjectName}

INDICE DEL MANUALE:
${JSON.stringify(indexContent, null, 2)}

MODULI DEL FRAMEWORK (per cui devi valutare la copertura):
${moduleNames.map((m, i) => `${i + 1}. ${m}`).join('\n')}

COMPITO: Analizza l'indice e ESTRAI i seguenti dati CONCRETI:

1. ESERCIZI:
   - Conta il numero TOTALE di esercizi visibili nell'indice
   - Per ogni modulo del framework, stima quanti esercizi riguardano quel modulo
   - Conta quanti esercizi hanno soluzioni (se visibile nell'indice)
   - Classifica gli esercizi per difficoltà (base/intermedio/avanzato) se possibile

2. CONTENUTI:
   - Stima il numero totale di pagine (se visibile)
   - Per ogni modulo, stima quante pagine sono dedicate
   - Conta il numero di esempi/case studies/applicazioni pratiche per modulo

3. COPERTURA:
   - Quali moduli del framework hanno capitoli DEDICATI?
   - Quali moduli sono trattati PARZIALMENTE (in capitoli condivisi)?
   - Quali moduli NON SONO COPERTI?

4. QUALITÀ STRUTTURALE:
   - Il manuale ha un answer key/soluzioni?
   - Ha sezioni di pratica/esercitazione?
   - Ha case studies o esempi reali?
   - Ha applicazioni nel mondo reale?
   - Ha ausili visivi (diagrammi, grafici, illustrazioni)?
   - Ha indice analitico?
   - Ha bibliografia?
   - Quanti appendici?

5. OSSERVAZIONI:
   - Nota qualsiasi cosa di rilevante (es: "Molti esercizi sono teorici, pochi applicativi")
   - Identifica punti di forza e debolezza strutturali

IMPORTANTE:
- Sii CONSERVATORE: se non vedi chiaramente un dato nell'indice, non indovinare
- Usa 0 se non puoi determinare un numero
- Fornisci un "confidence" score (0-100) che riflette quanto sei sicuro dei tuoi dati

RISPONDI ESCLUSIVAMENTE con JSON valido:
{
  "metrics": {
    "totalExercises": 450,
    "exercisesPerModule": {
      "Modulo 1": 40,
      "Modulo 2": 35
    },
    "exercisesWithSolutions": 200,
    "exercisesDifficulty": {
      "basic": 150,
      "intermediate": 200,
      "advanced": 100
    },
    "totalPages": 800,
    "pagesPerModule": {
      "Modulo 1": 80,
      "Modulo 2": 70
    },
    "estimatedExamplesPerModule": {
      "Modulo 1": 15,
      "Modulo 2": 12
    },
    "modulesWithDedicatedChapters": ["Modulo 1", "Modulo 2"],
    "modulesWithPartialCoverage": ["Modulo 3"],
    "modulesNotCovered": [],
    "hasAnswerKey": true,
    "hasPracticeSections": true,
    "hasCaseStudies": true,
    "hasRealWorldApplications": true,
    "hasVisualAids": true,
    "averageChapterLength": 50,
    "numberOfAppendices": 3,
    "hasIndex": true,
    "hasBibliography": true,
    "observations": [
      "Esercizi ben distribuiti con progressione di difficoltà",
      "Molti esempi pratici di applicazioni industriali"
    ]
  },
  "confidence": 85,
  "notes": "Dati estratti principalmente dall'indice. Alcuni numeri sono stime basate sulla struttura visibile."
}`;

  const systemMessage = `Sei un analista di manuali universitari. Il tuo compito è ESTRARRE DATI CONCRETI E QUANTITATIVI dall'indice.
Non fare valutazioni soggettive. Fornisci solo dati misurabili o facilmente verificabili.
Se non puoi determinare un dato, usa 0 e nota la tua incertezza nel campo "notes".
Rispondi sempre e solo con JSON valido.`;

  const response = await invokeLLMWithUserPreference(userId, {
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt }
    ],
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "manual_metrics_extraction",
        strict: true,
        schema: getMetricsExtractionSchema()
      }
    }
  });

  const content = response.content;
  if (!content) {
    throw new Error("Nessuna risposta dal modello LLM");
  }
  
  return JSON.parse(content) as MetricsExtractionResult;
}

/**
 * Calculate a quality score based on metrics
 */
export function calculateQualityScore(metrics: ManualMetrics): number {
  let score = 0;
  let maxScore = 0;

  // Exercise quality (max 30 points)
  maxScore += 30;
  if (metrics.totalExercises > 300) score += 30;
  else if (metrics.totalExercises > 200) score += 25;
  else if (metrics.totalExercises > 100) score += 20;
  else if (metrics.totalExercises > 50) score += 10;

  // Solutions availability (max 15 points)
  maxScore += 15;
  const solutionRatio = metrics.totalExercises > 0 
    ? metrics.exercisesWithSolutions / metrics.totalExercises 
    : 0;
  if (solutionRatio > 0.7) score += 15;
  else if (solutionRatio > 0.5) score += 12;
  else if (solutionRatio > 0.3) score += 8;
  else if (solutionRatio > 0) score += 4;

  // Exercise difficulty distribution (max 15 points)
  maxScore += 15;
  const total = metrics.exercisesDifficulty.basic + 
                metrics.exercisesDifficulty.intermediate + 
                metrics.exercisesDifficulty.advanced;
  if (total > 0) {
    const hasBasic = metrics.exercisesDifficulty.basic > 0;
    const hasIntermediate = metrics.exercisesDifficulty.intermediate > 0;
    const hasAdvanced = metrics.exercisesDifficulty.advanced > 0;
    if (hasBasic && hasIntermediate && hasAdvanced) score += 15;
    else if ((hasBasic && hasIntermediate) || (hasIntermediate && hasAdvanced)) score += 10;
    else score += 5;
  }

  // Content structure (max 20 points)
  maxScore += 20;
  let structurePoints = 0;
  if (metrics.hasAnswerKey) structurePoints += 4;
  if (metrics.hasPracticeSections) structurePoints += 4;
  if (metrics.hasCaseStudies) structurePoints += 4;
  if (metrics.hasRealWorldApplications) structurePoints += 4;
  if (metrics.hasIndex) structurePoints += 2;
  if (metrics.hasBibliography) structurePoints += 2;
  score += structurePoints;

  // Visual aids and appendices (max 10 points)
  maxScore += 10;
  if (metrics.hasVisualAids) score += 5;
  if (metrics.numberOfAppendices > 0) score += 5;

  // Coverage (max 10 points)
  maxScore += 10;
  const totalModules = Object.keys(metrics.pagesPerModule).length;
  const coveredModules = metrics.modulesWithDedicatedChapters.length + 
                         metrics.modulesWithPartialCoverage.length;
  if (totalModules > 0) {
    const coverageRatio = coveredModules / totalModules;
    if (coverageRatio > 0.9) score += 10;
    else if (coverageRatio > 0.7) score += 7;
    else if (coverageRatio > 0.5) score += 4;
  }

  return Math.round((score / maxScore) * 100);
}
