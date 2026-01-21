/**
 * Enhanced Manual Evaluator - Provides deeper, more actionable insights for textbook promoters
 * Includes: detailed module analysis, quality metrics, comparative analysis, target-specific recommendations
 */

import { invokeLLMWithUserPreference } from "./llm";
import { extractModules, getFrameworkFormat } from "./frameworkNormalizer";

interface EnhancedEvaluationResult {
  overview: {
    didacticApproach: {
      description: string;
      targetAudience: string;
      pedagogicalStyle: string; // Teorico/Pratico/Bilanciato
      clarity: string; // Molto chiaro/Chiaro/Confuso
    };
    contentLevel: {
      breadth: string; // Ampio/Medio/Focalizzato
      depth: string; // Approfondito/Medio/Introduttivo
      theoryPracticeBalance: string; // Teorico/Bilanciato/Pratico
      rigor: string; // Rigoroso/Adeguato/Superficiale
    };
  };
  frameworkCoverage: {
    modules: Array<{
      moduleId: number;
      moduleName: string;
      coveragePercentage: number;
      coveredTopics: string[];
      missingTopics: string[];
      qualityAssessment: {
        exercisesQuality: string; // Abbondanti/Adeguati/Insufficienti
        examplesQuality: string; // Concreti/Astratti/Mancanti
        rigorLevel: string; // Rigoroso/Adeguato/Superficiale
      };
      notes: string;
    }>;
    overallCoverage: number;
  };
  strengths: Array<{
    area: string;
    description: string;
    relevance: string; // Alta/Media/Bassa
    impact: string; // Descrizione dell'impatto
  }>;
  weaknesses: Array<{
    area: string;
    description: string;
    impact: string; // Alto/Medio/Basso
    severity: string; // Critico/Importante/Minore
  }>;
  targetSpecificRecommendations: Array<{
    degreeProgram: string;
    suitability: "Ideale" | "Buono" | "Accettabile" | "Non consigliato";
    targetScore: number; // 0-100 per questo specifico target
    reasoning: string;
    priorityModules: string[];
    criticalGaps: string[];
  }>;
  comparativeAnalysis?: {
    comparedWith?: string; // Nome del manuale competitor
    advantages: string[]; // Vantaggi rispetto al competitor
    disadvantages: string[]; // Svantaggi rispetto al competitor
  };
  recommendedFor: string[];
  notRecommendedFor: string[];
  overallScore: number;
  verdict: "Eccellente" | "Buono" | "Sufficiente" | "Sconsigliato";
  executiveSummary: string; // Riassunto per il promotore
}

