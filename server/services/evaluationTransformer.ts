/**
 * Transforms evaluation data from manualEvaluator format to technicalAnalysis format
 * for storage in the analyses table
 */

export interface EvaluationResult {
  overview: {
    didacticApproach: {
      description: string;
      targetAudience: string;
      [key: string]: any;
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

export interface TechnicalAnalysisData {
  sintesi_tecnica?: string;
  struttura_programma?: {
    ordine_logico?: string;
    note?: string;
    prerequisiti_rispettati?: boolean;
  };
  copertura_moduli?: Array<{
    modulo_id: number;
    modulo_nome: string;
    copertura_percentuale: number;
    livello_profondita?: string;
    note?: string;
    argomenti_coperti?: string[];
    argomenti_extra?: string[];
    argomenti_mancanti?: string[];
  }>;
  profondita_ampiezza?: {
    livello_generale?: string;
    distribuzione?: {
      introduttivo?: number;
      intermedio?: number;
      avanzato?: number;
    };
    bilanciamento_teoria_applicazioni?: string;
    argomenti_avanzati?: string[];
    note?: string;
  };
  sequenza_organizzazione?: {
    approccio?: string;
    ordine_logico?: string;
    prerequisiti_rispettati?: boolean;
    integrazione_argomenti?: string;
    note?: string;
  };
  punti_forza?: Array<{
    area: string;
    descrizione: string;
    rilevanza: string;
  }>;
  punti_debolezza?: Array<{
    area: string;
    descrizione: string;
    impatto: string;
  }>;
  raccomandato_per?: string[];
  non_raccomandato_per?: string[];
  punteggio_complessivo?: number;
  verdetto?: string;
}

export function transformEvaluationToTechnicalAnalysis(evaluation: EvaluationResult): TechnicalAnalysisData {
  return {
    sintesi_tecnica: `${evaluation.overview.didacticApproach.description}. Pubblico target: ${evaluation.overview.didacticApproach.targetAudience}`,
    
    struttura_programma: {
      ordine_logico: "Valutato tramite analisi dei moduli del framework",
      note: `Ampiezza: ${evaluation.overview.contentLevel.breadth}, Profondità: ${evaluation.overview.contentLevel.depth}, Equilibrio teoria/pratica: ${evaluation.overview.contentLevel.theoryPracticeBalance}`,
      prerequisiti_rispettati: true, // Default, può essere estratto da evaluation se disponibile
    },
    
    copertura_moduli: evaluation.frameworkCoverage.modules.map((module) => ({
      modulo_id: module.moduleId,
      modulo_nome: module.moduleName,
      copertura_percentuale: module.coveragePercentage,
      livello_profondita: module.coveragePercentage >= 80 ? "Approfondito" : module.coveragePercentage >= 50 ? "Medio" : "Superficiale",
      note: module.notes,
      argomenti_coperti: module.coveredTopics,
      argomenti_mancanti: module.missingTopics,
    })),
    
    profondita_ampiezza: {
      livello_generale: evaluation.overview.contentLevel.depth,
      distribuzione: {
        introduttivo: 33,
        intermedio: 34,
        avanzato: 33,
      },
      bilanciamento_teoria_applicazioni: evaluation.overview.contentLevel.theoryPracticeBalance,
      note: `Copertura complessiva: ${evaluation.frameworkCoverage.overallCoverage}%`,
    },
    
    sequenza_organizzazione: {
      approccio: evaluation.overview.didacticApproach.description,
      ordine_logico: "Valutato dal manuale",
      prerequisiti_rispettati: true,
      integrazione_argomenti: "Integrati nel manuale",
    },
    
    punti_forza: evaluation.strengths.map((strength) => ({
      area: strength.area,
      descrizione: strength.description,
      rilevanza: strength.relevance,
    })),
    
    punti_debolezza: evaluation.weaknesses.map((weakness) => ({
      area: weakness.area,
      descrizione: weakness.description,
      impatto: weakness.impact,
    })),
    
    raccomandato_per: evaluation.recommendedFor,
    non_raccomandato_per: evaluation.notRecommendedFor,
    punteggio_complessivo: evaluation.overallScore,
    verdetto: evaluation.verdict,
  };
}
