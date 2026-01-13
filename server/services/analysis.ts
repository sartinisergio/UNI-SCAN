/**
 * Servizio di Analisi a Due Livelli per UNI-SCAN
 * Implementa il sistema di analisi contestuale + tecnica dei programmi universitari
 */

import { invokeLLMWithUserPreference, type LLMResponse } from "./llm";
import * as db from "../db";
import { isPDF, parsePDF } from "./pdfParser";

// Tipi per l'analisi
export interface AnalysisInput {
  programText: string;
  subjectId: number;
  userId: number;
  universityName?: string;
  courseName?: string;
  professorName?: string;
  degreeCourse?: string;
  primaryManual?: {
    id: number | null;
    title: string;
    author: string;
    publisher: string;
    type: "zanichelli" | "competitor";
  } | null;
  alternativeManuals?: Array<{
    id: number | null;
    title: string;
    author: string;
    publisher: string;
    type: "zanichelli" | "competitor";
  }>;
}

export interface Phase1Result {
  filosofia_didattica: {
    approccio_principale: string;
    bilanciamento_teoria_pratica: string;
    livello_rigore: string;
    livello_accessibilita: string;
    enfasi_applicazioni: string;
    interdisciplinarita: string;
    // Nuovi campi per economia
    scuola_pensiero: string; // Scuola di pensiero del docente/programma
    sequenza_micro: string; // breve-lungo | lungo-breve | integrata | non applicabile
    sequenza_macro: string; // breve-lungo | lungo-breve | integrata | non applicabile
    approccio_crescita: string; // Neoclassico (Solow) | Endogeno (Romer) | Istituzionale | Misto | Non trattato
    confidence: number;
  };
  priorita_pedagogiche: {
    profondita_vs_ampiezza: string;
    sequenza_didattica: string;
    metodologie: string[];
    valutazione: {
      modalita: string[];
      prove_in_itinere: boolean;
    };
    confidence: number;
  };
  target_studenti: {
    corso_di_laurea: string;
    curriculum: string;
    anno: number | string;
    background_atteso: string[];
    obiettivi_formativi: string;
    confidence: number;
  };
  contesto_istituzionale: {
    ateneo: string;
    dipartimento: string;
    orientamento: string;
    stakeholder: string[];
    confidence: number;
  };
  sintesi_profilo: string;
}

export interface ModuleCoverage {
  modulo_id: number;
  modulo_nome: string;
  copertura_percentuale: number;
  argomenti_coperti: string[];
  argomenti_omessi: string[];
  argomenti_extra: string[];
  livello_profondita: string;
  note: string;
}

export interface Phase2Result {
  copertura_moduli: ModuleCoverage[];
  copertura_totale: number;
  moduli_ben_coperti: number[];
  moduli_parzialmente_coperti: number[];
  moduli_omessi: number[];
  profondita_ampiezza: {
    livello_generale: string;
    distribuzione: {
      introduttivo: number;
      intermedio: number;
      avanzato: number;
    };
    bilanciamento_teoria_applicazioni: string;
    argomenti_avanzati: string[];
    note: string;
  };
  sequenza_organizzazione: {
    approccio: string;
    ordine_logico: string;
    prerequisiti_rispettati: boolean;
    integrazione_argomenti: string;
    note: string;
  };
  manuale_adottato: {
    titolo: string;
    autore: string;
    editore: string;
    edizione: string;
    anno: number | string;
    allineamento_programma: number;
    capitoli_utilizzati: number[];
    capitoli_non_utilizzati: number[];
    argomenti_programma_non_in_manuale: string[];
    note: string;
  } | null;
  sintesi_tecnica: string;
}

export interface Gap {
  tipo: "contenuto_mancante" | "profondita_insufficiente" | "approccio_diverso" | "risorse_carenti";
  descrizione: string;
  gravita: "alta" | "media" | "bassa";
  modulo_riferimento?: string;
  impatto_commerciale: string;
}

