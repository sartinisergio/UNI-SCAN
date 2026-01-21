/**
 * Framework Normalizer
 * 
 * Questo servizio normalizza strutture framework diverse in un formato standard.
 * Supporta molteplici formati di framework per gestire variazioni nei dati storici
 * e futuri.
 * 
 * Formati supportati:
 * 1. Chimica Generale: { modules: [...] }
 * 2. Istologia: { syllabus_modules: [...] }
 * 3. Generico: { moduli: [...] }
 * 
 * Ogni modulo deve avere:
 * - id: numero identificativo
 * - nome: nome del modulo
 * - argomenti: array di argomenti/concetti (estratti con priorita da key_concepts, poi altri campi)
 * 
 * Opzionali:
 * - key_concepts: array di concetti chiave estratti dall'LLM (priorita massima)
 * - core_contents: descrizione testuale del modulo (fallback se key_concepts non disponibili)
 * - coverage_percentage: percentuale di copertura
 * - class_data: dati per classe di laurea
 * - matched_concepts: concetti mappati
 * - missing_contents: contenuti mancanti
 */

interface NormalizedModule {
  id: number;
  nome: string;
  argomenti: string[];
  coverage_percentage?: number;
  class_data?: Record<string, any>;
  matched_concepts?: Array<{ name: string; frequency?: number }>;
  missing_contents?: string[];
}

interface NormalizedFramework {
  modules: NormalizedModule[];
  classes_analyzed?: string[];
  [key: string]: any;
}

/**
 * Normalizza un framework da qualsiasi formato supportato al formato standard
 * @param framework - Framework in qualsiasi formato
 * @returns Framework normalizzato con array "modules"
 */
export function normalizeFramework(framework: any): NormalizedFramework {
  if (!framework || typeof framework !== 'object') {
    return { modules: [] };
  }

  // Estrai i moduli dal framework, supportando molteplici nomi di campo
  let modules: any[] = [];

  // Prova i nomi di campo comuni in ordine di priorità
  if (Array.isArray(framework.modules)) {
    modules = framework.modules;
  } else if (Array.isArray(framework.moduli)) {
    modules = framework.moduli;
  } else if (Array.isArray(framework.syllabus_modules)) {
    modules = framework.syllabus_modules;
  } else if (framework.content && framework.content.content && Array.isArray(framework.content.content.syllabus_modules)) {
    // Support nested structure: framework.content.content.syllabus_modules
    modules = framework.content.content.syllabus_modules;
  } else if (framework.content && Array.isArray(framework.content.syllabus_modules)) {
    modules = framework.content.syllabus_modules;
  } else if (Array.isArray(framework.chapters)) {
    modules = framework.chapters;
  } else if (Array.isArray(framework.capitoli)) {
    modules = framework.capitoli;
  } else if (Array.isArray(framework.sections)) {
    modules = framework.sections;
  } else if (Array.isArray(framework.sezioni)) {
    modules = framework.sezioni;
  }

  // Normalizza ogni modulo
  const normalizedModules: NormalizedModule[] = modules.map((module, index) => {
    // Estrai il nome del modulo da vari campi possibili
    const moduleName = 
      module.nome || 
      module.name || 
      module.title || 
      module.titolo || 
      module.chapter_name || 
      module.section_name || 
      `Modulo ${index + 1}`;

    // Estrai gli argomenti da vari campi possibili
    let argomenti: string[] = [];
    
    // Priorità 1: key_concepts (estratti dall'LLM dai core_contents)
    if (Array.isArray(module.key_concepts)) {
      argomenti = module.key_concepts;
    } else if (Array.isArray(module.argomenti)) {
      argomenti = module.argomenti;
    } else if (Array.isArray(module.topics)) {
      argomenti = module.topics;
    } else if (Array.isArray(module.concepts)) {
      argomenti = module.concepts;
    } else if (Array.isArray(module.keywords)) {
      argomenti = module.keywords;
    } else if (Array.isArray(module.matched_concepts)) {
      // Se ci sono matched_concepts, estrai i nomi
      argomenti = module.matched_concepts
        .map((c: any) => c.name || c.concept || c.topic || '')
        .filter((name: string) => name.length > 0);
    } else if (module.core_contents && typeof module.core_contents === 'string') {
      // Se c'è un campo core_contents (descrizione testuale), estrailo come singolo elemento
      // L'LLM estrarrà i concetti chiave durante la valutazione
      argomenti = [module.core_contents];
    } else if (module.content && typeof module.content === 'string') {
      // Se c'è un campo content stringa, usalo
      argomenti = [module.content];
    }

    return {
      id: module.id || index + 1,
      nome: moduleName,
      argomenti: argomenti,
      ...(module.coverage_percentage !== undefined && { coverage_percentage: module.coverage_percentage }),
      ...(module.class_data && { class_data: module.class_data }),
      ...(module.matched_concepts && { matched_concepts: module.matched_concepts }),
      ...(module.missing_contents && { missing_contents: module.missing_contents }),
    };
  });

  // Restituisci il framework normalizzato
  return {
    modules: normalizedModules,
    ...(framework.classes_analyzed && { classes_analyzed: framework.classes_analyzed }),
    // Preserva altri campi del framework originale
    ...Object.keys(framework)
      .filter(key => !['modules', 'moduli', 'syllabus_modules', 'chapters', 'capitoli', 'sections', 'sezioni'].includes(key))
      .reduce((acc, key) => {
        acc[key] = framework[key];
        return acc;
      }, {} as Record<string, any>),
  };
}

/**
 * Estrae i moduli da un framework in qualsiasi formato
 * @param framework - Framework in qualsiasi formato
 * @returns Array di moduli normalizzati
 */
export function extractModules(framework: any): NormalizedModule[] {
  const normalized = normalizeFramework(framework);
  return normalized.modules;
}

/**
 * Verifica se un framework ha una struttura valida
 * @param framework - Framework da verificare
 * @returns true se il framework ha almeno un modulo
 */
export function isValidFramework(framework: any): boolean {
  const modules = extractModules(framework);
  return modules.length > 0;
}

/**
 * Ottiene una descrizione del formato del framework per logging
 * @param framework - Framework da analizzare
 * @returns Stringa descrittiva del formato rilevato
 */
export function getFrameworkFormat(framework: any): string {
  if (!framework || typeof framework !== 'object') {
    return 'invalid';
  }

  if (Array.isArray(framework.modules)) {
    return 'modules';
  } else if (Array.isArray(framework.moduli)) {
    return 'moduli';
  } else if (Array.isArray(framework.syllabus_modules)) {
    return 'syllabus_modules';
  } else if (Array.isArray(framework.chapters)) {
    return 'chapters';
  } else if (Array.isArray(framework.capitoli)) {
    return 'capitoli';
  } else if (Array.isArray(framework.sections)) {
    return 'sections';
  } else if (Array.isArray(framework.sezioni)) {
    return 'sezioni';
  }

  return 'unknown';
}
