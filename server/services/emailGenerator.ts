/**
 * Email Generator Service
 * Genera email personalizzate basate sui gap rilevati dall'analisi
 */

import { invokeLLMWithUserPreference } from "./llm";

interface GapInfo {
  type: "coverage_gap" | "depth_gap" | "currency_gap" | "pedagogy_gap";
  argomento: string;
  importanza: string;
  descrizione: string;
}

interface PromoterInfo {
  nome: string;
  telefono?: string;
  email?: string;
}

interface EmailGenerationInput {
  userId: number;
  analisiContestuale: any;
  analisiTecnica: any;
  gapRilevati: GapInfo[];
  manualeAdottato?: {
    titolo: string;
    autori: string;
    annoEdizione?: string;
  };
  manualeZanichelliRaccomandato?: {
    titolo: string;
    autori: string;
    annoEdizione?: string;
    vantaggi?: string[];
  };
  datiPromotore: PromoterInfo;
  nomeDocente?: string;
  titoloCorso: string;
  areaDisciplinare: string;
}

interface GeneratedEmail {
  oggetto: string;
  corpo: string;
  gap_primario: string;
  gap_secondari: string[];
  note_per_promotore: string;
}

const EMAIL_GENERATION_PROMPT = `Sei un esperto di copywriting per email B2B nel settore editoriale accademico.

Il tuo compito è generare un'email di primo contatto personalizzata per un promotore 
editoriale Zanichelli che vuole proporre un manuale a un docente universitario.

CONTESTO:
- Il promotore ha analizzato il programma del corso del docente
- Sono stati rilevati uno o più gap tra il programma e il manuale attualmente adottato
- Esiste un manuale Zanichelli specifico che risolve questi gap

IMPORTANTE: Se è specificato un "manualeZanichelliRaccomandato", DEVI menzionare esplicitamente 
il titolo e l'autore del manuale nel corpo dell'email. Non usare termini generici come 
"il nostro manuale" o "un manuale Zanichelli", ma cita sempre il titolo specifico.

INPUT:
{INPUT_JSON}

ISTRUZIONI:

1. IDENTIFICA IL GAP PRIMARIO usando questa priorità:
   - coverage_gap (priorità 1 - argomento completamente assente)
   - currency_gap (priorità 2 - dati/normative obsoleti)
   - depth_gap (priorità 3 - argomento trattato superficialmente)
   - pedagogy_gap (priorità 4 - metodo didattico non allineato)

2. GENERA L'OGGETTO EMAIL:
   - Deve essere specifico e pertinente al gap primario
   - Deve menzionare l'argomento specifico o il corso
   - Deve essere professionale ma accattivante
   - Max 60 caratteri

3. GENERA IL CORPO EMAIL seguendo questa struttura:

   APERTURA (2-3 righe):
   - Saluto formale con "Gentile Prof. {COGNOME}"
   - Presentazione breve del promotore
   - Menzione specifica di un aspetto del programma che dimostra di averlo letto

   PROBLEMA (3-4 righe):
   - Descrizione empatica del gap rilevato
   - Riferimento al manuale attualmente adottato (se noto)
   - Conseguenze per gli studenti (se pertinente)

   SOLUZIONE (4-5 righe):
   - Presentazione del manuale Zanichelli raccomandato CON TITOLO E AUTORE ESPLICITI
     Esempio: "Le propongo di valutare 'Principi di Economia' di N. Gregory Mankiw (Zanichelli)..."
   - 3 vantaggi specifici in formato bullet point
   - Frase di rassicurazione sulla continuità/coerenza
   - [Se ci sono gap secondari] Menzione breve degli altri vantaggi
   
   NOTA: Se manualeZanichelliRaccomandato contiene titolo e autori, DEVI usarli nel testo.
   Non scrivere mai "il nostro manuale di Istituzioni di Economia" ma "'Principi di Economia' di Mankiw"

   CTA (2 righe):
   - Proposta di invio copia saggio
   - Frase di chiusura con incentivo

   FIRMA:
   - Nome promotore
   - Ruolo: "Promotore Editoriale - Zanichelli"
   - Contatti (telefono e email se disponibili)

4. TONO:
   - Professionale e rispettoso
   - Empatico verso le sfide del docente
   - Autorevole ma non presuntuoso
   - Focalizzato sui benefici per gli studenti

5. TERMINOLOGIA IMPORTANTE:
   - La piattaforma digitale di Zanichelli si chiama "MyZanichelli" (NON "MyLab" che è di Pearson)
   - Quando parli di risorse digitali Zanichelli, usa sempre "MyZanichelli" o "piattaforma digitale Zanichelli"

6. LUNGHEZZA:
   - Corpo email: 200-250 parole
   - Oggetto: max 60 caratteri

OUTPUT (formato JSON):
{
  "oggetto": "...",
  "corpo": "...",
  "gap_primario": "depth_gap",
  "gap_secondari": ["currency_gap"],
  "note_per_promotore": "Questa email si concentra sul gap di profondità..."
}`;

/**
 * Estrae i gap dall'analisi tecnica
 */