export interface Phase3Result {
  insight_principale: string;
  valutazione_manuale_adottato: {
    punti_forza: string[];
    punti_debolezza: string[];
    gap_rispetto_programma: string[];
  } | null;
  gap_identificati: Gap[];
  opportunita_zanichelli: {
    manuale_consigliato: {
      id: number;
      titolo: string;
      autore: string;
    } | null;
    punti_forza_vs_competitor: Array<{
      area: string;
      descrizione: string;
      rilevanza_per_programma: string;
    }>;
    allineamento_profilo_pedagogico: number;
  };
  argomentazioni_vendita: Array<{
    ordine: number;
    messaggio: string;
    supporto: string;
    impatto: string;
  }>;
  strategia_approccio: {
    fase_1: {
      azione: string;
      contenuto: string;
      materiali: string[];
      obiettivo: string;
    };
    fase_2: {
      azione: string;
      contenuto: string;
      materiali: string[];
      obiettivo: string;
    };
    fase_3: {
      azione: string;
      contenuto: string;
      materiali: string[];
      obiettivo: string;
    };
    punti_attenzione: string[];
  };
  post_it: string;
}

export interface FullAnalysisResult {
  metadata: {
    data_analisi: string;
    materia: string;
    corso_laurea: string;
    ateneo: string;
    docente: string;
    versione_sistema: string;
    program_text_extracted?: string; // Testo estratto dal PDF (se applicabile)
  };
  fase_1_contestuale: Phase1Result;
  fase_2_tecnica: Phase2Result;
  fase_3_commerciale: Phase3Result;
}

