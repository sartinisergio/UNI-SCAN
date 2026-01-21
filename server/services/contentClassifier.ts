/**
 * Content Classifier - Infers content type and metrics from chapter/section titles
 * Helps estimate exercise count, examples, and content structure
 */

export type ContentType = 
  | 'theory'
  | 'exercises'
  | 'examples'
  | 'case_study'
  | 'problems'
  | 'solutions'
  | 'appendix'
  | 'summary'
  | 'mixed';

export interface SectionAnalysis {
  title: string;
  contentType: ContentType;
  confidence: number; // 0-100
  estimatedExercises: number;
  estimatedExamples: number;
  estimatedPages: number;
  notes: string;
}

export interface ChapterAnalysis {
  chapterNumber: number;
  chapterTitle: string;
  totalPages: number;
  sections: SectionAnalysis[];
  contentTypeDistribution: Record<ContentType, number>;
  estimatedTotalExercises: number;
  estimatedTotalExamples: number;
}

const EXERCISE_KEYWORDS = [
  'esercizi', 'exercise', 'exercises', 'problemi', 'problem', 'problems',
  'domande', 'questions', 'quesiti', 'test', 'quiz', 'pratica', 'practice',
  'applicazioni', 'applications', 'compiti', 'homework', 'lavoro', 'work',
  'attività', 'activities', 'sfide', 'challenges'
];

const EXAMPLE_KEYWORDS = [
  'esempi', 'example', 'examples', 'caso', 'case', 'casi', 'cases',
  'applicazione', 'application', 'applicazioni', 'applications',
  'illustrazione', 'illustration', 'illustrazioni', 'illustrations',
  'scenario', 'scenarios', 'situazione', 'situation', 'situazioni',
  'reale', 'real', 'concreto', 'concrete', 'pratico', 'practical'
];

const THEORY_KEYWORDS = [
  'introduzione', 'introduction', 'fondamenti', 'fundamentals', 'basics',
  'teoria', 'theory', 'concetti', 'concepts', 'principi', 'principles',
  'leggi', 'laws', 'definizioni', 'definitions', 'modelli', 'models',
  'spiegazione', 'explanation', 'descrizione', 'description'
];

const SUMMARY_KEYWORDS = [
  'riassunto', 'summary', 'sommario', 'recap', 'riepilogo', 'review',
  'conclusione', 'conclusion', 'sintesi', 'synthesis', 'punti chiave',
  'key points', 'essenziale', 'essential'
];

const SOLUTIONS_KEYWORDS = [
  'soluzioni', 'solutions', 'risposte', 'answers', 'answer key',
  'chiave', 'key', 'svolgimento', 'working', 'risoluzione', 'resolution'
];

const APPENDIX_KEYWORDS = [
  'appendice', 'appendix', 'appendici', 'appendices', 'allegato',
  'attachment', 'tabelle', 'tables', 'dati', 'data', 'riferimento',
  'reference', 'tavole', 'charts'
];

function classifyContentType(title: string): { type: ContentType; confidence: number } {
  const lowerTitle = title.toLowerCase();
  
  // Check for solutions (highest priority)
  if (SOLUTIONS_KEYWORDS.some(kw => lowerTitle.includes(kw))) {
    return { type: 'solutions', confidence: 95 };
  }

  // Check for appendix
  if (APPENDIX_KEYWORDS.some(kw => lowerTitle.includes(kw))) {
    return { type: 'appendix', confidence: 90 };
  }

  // Check for summary
  if (SUMMARY_KEYWORDS.some(kw => lowerTitle.includes(kw))) {
    return { type: 'summary', confidence: 85 };
  }

  // Check for exercises
  const exerciseMatch = EXERCISE_KEYWORDS.some(kw => lowerTitle.includes(kw));
  
  // Check for examples
  const exampleMatch = EXAMPLE_KEYWORDS.some(kw => lowerTitle.includes(kw));
  
  // Check for theory
  const theoryMatch = THEORY_KEYWORDS.some(kw => lowerTitle.includes(kw));

  // Determine type based on matches
  if (exerciseMatch && !exampleMatch && !theoryMatch) {
    return { type: 'exercises', confidence: 90 };
  }
  
  if (exampleMatch && !exerciseMatch && !theoryMatch) {
    return { type: 'examples', confidence: 85 };
  }
  
  if (theoryMatch && !exerciseMatch && !exampleMatch) {
    return { type: 'theory', confidence: 85 };
  }

  // If multiple matches, it's mixed
  if ((exerciseMatch ? 1 : 0) + (exampleMatch ? 1 : 0) + (theoryMatch ? 1 : 0) > 1) {
    return { type: 'mixed', confidence: 70 };
  }

  // Check for case study
  if (lowerTitle.includes('caso') || lowerTitle.includes('case')) {
    return { type: 'case_study', confidence: 75 };
  }

  // Default to mixed if no clear match
  return { type: 'mixed', confidence: 40 };
}