function getEnhancedJsonSchema() {
  return {
    type: "object",
    properties: {
      overview: {
        type: "object",
        properties: {
          didacticApproach: {
            type: "object",
            properties: {
              description: { type: "string" },
              targetAudience: { type: "string" },
              pedagogicalStyle: { type: "string", enum: ["Teorico", "Pratico", "Bilanciato"] },
              clarity: { type: "string", enum: ["Molto chiaro", "Chiaro", "Confuso"] }
            },
            required: ["description", "targetAudience", "pedagogicalStyle", "clarity"],
            additionalProperties: false
          },
          contentLevel: {
            type: "object",
            properties: {
              breadth: { type: "string", enum: ["Ampio", "Medio", "Focalizzato"] },
              depth: { type: "string", enum: ["Approfondito", "Medio", "Introduttivo"] },
              theoryPracticeBalance: { type: "string", enum: ["Teorico", "Bilanciato", "Pratico"] },
              rigor: { type: "string", enum: ["Rigoroso", "Adeguato", "Superficiale"] }
            },
            required: ["breadth", "depth", "theoryPracticeBalance", "rigor"],
            additionalProperties: false
          }
        },
        required: ["didacticApproach", "contentLevel"],
        additionalProperties: false
      },
      frameworkCoverage: {
        type: "object",
        properties: {
          modules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                moduleId: { type: "integer" },
                moduleName: { type: "string" },
                coveragePercentage: { type: "integer" },
                coveredTopics: { type: "array", items: { type: "string" } },
                missingTopics: { type: "array", items: { type: "string" } },
                qualityAssessment: {
                  type: "object",
                  properties: {
                    exercisesQuality: { type: "string", enum: ["Abbondanti", "Adeguati", "Insufficienti"] },
                    examplesQuality: { type: "string", enum: ["Concreti", "Astratti", "Mancanti"] },
                    rigorLevel: { type: "string", enum: ["Rigoroso", "Adeguato", "Superficiale"] }
                  },
                  required: ["exercisesQuality", "examplesQuality", "rigorLevel"],
                  additionalProperties: false
                },
                notes: { type: "string" }
              },
              required: ["moduleId", "moduleName", "coveragePercentage", "coveredTopics", "missingTopics", "qualityAssessment", "notes"],
              additionalProperties: false
            }
          },
          overallCoverage: { type: "integer" }
        },
        required: ["modules", "overallCoverage"],
        additionalProperties: false
      },
      strengths: {
        type: "array",
        items: {
          type: "object",
          properties: {
            area: { type: "string" },
            description: { type: "string" },
            relevance: { type: "string", enum: ["Alta", "Media", "Bassa"] },
            impact: { type: "string" }
          },
          required: ["area", "description", "relevance", "impact"],
          additionalProperties: false
        }
      },
      weaknesses: {
        type: "object",
        properties: {
          area: { type: "string" },
          description: { type: "string" },
          impact: { type: "string", enum: ["Alto", "Medio", "Basso"] },
          severity: { type: "string", enum: ["Critico", "Importante", "Minore"] }
        },
        required: ["area", "description", "impact", "severity"],
        additionalProperties: false
      },
      targetSpecificRecommendations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            degreeProgram: { type: "string" },
            suitability: { type: "string", enum: ["Ideale", "Buono", "Accettabile", "Non consigliato"] },
            targetScore: { type: "integer" },
            reasoning: { type: "string" },
            priorityModules: { type: "array", items: { type: "string" } },
            criticalGaps: { type: "array", items: { type: "string" } }
          },
          required: ["degreeProgram", "suitability", "targetScore", "reasoning", "priorityModules", "criticalGaps"],
          additionalProperties: false
        }
      },
      recommendedFor: { type: "array", items: { type: "string" } },
      notRecommendedFor: { type: "array", items: { type: "string" } },
      overallScore: { type: "integer" },
      verdict: { type: "string", enum: ["Eccellente", "Buono", "Sufficiente", "Sconsigliato"] },
      executiveSummary: { type: "string" }
    },
    required: ["overview", "frameworkCoverage", "strengths", "weaknesses", "targetSpecificRecommendations", "recommendedFor", "notRecommendedFor", "overallScore", "verdict", "executiveSummary"],
    additionalProperties: false
  };
}