// Prompt per Fase 1: Analisi Contestuale
function getPhase1Prompt(programText: string): string {
  return `# RUOLO
Sei un esperto di didattica universitaria italiana con profonda conoscenza del sistema di autonomia didattica e delle diverse scuole di pensiero economico.

# CONTESTO
Il sistema universitario italiano NON ha un syllabus nazionale. Ogni docente ha autonomia didattica costituzionalmente garantita. Il programma di un corso riflette le scelte pedagogiche autonome del docente, influenzate da:
- Filosofia didattica personale
- Target di studenti (corso di laurea, anno, background)
- Contesto istituzionale (Ateneo, Dipartimento, stakeholder)
- Priorità pedagogiche (profondità vs ampiezza, teoria vs pratica, rigore vs accessibilità)
- Orientamento teorico (scuola di pensiero economico di riferimento)

# TASK
Analizza il seguente programma di corso universitario ed estrai il **profilo pedagogico del docente** lungo 4 dimensioni:
1. Filosofia Didattica (inclusa scuola di pensiero economico)
2. Priorità Pedagogiche
3. Target di Studenti
4. Contesto Istituzionale

# INPUT - PROGRAMMA DEL CORSO
${programText}

# OUTPUT
Genera un JSON strutturato con le 4 dimensioni, includendo:
- Valori estratti per ogni indicatore
- Livello di confidence (0-1) per ogni dimensione
- Citazioni testuali dal programma a supporto delle inferenze

# ISTRUZIONI SPECIFICHE PER ECONOMIA

## SCUOLA DI PENSIERO (scuola_pensiero)
Identifica a quale scuola di pensiero economico si orienta il programma/docente:
- "Neo-keynesiano" (sintesi neoclassica, enfasi su rigidità prezzi e salari, politiche di stabilizzazione)
- "Neoclassico" (equilibrio generale, ottimizzazione, mercati efficienti)
- "Monetarista" (enfasi su moneta e inflazione, critica all'interventismo)
- "Istituzionalista" (ruolo delle istituzioni, path dependence)
- "Post-keynesiano" (incertezza radicale, domanda effettiva)
- "Austriaco" (processo di mercato, imprenditorialità)
- "Mainstream/Sintesi" (combinazione di approcci)
- "Non identificabile" (se non ci sono elementi sufficienti)

## SEQUENZA MICROECONOMIA (sequenza_micro)
Analizza l'ordine di trattazione degli argomenti microeconomici:
- "breve-lungo" = prima analisi di breve periodo poi lungo periodo
- "lungo-breve" = prima analisi di lungo periodo poi breve
- "integrata" = trattazione simultanea senza distinzione netta
- "non applicabile" = se il programma non tratta microeconomia

## SEQUENZA MACROECONOMIA (sequenza_macro)
Analizza l'ordine di trattazione degli argomenti macroeconomici:
- "breve-lungo" = prima fluttuazioni cicliche e politiche di stabilizzazione, poi crescita e lungo periodo
- "lungo-breve" = prima crescita economica e equilibrio di lungo periodo, poi fluttuazioni
- "integrata" = trattazione simultanea senza distinzione netta
- "non applicabile" = se il programma non tratta macroeconomia

## APPROCCIO ALLA CRESCITA (approccio_crescita)
Identifica quale modello/approccio alla crescita economica viene privilegiato:
- "Neoclassico (Solow)" = enfasi su accumulazione capitale, rendimenti decrescenti
- "Endogeno (Romer)" = enfasi su innovazione, capitale umano, rendimenti crescenti
- "Istituzionale" = enfasi su istituzioni, diritti di proprietà
- "Misto" = combinazione equilibrata di più approcci
- "Non trattato" = se la crescita non è un tema del programma

# ISTRUZIONI GENERALI
- Basa le inferenze SOLO su evidenze testuali nel programma
- Se un'informazione non è presente, indica "non specificato" e confidence basso
- Distingui tra informazioni esplicite (confidence alto) e inferenze (confidence medio-basso)
- Usa un linguaggio professionale ma accessibile
- Evita giudizi di valore, mantieni un tono descrittivo

# FORMATO OUTPUT
Rispondi SOLO con un JSON valido, senza markdown o altro testo:
{
  "filosofia_didattica": {
    "approccio_principale": "string",
    "bilanciamento_teoria_pratica": "string (es. 60% teoria, 40% pratica)",
    "livello_rigore": "string (alto/medio/basso)",
    "livello_accessibilita": "string (alto/medio/basso)",
    "enfasi_applicazioni": "string (alta/media/bassa)",
    "interdisciplinarita": "string",
    "scuola_pensiero": "string (es. Neo-keynesiano, Neoclassico, Mainstream/Sintesi)",
    "sequenza_micro": "string (breve-lungo | lungo-breve | integrata | non applicabile)",
    "sequenza_macro": "string (breve-lungo | lungo-breve | integrata | non applicabile)",
    "approccio_crescita": "string (Neoclassico (Solow) | Endogeno (Romer) | Istituzionale | Misto | Non trattato)",
    "confidence": number
  },
  "priorita_pedagogiche": {
    "profondita_vs_ampiezza": "string",
    "sequenza_didattica": "string",
    "metodologie": ["string"],
    "valutazione": {
      "modalita": ["string"],
      "prove_in_itinere": boolean
    },
    "confidence": number
  },
  "target_studenti": {
    "corso_di_laurea": "string",
    "curriculum": "string",
    "anno": number or "non specificato",
    "background_atteso": ["string"],
    "obiettivi_formativi": "string",
    "confidence": number
  },
  "contesto_istituzionale": {
    "ateneo": "string",
    "dipartimento": "string",
    "orientamento": "string",
    "stakeholder": ["string"],
    "confidence": number
  },
  "sintesi_profilo": "Breve descrizione narrativa del profilo pedagogico del docente (max 3 frasi)"
}`;
}

// Prompt per Fase 2: Analisi Tecnica
interface BibliographyData {
  primaryManual?: {
    id: number | null;
    title: string;
    author: string;
    publisher: string;
    type: "zanichelli" | "competitor";
  } | null;
  alternativeManuals?: Array<{
    id: number | null;
    title: string;
    author: string;
    publisher: string;
    type: "zanichelli" | "competitor";
  }>;
}

