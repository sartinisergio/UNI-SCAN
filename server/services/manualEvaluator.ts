import { invokeLLMWithUserPreference } from "./llm";

interface ManualIndex {
  capitoli?: Array<{
    numero?: number;
    titolo: string;
    argomenti?: string[];
    sottocapitoli?: Array<{
      titolo: string;
      argomenti?: string[];
    }>;
  }>;
  [key: string]: any;
}

interface FrameworkModule {
  id: number;
  nome: string;
  argomenti: string[];
}

interface Framework {
  moduli: FrameworkModule[];
  [key: string]: any;
}

interface EvaluationResult {
  overview: {
    didacticApproach: {
      description: string;
      targetAudience: string;
      // Campi specifici per economia (opzionali per altre materie)
      authorSchool?: string;
      microSequence?: string;
      macroSequence?: string;
      growthApproach?: string;
    };
    contentLevel: {
      breadth: string;
      depth: string;
      theoryPracticeBalance: string;
    };
  };
  frameworkCoverage: {
    modules: Array<{
      moduleId: number;
      moduleName: string;
      coveragePercentage: number;
      coveredTopics: string[];
      missingTopics: string[];
      notes: string;
    }>;
    overallCoverage: number;
  };
  strengths: Array<{
    area: string;
    description: string;
    relevance: string;
  }>;
  weaknesses: Array<{
    area: string;
    description: string;
    impact: string;
  }>;
  recommendedFor: string[];
  notRecommendedFor: string[];
  overallScore: number;
  verdict: "Eccellente" | "Buono" | "Sufficiente" | "Sconsigliato";
}

// Funzione per verificare se la materia è di tipo economico
function isEconomicsSubject(subjectName: string): boolean {
  const economicsKeywords = [
    'economia', 'economic', 'microeconomia', 'macroeconomia',
    'politica economica', 'finanza', 'mercati', 'istituzioni economiche'
  ];
  const lowerName = subjectName.toLowerCase();
  return economicsKeywords.some(keyword => lowerName.includes(keyword));
}

// Istruzioni specifiche per materie economiche
function getEconomicsInstructions(): string {
  return `
ISTRUZIONI SPECIFICHE PER L'ANALISI DI MANUALI DI ECONOMIA:

1. SCUOLA DI PENSIERO DELL'AUTORE (authorSchool):
   Identifica a quale scuola di pensiero economico appartiene l'autore in base al suo approccio metodologico e ai contenuti enfatizzati. Le principali scuole sono:
   - "Neo-keynesiano" (sintesi neoclassica, enfasi su rigidità prezzi e salari, politiche di stabilizzazione)
   - "Neoclassico" (equilibrio generale, ottimizzazione, mercati efficienti)
   - "Monetarista" (enfasi su moneta e inflazione, critica all'interventismo)
   - "Istituzionalista" (ruolo delle istituzioni, path dependence)
   - "Post-keynesiano" (incertezza radicale, domanda effettiva)
   - "Austriaco" (processo di mercato, imprenditorialità)
   - "Mainstream/Sintesi" (combinazione di approcci)

2. SEQUENZA MICROECONOMIA (microSequence):
   Analizza l'ordine di trattazione degli argomenti microeconomici:
   - "breve-lungo" = prima analisi di breve periodo (equilibrio parziale, decisioni immediate) poi lungo periodo
   - "lungo-breve" = prima analisi di lungo periodo (equilibrio generale, aggiustamenti completi) poi breve
   - "integrata" = trattazione simultanea senza distinzione netta
   - "non applicabile" = se il manuale non tratta microeconomia

3. SEQUENZA MACROECONOMIA (macroSequence):
   Analizza l'ordine di trattazione degli argomenti macroeconomici:
   - "breve-lungo" = prima fluttuazioni cicliche e politiche di stabilizzazione (IS-LM, AD-AS breve), poi crescita e lungo periodo
   - "lungo-breve" = prima crescita economica e equilibrio di lungo periodo, poi fluttuazioni e ciclo economico
   - "integrata" = trattazione simultanea senza distinzione netta
   - "non applicabile" = se il manuale non tratta macroeconomia

4. APPROCCIO ALLA CRESCITA (growthApproach):
   Identifica quale modello/approccio alla crescita economica viene privilegiato:
   - "Neoclassico (Solow)" = enfasi su accumulazione capitale, rendimenti decrescenti, convergenza
   - "Endogeno (Romer)" = enfasi su innovazione, capitale umano, rendimenti crescenti
   - "Istituzionale" = enfasi su istituzioni, diritti di proprietà, governance
   - "Misto" = combinazione equilibrata di più approcci
   - "Non trattato" = se la crescita non è un tema centrale
`;
}

