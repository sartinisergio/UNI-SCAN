/**
 * Utility function to export manual comparison table as HTML
 */

interface ManualInfo {
  id: number;
  title: string;
  publisher: string;
}

interface EvaluationContent {
  overview?: {
    didacticApproach?: {
      description: string;
      economicSchool?: string;
    };
    contentLevel?: {
      breadth: string;
      depth: string;
      theoryPracticeBalance: string;
    };
  };
  strengths?: Array<{
    area: string;
    description: string;
    relevance: string;
  }>;
  weaknesses?: Array<{
    area: string;
    description: string;
    impact: string;
  }>;
  frameworkCoverage?: {
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
}

interface ComparisonData {
  manuals: ManualInfo[];
  evaluations: Record<number, { content: EvaluationContent } | undefined>;
  subject: string;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

function formatContentLevel(contentLevel: any): string {
  if (!contentLevel) return 'N/A';

  if (typeof contentLevel === 'string') {
    return contentLevel;
  }

  if (typeof contentLevel === 'object') {
    const parts = [];
    if (contentLevel.breadth) parts.push(`Ampiezza: ${contentLevel.breadth}`);
    if (contentLevel.depth) parts.push(`Profondità: ${contentLevel.depth}`);
    if (contentLevel.theoryPracticeBalance)
      parts.push(`Teoria/Pratica: ${contentLevel.theoryPracticeBalance}`);
    return parts.length > 0 ? parts.join(' | ') : 'N/A';
  }

  return 'N/A';
}

function renderValue(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  if (typeof value === 'string') {
    return escapeHtml(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => renderValue(v)).join(', ');
  }
  if (typeof value === 'object') {
    if (value.label) return escapeHtml(value.label);
    if (value.description) return escapeHtml(value.description);
    if (value.title) return escapeHtml(value.title);
    if (value.name) return escapeHtml(value.name);
    return JSON.stringify(value);
  }
  return escapeHtml(String(value));
}

export function generateComparisonHTML(data: ComparisonData): string {
  const { manuals, evaluations, subject } = data;
  const now = new Date();
  const dateStr = now.toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('it-IT');

  let html = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confronto Manuali - ${escapeHtml(subject)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            margin-bottom: 30px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 20px;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            color: #1a1a1a;
        }
        
        .header p {
            color: #666;
            font-size: 14px;
        }
        
        .metadata {
            display: flex;
            gap: 30px;
            margin-top: 15px;
            font-size: 13px;
            color: #888;
        }
        
        .metadata-item {
            display: flex;
            flex-direction: column;
        }
        
        .metadata-label {
            font-weight: 600;
            color: #666;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        thead {
            background-color: #f9f9f9;
        }
        
        th {
            border: 1px solid #ddd;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #333;
            background-color: #f0f0f0;
        }
        
        td {
            border: 1px solid #ddd;
            padding: 15px;
            vertical-align: top;
        }
        
        tr:nth-child(even) {
            background-color: #fafafa;
        }
        
        tr:hover {
            background-color: #f5f5f5;
        }
        
        .attribute-name {
            font-weight: 600;
            color: #1a1a1a;
            min-width: 150px;
        }
        
        .manual-header {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 5px;
        }
        
        .manual-publisher {
            font-size: 13px;
            color: #888;
        }
        
        ul {
            margin-left: 20px;
            margin-top: 10px;
        }
        
        li {
            margin-bottom: 8px;
        }
        
        .strength-item, .weakness-item {
            margin-bottom: 10px;
        }
        
        .strength-area, .weakness-area {
            font-weight: 600;
            color: #333;
        }
        
        .strength-description, .weakness-description {
            color: #666;
            margin-top: 3px;
            font-size: 14px;
        }
        
        .coverage-percentage {
            font-weight: 600;
            font-size: 16px;
            color: #2c5aa0;
        }
        
        .coverage-modules {
            font-size: 13px;
            color: #888;
            margin-top: 5px;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #999;
            text-align: right;
        }
        
        .no-evaluation {
            color: #d9534f;
            font-style: italic;
        }
        
        @media print {
            body {
                background-color: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Confronto Manuali</h1>
            <p>Analisi comparativa dei manuali universitari</p>
            <div class="metadata">
                <div class="metadata-item">
                    <span class="metadata-label">Materia:</span>
                    <span>${escapeHtml(subject)}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Data:</span>
                    <span>${dateStr} alle ${timeStr}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Manuali confrontati:</span>
                    <span>${manuals.length}</span>
                </div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Attributo</th>
                    ${manuals.map((manual) => `<th><div class="manual-header">${escapeHtml(manual.title)}</div><div class="manual-publisher">${escapeHtml(manual.publisher)}</div></th>`).join('')}
                </tr>
            </thead>
            <tbody>
`;

  // Define attributes to compare
  const attributes = [
    { key: 'didacticApproach', label: 'Approccio Didattico' },
    { key: 'contentLevel', label: 'Livello Contenuti' },
    { key: 'strengths', label: 'Punti di Forza' },
    { key: 'weaknesses', label: 'Punti Deboli' },
    { key: 'frameworkCoverage', label: 'Copertura Framework' },
  ];

  // Generate rows for each attribute
  attributes.forEach((attr) => {
    html += `                <tr>\n                    <td class="attribute-name">${attr.label}</td>\n`;

    manuals.forEach((manual) => {
      const evaluation = evaluations[manual.id];
      const content = evaluation?.content as any;
      const overview = content?.overview;

      html += '                    <td>';

      if (!evaluation || !content) {
        html += '<span class="no-evaluation">Nessuna valutazione</span>';
      } else if (attr.key === 'didacticApproach') {
        if (overview?.didacticApproach) {
          html += `<p>${escapeHtml(overview.didacticApproach.description)}</p>`;
          if (overview.didacticApproach.economicSchool) {
            html += `<p><strong>Scuola economica:</strong> ${escapeHtml(overview.didacticApproach.economicSchool)}</p>`;
          }
        } else {
          html += 'N/A';
        }
      } else if (attr.key === 'contentLevel') {
        html += `<p>${formatContentLevel(overview?.contentLevel)}</p>`;
      } else if (attr.key === 'strengths') {
        if (content.strengths && Array.isArray(content.strengths) && content.strengths.length > 0) {
          html += '<ul>';
          content.strengths.forEach((s: any) => {
            html += '<li class="strength-item">';
            if (typeof s === 'object' && s.description) {
              html += `<span class="strength-area">${escapeHtml(s.area || 'Punto di forza')}:</span> <span class="strength-description">${escapeHtml(s.description)}</span>`;
            } else {
              html += escapeHtml(renderValue(s));
            }
            html += '</li>';
          });
          html += '</ul>';
        } else {
          html += 'N/A';
        }
      } else if (attr.key === 'weaknesses') {
        if (content.weaknesses && Array.isArray(content.weaknesses) && content.weaknesses.length > 0) {
          html += '<ul>';
          content.weaknesses.forEach((w: any) => {
            html += '<li class="weakness-item">';
            if (typeof w === 'object' && w.description) {
              html += `<span class="weakness-area">${escapeHtml(w.area || 'Punto debole')}:</span> <span class="weakness-description">${escapeHtml(w.description)}</span>`;
            } else {
              html += escapeHtml(renderValue(w));
            }
            html += '</li>';
          });
          html += '</ul>';
        } else {
          html += 'N/A';
        }
      } else if (attr.key === 'frameworkCoverage') {
        if (content.frameworkCoverage) {
          html += `<div class="coverage-percentage">${content.frameworkCoverage.overallCoverage ?? 0}% copertura</div>`;
          html += `<div class="coverage-modules">${content.frameworkCoverage.modules?.length ?? 0} moduli analizzati</div>`;
        } else {
          html += 'N/A';
        }
      }

      html += '</td>\n';
    });

    html += '                </tr>\n';
  });

  html += `            </tbody>
        </table>
        
        <div class="footer">
            <p>Generato automaticamente da UNI-SCAN</p>
        </div>
    </div>
</body>
</html>`;

  return html;
}

export function downloadComparisonHTML(
  html: string,
  subject: string
): void {
  const element = document.createElement('a');
  const file = new Blob([html], { type: 'text/html;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = `confronto-manuali-${subject.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