function getPhase2Prompt(programText: string, framework: any, phase1Result: Phase1Result, subjectName: string, bibliography?: BibliographyData): string {
  // Costruisci la sezione bibliografia se fornita
  let bibliographySection = "";
  if (bibliography?.primaryManual || (bibliography?.alternativeManuals && bibliography.alternativeManuals.length > 0)) {
    bibliographySection = `\n# BIBLIOGRAFIA ADOTTATA (fornita dall'utente)\n`;
    if (bibliography.primaryManual) {
      bibliographySection += `MANUALE PRINCIPALE (preferito dal docente):\n`;
      bibliographySection += `- Titolo: ${bibliography.primaryManual.title}\n`;
      bibliographySection += `- Autore: ${bibliography.primaryManual.author}\n`;
      bibliographySection += `- Editore: ${bibliography.primaryManual.publisher}\n`;
      bibliographySection += `- Tipo: ${bibliography.primaryManual.type === "zanichelli" ? "Zanichelli" : "Competitor"}\n\n`;
    }
    if (bibliography.alternativeManuals && bibliography.alternativeManuals.length > 0) {
      bibliographySection += `MANUALI ALTERNATIVI:\n`;
      bibliography.alternativeManuals.forEach((m, i) => {
        bibliographySection += `${i + 1}. ${m.title} - ${m.author} (${m.publisher}) [${m.type === "zanichelli" ? "Zanichelli" : "Competitor"}]\n`;
      });
    }
    bibliographySection += `\nIMPORTANTE: 
1. Analizza TUTTI i manuali indicati (principale E alternativi)
2. Per ogni manuale, valuta l'allineamento con il programma
3. Identifica punti di forza e debolezza di ciascuno
4. Il manuale principale è quello preferito dal docente, ma gli alternativi sono opzioni equivalenti per gli studenti
5. Se un manuale Zanichelli è già presente (come principale o alternativa), evidenzialo\n`;
  }
  
  return `# RUOLO
Sei un esperto della materia "${subjectName}" con profonda conoscenza dei contenuti disciplinari e dei framework didattici.

# CONTESTO
Hai già analizzato il profilo pedagogico del docente (Fase 1). Ora devi analizzare i contenuti tecnici del programma confrontandoli con il framework di valutazione per ${subjectName}.

# PROFILO PEDAGOGICO (da Fase 1)
${JSON.stringify(phase1Result, null, 2)}

# FRAMEWORK DI VALUTAZIONE
${JSON.stringify(framework, null, 2)}
${bibliographySection}
# PROGRAMMA DEL CORSO
${programText}

# TASK
Analizza il programma lungo 4 dimensioni tecniche:
1. Copertura dei Moduli (vs framework)
2. Profondità e Ampiezza
3. Sequenza e Organizzazione
4. Allineamento con Manuale Adottato (usa i dati della bibliografia se forniti, altrimenti cerca di identificarlo dal testo)

# OUTPUT
Genera un JSON strutturato con le 4 dimensioni, includendo:
- Percentuali di copertura
- Argomenti coperti, omessi, extra
- Livelli di profondità
- Note qualitative

# ISTRUZIONI
- Usa il profilo pedagogico (Fase 1) per contestualizzare l'analisi tecnica
- Distingui tra omissioni intenzionali (coerenti con il profilo) e gap veri
- Identifica punti di forza e debolezza del programma
- Mantieni un tono oggettivo e descrittivo
- Se il manuale adottato non è identificabile, imposta manuale_adottato a null

# FORMATO OUTPUT
Rispondi SOLO con un JSON valido, senza markdown o altro testo:
{
  "copertura_moduli": [
    {
      "modulo_id": number,
      "modulo_nome": "string",
      "copertura_percentuale": number,
      "argomenti_coperti": ["string"],
      "argomenti_omessi": ["string"],
      "argomenti_extra": ["string"],
      "livello_profondita": "string (alto/medio/basso)",
      "note": "string"
    }
  ],
  "copertura_totale": number,
  "moduli_ben_coperti": [number],
  "moduli_parzialmente_coperti": [number],
  "moduli_omessi": [number],
  "profondita_ampiezza": {
    "livello_generale": "string",
    "distribuzione": {
      "introduttivo": number,
      "intermedio": number,
      "avanzato": number
    },
    "bilanciamento_teoria_applicazioni": "string",
    "argomenti_avanzati": ["string"],
    "note": "string"
  },
  "sequenza_organizzazione": {
    "approccio": "string",
    "ordine_logico": "string",
    "prerequisiti_rispettati": boolean,
    "integrazione_argomenti": "string",
    "note": "string"
  },
  "manuale_adottato": {
    "titolo": "string",
    "autore": "string",
    "editore": "string",
    "edizione": "string",
    "anno": number or "non specificato",
    "allineamento_programma": number,
    "capitoli_utilizzati": [number],
    "capitoli_non_utilizzati": [number],
    "argomenti_programma_non_in_manuale": ["string"],
    "note": "string"
  } or null,
  "manuali_alternativi": [
    {
      "titolo": "string",
      "autore": "string",
      "editore": "string",
      "allineamento_programma": number,
      "punti_forza": ["string"],
      "punti_debolezza": ["string"],
      "confronto_con_principale": "string"
    }
  ] or [],
  "sintesi_tecnica": "Breve valutazione complessiva del programma (max 3 frasi)"
}`;
}