// Schema JSON per materie economiche
function getEconomicsJsonSchema() {
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
              authorSchool: { type: "string" },
              microSequence: { type: "string" },
              macroSequence: { type: "string" },
              growthApproach: { type: "string" }
            },
            required: ["description", "targetAudience", "authorSchool", "microSequence", "macroSequence", "growthApproach"],
            additionalProperties: false
          },
          contentLevel: {
            type: "object",
            properties: {
              breadth: { type: "string" },
              depth: { type: "string" },
              theoryPracticeBalance: { type: "string" }
            },
            required: ["breadth", "depth", "theoryPracticeBalance"],
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
                notes: { type: "string" }
              },
              required: ["moduleId", "moduleName", "coveragePercentage", "coveredTopics", "missingTopics", "notes"],
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
            relevance: { type: "string" }
          },
          required: ["area", "description", "relevance"],
          additionalProperties: false
        }
      },
      weaknesses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            area: { type: "string" },
            description: { type: "string" },
            impact: { type: "string" }
          },
          required: ["area", "description", "impact"],
          additionalProperties: false
        }
      },
      recommendedFor: { type: "array", items: { type: "string" } },
      notRecommendedFor: { type: "array", items: { type: "string" } },
      overallScore: { type: "integer" },
      verdict: { type: "string", enum: ["Eccellente", "Buono", "Sufficiente", "Sconsigliato"] }
    },
    required: ["overview", "frameworkCoverage", "strengths", "weaknesses", "recommendedFor", "notRecommendedFor", "overallScore", "verdict"],
    additionalProperties: false
  };
}

// Schema JSON per materie generiche (non economiche)
function getGenericJsonSchema() {
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
              targetAudience: { type: "string" }
            },
            required: ["description", "targetAudience"],
            additionalProperties: false
          },
          contentLevel: {
            type: "object",
            properties: {
              breadth: { type: "string" },
              depth: { type: "string" },
              theoryPracticeBalance: { type: "string" }
            },
            required: ["breadth", "depth", "theoryPracticeBalance"],
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
                notes: { type: "string" }
              },
              required: ["moduleId", "moduleName", "coveragePercentage", "coveredTopics", "missingTopics", "notes"],
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
            relevance: { type: "string" }
          },
          required: ["area", "description", "relevance"],
          additionalProperties: false
        }
      },
      weaknesses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            area: { type: "string" },
            description: { type: "string" },
            impact: { type: "string" }
          },
          required: ["area", "description", "impact"],
          additionalProperties: false
        }
      },
      recommendedFor: { type: "array", items: { type: "string" } },
      notRecommendedFor: { type: "array", items: { type: "string" } },
      overallScore: { type: "integer" },
      verdict: { type: "string", enum: ["Eccellente", "Buono", "Sufficiente", "Sconsigliato"] }
    },
    required: ["overview", "frameworkCoverage", "strengths", "weaknesses", "recommendedFor", "notRecommendedFor", "overallScore", "verdict"],
    additionalProperties: false
  };
}

