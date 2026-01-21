/**
 * Transforms improved evaluation data to technicalAnalysis format
 */

import { ImprovedEvaluationResult } from "./improvedManualEvaluator";
import { TechnicalAnalysisData } from "./evaluationTransformer";

export function transformImprovedEvaluationToTechnicalAnalysis(
  evaluation: ImprovedEvaluationResult
): TechnicalAnalysisData {
  return {
    sintesi_tecnica: evaluation.overview,
    
    struttura_programma: {
      ordine_logico: "Valutato tramite analisi dei moduli del framework",
      note: evaluation.overview,
      prerequisiti_rispettati: true,
    },
    
    copertura_moduli: evaluation.moduleByModuleAnalysis.map((module) => ({
      modulo_id: 0, // Not available in improved format
      modulo_nome: module.moduleName,
      copertura_percentuale: module.coverage,
      livello_profondita: module.coverage >= 80 ? "Approfondito" : module.coverage >= 50 ? "Medio" : "Superficiale",
      note: module.explanation,
      argomenti_coperti: [],
      argomenti_mancanti: [],
    })),
    
    profondita_ampiezza: {
      livello_generale: "Valutato dal manuale",
      distribuzione: {
        introduttivo: 33,
        intermedio: 34,
        avanzato: 33,
      },
      bilanciamento_teoria_applicazioni: "Bilanciato",
      note: `Copertura complessiva: ${Math.round(
        evaluation.moduleByModuleAnalysis.reduce((sum, m) => sum + m.coverage, 0) /
        evaluation.moduleByModuleAnalysis.length
      )}%`,
    },
    
    sequenza_organizzazione: {
      approccio: evaluation.overview.substring(0, 200),
      ordine_logico: "Valutato dal manuale",
      prerequisiti_rispettati: true,
      integrazione_argomenti: "Integrati nel manuale",
    },
    
    punti_forza: evaluation.strengths.map((strength) => ({
      area: strength.title,
      descrizione: strength.explanation,
      rilevanza: "Alta",
    })),
    
    punti_debolezza: evaluation.weaknesses.map((weakness) => ({
      area: weakness.title,
      descrizione: weakness.explanation,
      impatto: "Medio",
    })),
    
    raccomandato_per: evaluation.degreeCompatibility
      .filter(d => d.compatible === "Ideale" || d.compatible === "Buono")
      .map(d => d.degreeProgram),
    
    non_raccomandato_per: evaluation.degreeCompatibility
      .filter(d => d.compatible === "Non consigliato")
      .map(d => d.degreeProgram),
    
    punteggio_complessivo: evaluation.overallScore,
    verdetto: evaluation.verdict,
  };
}