// Prompt per Fase 3: Sintesi Commerciale
function getPhase3Prompt(
  phase1Result: Phase1Result, 
  phase2Result: Phase2Result, 
  zanichelliManuals: any[], 
  subjectName: string,
  bibliography?: BibliographyData
): string {
  // Costruisci la sezione bibliografia se fornita
  let bibliographySection = "";
  if (bibliography?.primaryManual || (bibliography?.alternativeManuals && bibliography.alternativeManuals.length > 0)) {
    bibliographySection = `\n## Bibliografia Adottata (fornita dall'utente)\n`;
    if (bibliography.primaryManual) {
      const isZanichelli = bibliography.primaryManual.type === "zanichelli";
      bibliographySection += `MANUALE PRINCIPALE: ${bibliography.primaryManual.title} - ${bibliography.primaryManual.author} (${bibliography.primaryManual.publisher})\n`;
      bibliographySection += `TIPO: ${isZanichelli ? "ZANICHELLI - già adottato!" : "COMPETITOR"}\n\n`;
    }
    if (bibliography.alternativeManuals && bibliography.alternativeManuals.length > 0) {
      bibliographySection += `MANUALI ALTERNATIVI:\n`;
      bibliography.alternativeManuals.forEach((m, i) => {
        const isZanichelli = m.type === "zanichelli";
        bibliographySection += `${i + 1}. ${m.title} - ${m.author} (${m.publisher}) [${isZanichelli ? "ZANICHELLI" : "COMPETITOR"}]\n`;
      });
    }
    bibliographySection += `\nNOTA STRATEGICA IMPORTANTE:
1. Se Zanichelli è già il MANUALE PRINCIPALE: obiettivo è consolidare l'adozione
2. Se Zanichelli è presente come ALTERNATIVA: obiettivo è farlo diventare principale
3. Se Zanichelli NON è presente: obiettivo è farlo aggiungere (prima come alternativa, poi come principale)
4. ANALIZZA TUTTI I MANUALI (principale + alternativi) per identificare punti di forza/debolezza rispetto all'offerta Zanichelli
5. La strategia commerciale deve considerare il panorama completo della bibliografia adottata\n`;
  }
  
  return `# RUOLO
Sei un consulente commerciale esperto nel settore dell'editoria universitaria, specializzato in strategie di vendita per docenti universitari.

# CONTESTO
Lavori per Zanichelli editore e devi generare raccomandazioni commerciali per un promotore che deve approcciare un docente universitario.

Hai a disposizione:
1. Profilo pedagogico del docente (Fase 1)
2. Analisi tecnica del programma (Fase 2)
3. Catalogo manuali Zanichelli per la materia
4. Bibliografia adottata dal docente (se fornita)

# INPUT

## Profilo Pedagogico (Fase 1)
${JSON.stringify(phase1Result, null, 2)}

## Analisi Tecnica (Fase 2)
${JSON.stringify(phase2Result, null, 2)}

## Catalogo Zanichelli per ${subjectName}
${JSON.stringify(zanichelliManuals, null, 2)}
${bibliographySection}

# TASK
Genera un "post-it" commerciale per il promotore con:
1. **Analisi Bibliografia Adottata** - OBBLIGATORIO se fornita:
   - Valutazione del MANUALE PRINCIPALE (punti di forza, debolezze, allineamento con programma)
   - Valutazione di OGNI MANUALE ALTERNATIVO (punti di forza, debolezze, confronto con principale)
   - Identificazione di quali manuali sono Zanichelli e quali competitor
2. Insight Principale (max 3 frasi)
3. Gap Identificati (classificati per tipologia e gravità)
4. Opportunità Zanichelli:
   - Se Zanichelli è GIÀ PRINCIPALE: come consolidare l'adozione
   - Se Zanichelli è GIÀ ALTERNATIVA: come farlo diventare principale (analizzando perché il principale attuale è stato scelto)
   - Se Zanichelli è ASSENTE: quale manuale proporre e perché
5. Argomentazioni di Vendita (4-5 messaggi chiave ordinati per impatto)
6. Strategia di Approccio (3 fasi con azioni, contenuti, materiali, obiettivi)
7. Post-it testuale (sintesi pronta per il promotore, max 200 parole)

# CLASSIFICAZIONE GAP
I gap devono essere classificati in 4 tipologie:
- "contenuto_mancante": argomenti del framework non coperti dal programma
- "profondita_insufficiente": argomenti trattati ma non con sufficiente profondità
- "approccio_diverso": argomenti presenti ma con approccio pedagogico diverso
- "risorse_carenti": mancanza di materiali di supporto (esercizi, laboratorio, digitale)

# ISTRUZIONI
- Usa un linguaggio professionale ma diretto
- Basa le raccomandazioni su evidenze concrete dalle fasi 1 e 2
- Personalizza le argomentazioni sul profilo pedagogico del docente
- Evita toni prescrittivi o giudicanti
- Enfatizza il valore aggiunto per studenti e docente
- Includi punti di attenzione per il promotore
- Se non ci sono manuali Zanichelli disponibili, indica "nessun manuale disponibile"
- IMPORTANTE: La piattaforma digitale di Zanichelli si chiama "MyZanichelli" (NON "MyLab" che è di Pearson). Quando parli di risorse digitali Zanichelli, usa sempre "MyZanichelli" o "piattaforma digitale Zanichelli"

# FORMATO OUTPUT
Rispondi SOLO con un JSON valido, senza markdown o altro testo:
{
  "analisi_bibliografia": {
    "manuale_principale": {
      "titolo": "string",
      "autore": "string",
      "editore": "string",
      "tipo": "zanichelli o competitor",
      "valutazione": "string (breve valutazione punti forza e debolezza in 2-3 frasi)",
      "allineamento_programma": number
    },
    "manuali_alternativi": [
      {
        "titolo": "string",
        "autore": "string",
        "editore": "string",
        "tipo": "zanichelli o competitor",
        "confronto": "string (breve confronto con principale in 1-2 frasi)"
      }
    ],
    "posizione_zanichelli": "principale o alternativa o assente",
    "sintesi_competitiva": "string (max 3 frasi)"
  },
  "insight_principale": "string (max 3 frasi)",
  "gap_identificati": [
    {
      "tipo": "contenuto_mancante" | "profondita_insufficiente" | "approccio_diverso" | "risorse_carenti",
      "descrizione": "string",
      "gravita": "alta" | "media" | "bassa",
      "modulo_riferimento": "string" or null,
      "impatto_commerciale": "string"
    }
  ],
  "opportunita_zanichelli": {
    "manuale_consigliato": {
      "id": number,
      "titolo": "string",
      "autore": "string"
    } or null,
    "punti_forza_vs_competitor": [
      {
        "area": "string",
        "descrizione": "string",
        "rilevanza_per_programma": "string"
      }
    ],
    "allineamento_profilo_pedagogico": number
  },
  "argomentazioni_vendita": [
    {
      "ordine": number,
      "messaggio": "string",
      "supporto": "string",
      "impatto": "string (alto/medio/basso)"
    }
  ],
  "strategia_approccio": {
    "fase_1": {
      "azione": "string",
      "contenuto": "string",
      "materiali": ["string"],
      "obiettivo": "string"
    },
    "fase_2": {
      "azione": "string",
      "contenuto": "string",
      "materiali": ["string"],
      "obiettivo": "string"
    },
    "fase_3": {
      "azione": "string",
      "contenuto": "string",
      "materiali": ["string"],
      "obiettivo": "string"
    },
    "punti_attenzione": ["string"]
  },
  "post_it": "string (sintesi testuale pronta per il promotore, max 200 parole)"
}`;
}