function extractGapsFromAnalysis(technicalAnalysis: any): GapInfo[] {
  const gaps: GapInfo[] = [];
  
  if (!technicalAnalysis) return gaps;
  
  // Estrai gap dalla struttura dell'analisi tecnica
  const gapData = technicalAnalysis.gap_analysis || technicalAnalysis.gaps || [];
  
  if (Array.isArray(gapData)) {
    for (const gap of gapData) {
      if (gap.tipo || gap.type) {
        gaps.push({
          type: mapGapType(gap.tipo || gap.type),
          argomento: gap.argomento || gap.topic || gap.area || "Non specificato",
          importanza: gap.importanza || gap.importance || gap.priorita || "MEDIA",
          descrizione: gap.descrizione || gap.description || gap.dettaglio || "",
        });
      }
    }
  }
  
  // Se non ci sono gap strutturati, cerca nelle opportunità
  if (gaps.length === 0 && technicalAnalysis.opportunita_commerciali) {
    const opps = technicalAnalysis.opportunita_commerciali;
    if (Array.isArray(opps)) {
      for (const opp of opps) {
        gaps.push({
          type: "depth_gap",
          argomento: opp.area || opp.argomento || "Area di miglioramento",
          importanza: opp.priorita || "MEDIA",
          descrizione: opp.descrizione || opp.motivazione || "",
        });
      }
    }
  }
  
  return gaps;
}

/**
 * Mappa il tipo di gap al formato standard
 */
function mapGapType(tipo: string): GapInfo["type"] {
  const tipoLower = tipo.toLowerCase();
  if (tipoLower.includes("copertura") || tipoLower.includes("coverage") || tipoLower.includes("assente")) {
    return "coverage_gap";
  }
  if (tipoLower.includes("attualità") || tipoLower.includes("currency") || tipoLower.includes("obsolet") || tipoLower.includes("aggiornamento")) {
    return "currency_gap";
  }
  if (tipoLower.includes("profondità") || tipoLower.includes("depth") || tipoLower.includes("superficial")) {
    return "depth_gap";
  }
  if (tipoLower.includes("pedagogia") || tipoLower.includes("pedagogy") || tipoLower.includes("approccio") || tipoLower.includes("metodo")) {
    return "pedagogy_gap";
  }
  return "depth_gap"; // Default
}

/**
 * Genera un'email personalizzata basata sull'analisi
 */
export async function generateEmail(input: EmailGenerationInput): Promise<GeneratedEmail> {
  const { userId, ...inputData } = input;
  const inputJson = JSON.stringify(inputData, null, 2);
  const prompt = EMAIL_GENERATION_PROMPT.replace("{INPUT_JSON}", inputJson);
  
  try {
    const response = await invokeLLMWithUserPreference(userId, {
      messages: [
        {
          role: "system",
          content: "Sei un esperto di copywriting per email B2B nel settore editoriale accademico. Rispondi SOLO con JSON valido, senza markdown o altri formati.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    
    const content = response.content;
    
    // Estrai JSON dalla risposta
    let jsonStr = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const result = JSON.parse(jsonStr as string) as GeneratedEmail;
    return result;
  } catch (error) {
    console.error("[EmailGenerator] Error:", error);
    throw new Error("Errore nella generazione dell'email");
  }
}

/**
 * Genera un'email a partire dai risultati dell'analisi completa
 */
export async function generateEmailFromAnalysis(
  userId: number,
  analysisResult: any,
  promoterInfo: PromoterInfo,
  additionalInfo?: {
    nomeDocente?: string;
    titoloCorso?: string;
    areaDisciplinare?: string;
  }
): Promise<GeneratedEmail> {
  // Estrai i gap dall'analisi tecnica
  const gaps = extractGapsFromAnalysis(analysisResult.analisi_tecnica);
  
  // Se non ci sono gap, genera comunque un'email generica
  if (gaps.length === 0) {
    gaps.push({
      type: "depth_gap",
      argomento: "Supporto didattico",
      importanza: "MEDIA",
      descrizione: "Opportunità di migliorare il supporto didattico con materiali aggiornati",
    });
  }
  
  // Estrai info sul manuale raccomandato
  const raccomandazione = analysisResult.sintesi_commerciale?.raccomandazione_manuale || 
                          analysisResult.raccomandazione_manuale || {};
  
  const input: EmailGenerationInput = {
    userId,
    analisiContestuale: analysisResult.analisi_contestuale,
    analisiTecnica: analysisResult.analisi_tecnica,
    gapRilevati: gaps,
    manualeAdottato: analysisResult.analisi_contestuale?.manuale_identificato ? {
      titolo: analysisResult.analisi_contestuale.manuale_identificato.titolo || "Non identificato",
      autori: analysisResult.analisi_contestuale.manuale_identificato.autori || "",
      annoEdizione: analysisResult.analisi_contestuale.manuale_identificato.anno || "",
    } : undefined,
    manualeZanichelliRaccomandato: raccomandazione.titolo ? {
      titolo: raccomandazione.titolo,
      autori: raccomandazione.autori || "",
      annoEdizione: raccomandazione.anno || "",
      vantaggi: raccomandazione.vantaggi || raccomandazione.punti_forza || [],
    } : undefined,
    datiPromotore: promoterInfo,
    nomeDocente: additionalInfo?.nomeDocente || 
                 analysisResult.metadata?.professor_name || 
                 "Docente",
    titoloCorso: additionalInfo?.titoloCorso || 
                 analysisResult.metadata?.course_name || 
                 "Corso",
    areaDisciplinare: additionalInfo?.areaDisciplinare || 
                      analysisResult.metadata?.subject_name || 
                      "Area disciplinare",
  };
  
  return generateEmail(input);
}

export { GapInfo, PromoterInfo, EmailGenerationInput, GeneratedEmail };