export async function generateEnhancedManualEvaluation(
  userId: number,
  manual: { title: string; author: string; publisher: string },
  indexContent: any,
  framework: any,
  subjectName: string = "Materia non specificata",
  targetDegreePrograms: string[] = []
): Promise<EnhancedEvaluationResult> {
  
  const frameworkModules = extractModules(framework as any);
  
  // Crea una versione compatta del framework
  const compactFramework = frameworkModules.map((m, idx) => ({
    id: idx + 1,
    nome: m.nome,
    argomenti: m.argomenti.slice(0, 5) // Limita a 5 argomenti per modulo
  }));

  const targetDegreesText = targetDegreePrograms.length > 0 
    ? `\n\nCLASSI DI LAUREA TARGET:\n${targetDegreePrograms.map(d => `- ${d}`).join('\n')}\n\nPer ogni classe di laurea, fornisci una valutazione specifica nel campo "targetSpecificRecommendations".`
    : '';

  const prompt = `Sei un esperto di didattica universitaria e valutazione critica di manuali accademici di ${subjectName.toUpperCase()}.

COMPITO: Analizza l'indice del manuale e genera una valutazione DETTAGLIATA e ACTIONABLE per i promotori editoriali.

MANUALE:
- Titolo: ${manual.title}
- Autore: ${manual.author}
- Editore: ${manual.publisher}

INDICE DEL MANUALE:
${JSON.stringify(indexContent, null, 2)}

FRAMEWORK DELLA MATERIA "${subjectName}" (moduli e argomenti richiesti):
${JSON.stringify(compactFramework, null, 2)}
${targetDegreesText}

ISTRUZIONI DETTAGLIATE:

1. ANALISI PER MODULO:
   Per ogni modulo del framework, valuta SPECIFICAMENTE:
   a) Copertura percentuale (0-100%) degli argomenti
   b) Qualità degli esercizi: sono abbondanti? Sono risolti? Hanno difficoltà progressive?
   c) Qualità degli esempi: sono concreti e applicativi? Sono astratti?
   d) Rigore: è rigoroso matematicamente/scientificamente? Superficiale?
   e) Gap specifici: quali argomenti mancano completamente?

2. PUNTI DI FORZA (minimo 3):
   Identifica SPECIFICAMENTE:
   - Aree dove il manuale eccelle (es: "Esercizi molto ben strutturati con soluzioni complete")
   - Approccio pedagogico unico (es: "Approccio problem-solving molto efficace")
   - Contenuti speciali (es: "Capitoli su applicazioni industriali non comuni")
   - Chiarezza espositiva in aree critiche

3. PUNTI DI DEBOLEZZA (minimo 3):
   Identifica SPECIFICAMENTE:
   - Gap di contenuto (es: "Manca completamente la trattazione della cinetica enzimatica")
   - Insufficienza di esercizi (es: "Solo 5 esercizi per il modulo di termodinamica")
   - Rigore insufficiente (es: "Derivazioni matematiche non rigorose")
   - Chiarezza problematica in aree critiche

4. VALUTAZIONE TARGET-SPECIFICA:
   Per ogni classe di laurea, valuta:
   - Se il manuale è IDEALE/BUONO/ACCETTABILE/NON CONSIGLIATO
   - Moduli prioritari per quel target
   - Gap critici per quel target
   - Score specifico (0-100) per quel target

5. EXECUTIVE SUMMARY:
   Scrivi un paragrafo (max 150 parole) che un promotore possa usare direttamente nella presentazione al cliente.
   Deve essere concreto, specifico, e orientato ai benefici.

RISPONDI ESCLUSIVAMENTE con un JSON valido nel seguente formato:
{
  "overview": {
    "didacticApproach": {
      "description": "Descrizione dell'approccio didattico: come il manuale insegna la materia",
      "targetAudience": "Pubblico target ideale (es: studenti di ingegneria con background matematico forte)",
      "pedagogicalStyle": "Teorico/Pratico/Bilanciato",
      "clarity": "Molto chiaro/Chiaro/Confuso"
    },
    "contentLevel": {
      "breadth": "Ampio/Medio/Focalizzato",
      "depth": "Approfondito/Medio/Introduttivo",
      "theoryPracticeBalance": "Teorico/Bilanciato/Pratico",
      "rigor": "Rigoroso/Adeguato/Superficiale"
    }
  },
  "frameworkCoverage": {
    "modules": [
      {
        "moduleId": 1,
        "moduleName": "Nome modulo",
        "coveragePercentage": 85,
        "coveredTopics": ["argomento1", "argomento2"],
        "missingTopics": ["argomento mancante"],
        "qualityAssessment": {
          "exercisesQuality": "Abbondanti/Adeguati/Insufficienti",
          "examplesQuality": "Concreti/Astratti/Mancanti",
          "rigorLevel": "Rigoroso/Adeguato/Superficiale"
        },
        "notes": "Note specifiche sulla qualità della trattazione"
      }
    ],
    "overallCoverage": 75
  },
  "strengths": [
    {
      "area": "Area di forza",
      "description": "Descrizione SPECIFICA e CONCRETA",
      "relevance": "Alta/Media/Bassa",
      "impact": "Impatto sulla qualità dell'insegnamento"
    }
  ],
  "weaknesses": [
    {
      "area": "Area di debolezza",
      "description": "Descrizione SPECIFICA e CONCRETA",
      "impact": "Alto/Medio/Basso",
      "severity": "Critico/Importante/Minore"
    }
  ],
  "targetSpecificRecommendations": [
    {
      "degreeProgram": "Nome della classe di laurea",
      "suitability": "Ideale/Buono/Accettabile/Non consigliato",
      "targetScore": 85,
      "reasoning": "Motivazione specifica per questo target",
      "priorityModules": ["Modulo 1", "Modulo 3"],
      "criticalGaps": ["Gap 1", "Gap 2"]
    }
  ],
  "recommendedFor": ["Tipo di corso/studente ideale"],
  "notRecommendedFor": ["Tipo di corso/studente non ideale"],
  "overallScore": 78,
  "verdict": "Buono",
  "executiveSummary": "Paragrafo riassuntivo per il promotore (max 150 parole)"
}

Il verdetto deve essere uno tra: "Eccellente" (90-100), "Buono" (70-89), "Sufficiente" (50-69), "Sconsigliato" (<50)`;

  const systemMessage = `Sei un valutatore esperto e critico di manuali universitari di ${subjectName}. 
La tua valutazione deve essere SPECIFICA, CONCRETA e ACTIONABLE per i promotori editoriali.
Non usare generalismi. Fornisci sempre esempi concreti e dati specifici.
Rispondi sempre e solo con JSON valido.`;

  const response = await invokeLLMWithUserPreference(userId, {
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt }
    ],
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "enhanced_manual_evaluation",
        strict: true,
        schema: getEnhancedJsonSchema()
      }
    }
  });

  const content = response.content;
  if (!content) {
    throw new Error("Nessuna risposta dal modello LLM");
  }
  
  return JSON.parse(content) as EnhancedEvaluationResult;
}