// Funzione per pulire e parsare la risposta JSON
function parseJSONResponse(response: string): any {
  // Rimuovi eventuali markdown code blocks
  let cleaned = response.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("[Analysis] Failed to parse JSON response:", error);
    console.error("[Analysis] Raw response:", response.substring(0, 500));
    throw new Error("Errore nel parsing della risposta AI. Riprova.");
  }
}

// Funzione principale di analisi
export async function runFullAnalysis(input: AnalysisInput): Promise<FullAnalysisResult> {
  console.log("[Analysis] Starting full analysis for subject:", input.subjectId);
  
  // Estrai il testo se il contenuto è un PDF
  let programText = input.programText;
  if (isPDF(programText)) {
    console.log("[Analysis] Detected PDF content, extracting text...");
    try {
      const buffer = Buffer.from(programText, 'binary');
      const parsed = await parsePDF(buffer);
      programText = parsed.text;
      console.log(`[Analysis] Extracted ${programText.length} characters from PDF`);
    } catch (error) {
      console.error("[Analysis] Failed to parse PDF:", error);
      throw new Error("Impossibile estrarre il testo dal PDF. Prova a copiare e incollare il testo direttamente.");
    }
  }
  
  // Ottieni i dati necessari dal database
  const subject = await db.getSubjectById(input.subjectId);
  if (!subject) {
    throw new Error("Materia non trovata");
  }
  
  const framework = await db.getActiveFramework(input.subjectId);
  if (!framework) {
    throw new Error(`Nessun framework attivo trovato per ${subject.name}. Carica prima un framework.`);
  }
  
  const zanichelliManuals = await db.getZanichelliManuals(input.subjectId);
  
  // FASE 1: Analisi Contestuale
  console.log("[Analysis] Phase 1: Contextual Analysis");
  const phase1Prompt = getPhase1Prompt(programText);
  const phase1Response = await invokeLLMWithUserPreference(input.userId, {
    messages: [
      { role: "system", content: "Sei un assistente esperto di didattica universitaria. Rispondi SOLO con JSON valido." },
      { role: "user", content: phase1Prompt }
    ],
  });
  
  const phase1Content = phase1Response.content;
  const phase1Result: Phase1Result = parseJSONResponse(phase1Content);
  console.log("[Analysis] Phase 1 completed");
  
  // FASE 2: Analisi Tecnica
  console.log("[Analysis] Phase 2: Technical Analysis");
  const bibliographyData: BibliographyData = {
    primaryManual: input.primaryManual,
    alternativeManuals: input.alternativeManuals,
  };
  const phase2Prompt = getPhase2Prompt(input.programText, framework.content, phase1Result, subject.name, bibliographyData);
  const phase2Response = await invokeLLMWithUserPreference(input.userId, {
    messages: [
      { role: "system", content: `Sei un esperto di ${subject.name}. Rispondi SOLO con JSON valido.` },
      { role: "user", content: phase2Prompt }
    ],
  });
  
  const phase2Content = phase2Response.content;
  const phase2Result: Phase2Result = parseJSONResponse(phase2Content);
  console.log("[Analysis] Phase 2 completed");
  
  // FASE 3: Sintesi Commerciale
  console.log("[Analysis] Phase 3: Commercial Synthesis");
  const phase3Prompt = getPhase3Prompt(phase1Result, phase2Result, zanichelliManuals, subject.name, bibliographyData);
  const phase3Response = await invokeLLMWithUserPreference(input.userId, {
    messages: [
      { role: "system", content: "Sei un consulente commerciale per Zanichelli. Rispondi SOLO con JSON valido." },
      { role: "user", content: phase3Prompt }
    ],
  });
  
  const phase3Content = phase3Response.content;
  const phase3Result: Phase3Result = parseJSONResponse(phase3Content);
  console.log("[Analysis] Phase 3 completed");
  
  // Componi il risultato finale
  const result: FullAnalysisResult = {
    metadata: {
      data_analisi: new Date().toISOString().split("T")[0],
      materia: subject.name,
      corso_laurea: phase1Result.target_studenti?.corso_di_laurea || "Non specificato",
      ateneo: input.universityName || phase1Result.contesto_istituzionale?.ateneo || "Non specificato",
      docente: input.professorName || "Non specificato",
      versione_sistema: "1.0",
      program_text_extracted: programText, // Testo estratto (utile se era PDF)
    },
    fase_1_contestuale: phase1Result,
    fase_2_tecnica: phase2Result,
    fase_3_commerciale: phase3Result,
  };
  
  console.log("[Analysis] Full analysis completed successfully");
  return result;
}