function estimateExercises(
  contentType: ContentType,
  pages: number,
  title: string
): number {
  if (contentType === 'exercises' || contentType === 'problems') {
    // Exercise sections typically have 3-5 exercises per page
    return Math.round(pages * (3 + Math.random() * 2));
  }
  
  if (contentType === 'mixed') {
    // Mixed sections might have 1-2 exercises per page
    return Math.round(pages * (0.5 + Math.random() * 1));
  }

  if (contentType === 'case_study') {
    // Case studies might have 1-3 exercises
    return Math.round(1 + Math.random() * 2);
  }

  return 0;
}

function estimateExamples(
  contentType: ContentType,
  pages: number,
  title: string
): number {
  if (contentType === 'examples') {
    // Example sections have 2-4 examples per page
    return Math.round(pages * (2 + Math.random() * 2));
  }

  if (contentType === 'theory' || contentType === 'mixed') {
    // Theory sections typically have 0.5-1 example per page
    return Math.round(pages * (0.5 + Math.random() * 0.5));
  }

  if (contentType === 'case_study') {
    // Case studies are examples themselves
    return 1;
  }

  return 0;
}

export function analyzeSectionTitle(
  sectionTitle: string,
  pageStart: number,
  pageEnd: number
): SectionAnalysis {
  const pages = Math.max(1, pageEnd - pageStart);
  const { type, confidence } = classifyContentType(sectionTitle);
  
  const estimatedExercises = estimateExercises(type, pages, sectionTitle);
  const estimatedExamples = estimateExamples(type, pages, sectionTitle);

  return {
    title: sectionTitle,
    contentType: type,
    confidence,
    estimatedExercises,
    estimatedExamples,
    estimatedPages: pages,
    notes: `Inferred from title: "${sectionTitle}"`
  };
}

export function analyzeChapter(
  chapterNumber: number,
  chapterTitle: string,
  sections: Array<{ title: string; page_start: number }>,
  nextChapterPageStart?: number
): ChapterAnalysis {
  const chapterPageStart = sections[0]?.page_start || 0;
  const chapterPageEnd = nextChapterPageStart || (chapterPageStart + 50); // Default 50 pages if unknown
  const totalPages = Math.max(1, chapterPageEnd - chapterPageStart);

  const analyzedSections = sections.map((section, idx) => {
    const sectionPageStart = section.page_start;
    const sectionPageEnd = sections[idx + 1]?.page_start || chapterPageEnd;
    return analyzeSectionTitle(section.title, sectionPageStart, sectionPageEnd);
  });

  // Calculate content type distribution
  const distribution: Record<ContentType, number> = {
    theory: 0,
    exercises: 0,
    examples: 0,
    case_study: 0,
    problems: 0,
    solutions: 0,
    appendix: 0,
    summary: 0,
    mixed: 0
  };

  analyzedSections.forEach(section => {
    distribution[section.contentType]++;
  });

  const totalExercises = analyzedSections.reduce((sum, s) => sum + s.estimatedExercises, 0);
  const totalExamples = analyzedSections.reduce((sum, s) => sum + s.estimatedExamples, 0);

  return {
    chapterNumber,
    chapterTitle,
    totalPages,
    sections: analyzedSections,
    contentTypeDistribution: distribution,
    estimatedTotalExercises: totalExercises,
    estimatedTotalExamples: totalExamples
  };
}

export function analyzeManualStructure(
  chapters: Array<{
    number: number;
    title: string;
    page_start: number;
    sections: Array<{ title: string; number: string; page_start: number }>;
  }>
): {
  totalEstimatedExercises: number;
  totalEstimatedExamples: number;
  totalEstimatedPages: number;
  chapterAnalyses: ChapterAnalysis[];
  contentDistribution: Record<ContentType, number>;
} {
  const chapterAnalyses: ChapterAnalysis[] = [];
  const contentDistribution: Record<ContentType, number> = {
    theory: 0,
    exercises: 0,
    examples: 0,
    case_study: 0,
    problems: 0,
    solutions: 0,
    appendix: 0,
    summary: 0,
    mixed: 0
  };

  let totalExercises = 0;
  let totalExamples = 0;
  let totalPages = 0;

  chapters.forEach((chapter, idx) => {
    const nextChapterPageStart = chapters[idx + 1]?.page_start;
    const analysis = analyzeChapter(
      chapter.number,
      chapter.title,
      chapter.sections,
      nextChapterPageStart
    );

    chapterAnalyses.push(analysis);
    totalExercises += analysis.estimatedTotalExercises;
    totalExamples += analysis.estimatedTotalExamples;
    totalPages += analysis.totalPages;

    // Update distribution
    Object.entries(analysis.contentTypeDistribution).forEach(([type, count]) => {
      contentDistribution[type as ContentType] += count;
    });
  });

  return {
    totalEstimatedExercises: totalExercises,
    totalEstimatedExamples: totalExamples,
    totalEstimatedPages: totalPages,
    chapterAnalyses,
    contentDistribution
  };
}