export async function generateManualEvaluation(
  userId: number,
  manual: { title: string; author: string; publisher: string },
  indexContent: ManualIndex,
  framework: Framework,
  subjectName: string = "Materia non specificata"
): Promise<EvaluationResult> {
  
  const isEconomics = isEconomicsSubject(subjectName);
  const economicsInstructions = isEconomics ? getEconomicsInstructions() : '';
  
  // Formato JSON per didacticApproach in base alla materia
  const didacticApproachFormat = isEconomics ? `
      "authorSchool": "Scuola di pensiero dell'autore (es. Neo-keynesiano)",
      "microSequence": "breve-lungo | lungo-breve | integrata | non applicabile",
      "macroSequence": "breve-lungo | lungo-breve | integrata | non applicabile",
      "growthApproach": "Neoclassico (Solow) | Endogeno (Romer) | Istituzionale | Misto | Non trattato"` : '';

  const prompt = `Sei un esperto di didattica universitaria e valutazione di manuali accademici di ${subjectName.toUpperCase()}.

COMPITO: Analizza l'indice del manuale e genera una valutazione dettagliata rispetto al framework della materia "${subjectName}".

MANUALE:
- Titolo: ${manual.title}
- Autore: ${manual.author}
- Editore: ${manual.publisher}

INDICE DEL MANUALE:
${JSON.stringify(indexContent, null, 2)}

FRAMEWORK DELLA MATERIA "${subjectName}" (moduli e argomenti richiesti):
${JSON.stringify(framework.moduli, null, 2)}
${economicsInstructions}
ISTRUZIONI GENERALI:
1. Per ogni modulo del framework, valuta la copertura (0-100%) confrontando gli argomenti dell'indice con quelli richiesti
2. Identifica punti di forza e debolezze del manuale rispetto al framework di ${subjectName}
3. Assegna un punteggio complessivo (0-100) e un verdetto
4. Basa la valutazione ESCLUSIVAMENTE sul framework fornito per ${subjectName}, non su conoscenze generiche

RISPONDI ESCLUSIVAMENTE con un JSON valido nel seguente formato:
{
  "overview": {
    "didacticApproach": {
      "description": "Descrizione dell'approccio didattico del manuale",
      "targetAudience": "Pubblico target ideale"${didacticApproachFormat ? ',' + didacticApproachFormat : ''}
    },
    "contentLevel": {
      "breadth": "Ampio/Medio/Focalizzato",
      "depth": "Approfondito/Medio/Introduttivo",
      "theoryPracticeBalance": "Teorico/Bilanciato/Pratico"
    }
  },
  "frameworkCoverage": {
    "modules": [
      {
        "moduleId": 1,
        "moduleName": "Nome modulo dal framework",
        "coveragePercentage": 85,
        "coveredTopics": ["argomento1", "argomento2"],
        "missingTopics": ["argomento mancante"],
        "notes": "Note sulla copertura"
      }
    ],
    "overallCoverage": 75
  },
  "strengths": [
    {
      "area": "Area di forza",
      "description": "Descrizione dettagliata",
      "relevance": "Alta/Media/Bassa"
    }
  ],
  "weaknesses": [
    {
      "area": "Area di debolezza",
      "description": "Descrizione dettagliata",
      "impact": "Alto/Medio/Basso"
    }
  ],
  "recommendedFor": ["Tipo di corso/studente ideale per ${subjectName}"],
  "notRecommendedFor": ["Tipo di corso/studente non ideale"],
  "overallScore": 78,
  "verdict": "Buono"
}

Il verdetto deve essere uno tra: "Eccellente" (90-100), "Buono" (70-89), "Sufficiente" (50-69), "Sconsigliato" (<50)`;

  const systemMessage = isEconomics 
    ? `Sei un valutatore esperto di manuali universitari di ${subjectName}. Rispondi sempre e solo con JSON valido. Presta particolare attenzione all'identificazione della scuola di pensiero dell'autore e alla sequenza di trattazione breve/lungo periodo.`
    : `Sei un valutatore esperto di manuali universitari di ${subjectName}. Rispondi sempre e solo con JSON valido. Valuta il manuale esclusivamente rispetto al framework fornito per ${subjectName}.`;

  const jsonSchema = isEconomics ? getEconomicsJsonSchema() : getGenericJsonSchema();

  const response = await invokeLLMWithUserPreference(userId, {
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt }
    ],
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "manual_evaluation",
        strict: true,
        schema: jsonSchema
      }
    }
  });

  const content = response.content;
  if (!content) {
    throw new Error("Nessuna risposta dal modello LLM");
  }
  
  return JSON.parse(content) as EvaluationResult;
}