// Funzione per salvare l'analisi nel database
export async function saveAnalysis(
  userId: number,
  subjectId: number,
  universityName: string,
  programTitle: string,
  professorName: string | null,
  programText: string,
  result: FullAnalysisResult,
  degreeCourse?: string,
  primaryManualId?: number,
  primaryManualCustom?: { title: string; author: string; publisher: string },
  alternativeManuals?: Array<{ manualId?: number; custom?: { title: string; author: string; publisher: string } }>
): Promise<number> {
  // Tronca il contenuto se troppo lungo (max 60000 caratteri per text field MySQL)
  const truncatedContent = programText.length > 60000 
    ? programText.substring(0, 60000) + "\n\n[CONTENUTO TRONCATO]" 
    : programText;
  
  const analysisId = await db.createAnalysis({
    userId,
    subjectId,
    programTitle,
    programContent: truncatedContent,
    universityName,
    professorName,
    degreeCourse: degreeCourse || result.metadata.corso_laurea,
    primaryManualId: primaryManualId || null,
    primaryManualCustom: primaryManualCustom || null,
    alternativeManuals: alternativeManuals || null,
    contextualAnalysis: result.fase_1_contestuale,
    technicalAnalysis: result.fase_2_tecnica,
    gaps: result.fase_3_commerciale.gap_identificati,
    postIt: result.fase_3_commerciale,
    status: "completed",
  });
  
  return analysisId;
}
