/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";


/**
 * UNI-SCAN Shared Types
 * Tipi condivisi tra frontend e backend
 */

// Materie supportate
export const SUBJECTS = [
  { code: "analisi_1", name: "Analisi 1" },
  { code: "analisi_2", name: "Analisi 2" },
  { code: "fisica_1", name: "Fisica 1" },
  { code: "fisica_2", name: "Fisica 2" },
  { code: "fisica_generale", name: "Fisica Generale" },
  { code: "chimica_generale", name: "Chimica Generale" },
  { code: "chimica_organica", name: "Chimica Organica" },
  { code: "economia_politica", name: "Economia Politica" },
  { code: "istologia", name: "Istologia" },
] as const;

export type SubjectCode = (typeof SUBJECTS)[number]["code"];

// API Providers
export type ApiProvider = "openai" | "perplexity" | "claude" | "dropbox";

// Gap Types per email generation
export const GAP_TYPES = {
  coverage_gap: {
    id: "coverage_gap",
    name: "Copertura",
    description: "Argomento completamente assente",
    priority: 1,
    tone: "Urgente, Solutivo",
  },
  currency_gap: {
    id: "currency_gap",
    name: "Attualità",
    description: "Dati/casi/normative obsoleti",
    priority: 2,
    tone: "Autorevole, Pratico",
  },
  depth_gap: {
    id: "depth_gap",
    name: "Profondità",
    description: "Argomento trattato superficialmente",
    priority: 3,
    tone: "Empatico, Facilitante",
  },
  pedagogy_gap: {
    id: "pedagogy_gap",
    name: "Approccio",
    description: "Metodo didattico non allineato",
    priority: 4,
    tone: "Intellettuale, Rispettoso",
  },
} as const;

export type GapType = keyof typeof GAP_TYPES;

// Gap structure
export interface Gap {
  type: GapType;
  topic: string;
  importance: "alta" | "media" | "bassa";
  description: string;
  programPercentage?: number;
}

// Framework Module structure
export interface FrameworkModule {
  id: number;
  name: string;
  description?: string;
  subtopics: string[];
  weight?: number;
}

export interface FrameworkContent {
  version: string;
  subject: string;
  modules: FrameworkModule[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
    notes?: string;
  };
}

// Manual Index structure
export interface ManualChapter {
  number: number;
  title: string;
  pageStart: number;
  pageEnd?: number;
  sections?: {
    title: string;
    pageStart: number;
  }[];
}

export interface ManualIndexContent {
  version: string;
  chapters: ManualChapter[];
  metadata?: {
    totalPages: number;
    hasExercises: boolean;
    hasOnlineResources: boolean;
    notes?: string;
  };
}

// Manual Evaluation structure (Scenario 2)
export interface ManualEvaluationContent {
  metadata: {
    manualId: string;
    title: string;
    author: string;
    publisher: string;
    edition?: string;
    year?: number;
    subject: string;
    type: "zanichelli" | "competitor";
    evaluationDate: string;
    frameworkVersion: string;
  };
  overview: {
    didacticApproach: {
      description: string;
      mainCharacteristics: string[];
      targetStudents: string;
      supportedMethodologies: string[];
    };
    contentLevel: {
      breadth: string;
      depth: string;
      theoryPracticeBalance: string;
      advancedTopics: string[];
      prerequisites: string[];
    };
    focus: {
      mainFocus: string;
      secondaryFocus: string[];
      orientation: string;
      distinctiveElements: string[];
    };
  };
  frameworkCoverage: {
    totalScore: number;
    modules: {
      moduleId: number;
      moduleName: string;
      coveragePercentage: number;
      coveredSubtopics: string[];
      omittedSubtopics: string[];
      depthLevel: "superficiale" | "intermedio" | "avanzato";
      dedicatedPages: number;
      notes?: string;
    }[];
    wellCoveredModules: number[];
    partiallyCoveredModules: number[];
    omittedModules: number[];
    extraFrameworkTopics: string[];
  };
  strengths: {
    area: string;
    description: string;
    impact: "alto" | "medio" | "basso";
    relevantDegrees: string[];
  }[];
  weaknesses: {
    area: string;
    description: string;
    severity: "alta" | "media" | "bassa";
    affectedDegrees: string[];
    possibleSolution?: string;
  }[];
  overallEvaluation: {
    finalScore: number;
    verdict: "Eccellente" | "Buono" | "Sufficiente" | "Sconsigliato";
    summary: string;
    recommendationsByDegree: Record<
      string,
      {
        verdict: string;
        motivation: string;
      }
    >;
    competitorComparison?: Record<string, string>;
  };
  additionalConsiderations?: {
    scientificUpdate?: string;
    languageAccessibility?: string;
    teacherSupport?: string;
    price?: string;
    alternativeEditions?: string;
    specialNotes?: string;
  };
}

// Contextual Analysis (Phase 1)
export interface ContextualAnalysis {
  didacticPhilosophy: {
    mainApproach: string;
    theoryPracticeBalance: string;
    rigorLevel: string;
    accessibilityLevel: string;
    applicationEmphasis: string;
    interdisciplinarity: string;
    confidence: number;
  };
  pedagogicalPriorities: {
    depthVsBreadth: string;
    didacticSequence: string;
    methodologies: string[];
    evaluation: {
      modalities: string[];
      inProgressTests: boolean;
    };
    confidence: number;
  };
  targetStudents: {
    degreeCourse: string;
    curriculum?: string;
    year: number;
    expectedBackground: string[];
    formativeObjectives: string;
    confidence: number;
  };
  institutionalContext: {
    university: string;
    department: string;
    orientation: string;
    stakeholders: string[];
    confidence: number;
  };
  profileSummary: string;
}

// Technical Analysis (Phase 2)
export interface TechnicalAnalysis {
  moduleCoverage: {
    moduleId: number;
    moduleName: string;
    coveragePercentage: number;
    coveredTopics: string[];
    omittedTopics: string[];
    extraTopics: string[];
    depthLevel: string;
    notes?: string;
  }[];
  totalCoverage: number;
  wellCoveredModules: number[];
  partiallyCoveredModules: number[];
  omittedModules: number[];
  depthBreadth: {
    generalLevel: string;
    distribution: {
      introductory: number;
      intermediate: number;
      advanced: number;
    };
    theoryApplicationBalance: string;
    advancedTopics: string[];
  };
  sequenceOrganization: {
    approach: string;
    logicalOrder: string;
    prerequisitesRespected: boolean;
    topicIntegration: string;
  };
  adoptedManualAlignment?: {
    title: string;
    author: string;
    publisher: string;
    edition?: string;
    year?: number;
    programAlignment: number;
    usedChapters: number[];
    unusedChapters: number[];
    programTopicsNotInManual: string[];
  };
}

// Post-it structure
export interface PostIt {
  professorInsight: string;
  adoptedManualEvaluation: string;
  recommendedManual: {
    title: string;
    author: string;
    publisher: string;
  };
  salesArguments: string[];
  keyGaps: Gap[];
}

// Email structure
export interface GeneratedEmail {
  subject: string;
  subjectAlternatives: string[];
  body: string;
  primaryGap: GapType;
  secondaryGaps: GapType[];
  promoterNotes: string;
}

// Analysis status
export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";
