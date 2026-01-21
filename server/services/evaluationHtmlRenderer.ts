/**
 * Renders ImprovedEvaluationResult to HTML for display
 */

import { ImprovedEvaluationResult } from "./improvedManualEvaluator";

export function renderEvaluationToHtml(
  evaluation: ImprovedEvaluationResult,
  manual: { title: string; author: string; publisher: string }
): string {
  const verdictClass = `verdict-${evaluation.verdict.toLowerCase()}`;
  
  const strengthsHtml = evaluation.strengths
    .map(s => `
    <div class="strength">
      <h3>${escapeHtml(s.title)}</h3>
      <p>${escapeHtml(s.explanation)}</p>
    </div>
  `).join('');

  const weaknessesHtml = evaluation.weaknesses
    .map(w => `
    <div class="weakness">
      <h3>${escapeHtml(w.title)}</h3>
      <p>${escapeHtml(w.explanation)}</p>
    </div>
  `).join('');

  const moduleAnalysisHtml = evaluation.moduleByModuleAnalysis
    .map(m => `
    <div class="coverage-item">
      <h3>${escapeHtml(m.moduleName)}</h3>
      <p><span class="badge badge-blue">${m.coverage}%</span></p>
      <p>${escapeHtml(m.explanation)}</p>
    </div>
  `).join('');

  const degreeCompatibilityHtml = evaluation.degreeCompatibility
    .map(d => `
    <div class="degree-compatibility">
      <h3>${escapeHtml(d.degreeProgram)}: <span class="badge badge-${getBadgeColor(d.compatible)}">${escapeHtml(d.compatible)}</span></h3>
      <p><strong>Reasoning:</strong> ${escapeHtml(d.reasoning)}</p>
      <p><strong>Critical modules:</strong> ${escapeHtml(d.criticalModules.join(', '))}</p>
      <p><strong>Gaps:</strong> ${escapeHtml(d.gaps.join(', '))}</p>
      <p><strong>Recommendations:</strong> ${escapeHtml(d.recommendations)}</p>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Valutazione - ${escapeHtml(manual.title)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 0.5rem; }
    h2 { color: #1e40af; margin-top: 2rem; }
    h3 { color: #374151; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .score { text-align: right; }
    .score-value { font-size: 3rem; font-weight: bold; color: #1e40af; }
    .verdict { display: inline-block; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 600; margin-right: 1rem; }
    .verdict-eccellente { background: #dcfce7; color: #166534; }
    .verdict-buono { background: #dbeafe; color: #1e40af; }
    .verdict-sufficiente { background: #fef9c3; color: #854d0e; }
    .verdict-sconsigliato { background: #fee2e2; color: #991b1b; }
    .section { margin: 1.5rem 0; padding: 1rem; background: #f8fafc; border-radius: 0.5rem; }
    .strength { background: #dcfce7; padding: 1rem; border-radius: 0.5rem; margin: 0.5rem 0; border-left: 4px solid #166534; }
    .weakness { background: #fee2e2; padding: 1rem; border-radius: 0.5rem; margin: 0.5rem 0; border-left: 4px solid #991b1b; }
    .coverage-item { background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; margin: 0.5rem 0; }
    .degree-compatibility { background: #f0fdf4; padding: 1rem; border-radius: 0.5rem; margin: 0.5rem 0; border-left: 4px solid #1e40af; }
    .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; margin-right: 0.5rem; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-yellow { background: #fef9c3; color: #854d0e; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f1f5f9; font-weight: 600; }
    p { margin: 0.5rem 0; }
    strong { font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${escapeHtml(manual.title)}</h1>
      <p><strong>${escapeHtml(manual.author)}</strong> • ${escapeHtml(manual.publisher)}</p>
    </div>
    <div class="score">
      <span class="verdict ${verdictClass}">${escapeHtml(evaluation.verdict)}</span>
      <div class="score-value">${evaluation.overallScore}</div>
      <div>/ 100</div>
    </div>
  </div>

  <h2>Panoramica</h2>
  <div class="section">
    <p>${escapeHtml(evaluation.overview)}</p>
  </div>

  <h2>Punti di Forza</h2>
  ${strengthsHtml}

  <h2>Punti Deboli</h2>
  ${weaknessesHtml}

  <h2>Copertura Framework</h2>
  ${moduleAnalysisHtml}

  <h2>Compatibilità per Classe di Laurea</h2>
  ${degreeCompatibilityHtml}

  <h2>Sintesi Esecutiva</h2>
  <div class="section">
    <p>${escapeHtml(evaluation.executiveSummary)}</p>
  </div>

  <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.875rem;">
    <p>Valutazione generata da UNI-SCAN il ${new Date().toLocaleDateString('it-IT')}</p>
  </footer>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function getBadgeColor(compatible: string): string {
  switch (compatible) {
    case 'Ideale':
      return 'green';
    case 'Buono':
      return 'blue';
    case 'Parziale':
      return 'yellow';
    case 'Non consigliato':
      return 'red';
    default:
      return 'blue';
  }
}
