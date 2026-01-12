import { createConnection } from 'mysql2/promise';
import { invokeLLM } from './server/_core/llm.ts';

// Database connection
const pool = await createConnection({
  host: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('//')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/')[3]?.split('?')[0] || 'uni_scan',
});

console.log('🔄 Inizio rigenerazione valutazioni manuali...\n');

try {
  // Get all manuals for Chimica Generale and Istologia
  const [subjects] = await pool.query(
    `SELECT id, name FROM subjects WHERE name LIKE '%Chimica%' OR name LIKE '%Istologia%'`
  );

  for (const subject of subjects) {
    console.log(`\n📚 Materia: ${subject.name}`);
    
    const [manuals] = await pool.query(
      `SELECT id, title, author, publisher, indexContent FROM manuals WHERE subjectId = ? AND isActive = true`,
      [subject.id]
    );

    // Get active framework for this subject
    const [frameworks] = await pool.query(
      `SELECT content FROM frameworks WHERE subjectId = ? AND isActive = true ORDER BY createdAt DESC LIMIT 1`,
      [subject.id]
    );

    if (!frameworks || frameworks.length === 0) {
      console.log(`  ⚠️  Nessun framework attivo trovato`);
      continue;
    }

    const framework = frameworks[0];
    const frameworkContent = typeof framework.content === 'string' 
      ? JSON.parse(framework.content) 
      : framework.content;

    console.log(`  📋 Framework trovato, ${manuals.length} manuali da rigenerare`);

    for (let i = 0; i < manuals.length; i++) {
      const manual = manuals[i];
      const indexContent = typeof manual.indexContent === 'string'
        ? JSON.parse(manual.indexContent)
        : manual.indexContent;

      try {
        console.log(`  [${i + 1}/${manuals.length}] ${manual.title}...`);

        // Generate evaluation using LLM
        const prompt = `Analizza questo manuale universitario rispetto al framework di valutazione.

MANUALE:
- Titolo: ${manual.title}
- Autore: ${manual.author}
- Editore: ${manual.publisher}
- Indice: ${JSON.stringify(indexContent, null, 2)}

FRAMEWORK DI RIFERIMENTO:
${JSON.stringify(frameworkContent, null, 2)}

Genera una valutazione JSON con questa struttura:
{
  "didacticApproach": {
    "approachType": "string",
    "pedagogicalPhilosophy": "string",
    "contentLevel": "string"
  },
  "frameworkCoverage": {
    "overallCoverage": number,
    "modules": [
      {
        "moduleId": number,
        "moduleName": "string",
        "coverage": number,
        "coveredTopics": ["string"],
        "missingTopics": ["string"],
        "notes": "string"
      }
    ]
  },
  "strengths": [
    {
      "title": "string",
      "description": "string"
    }
  ],
  "weaknesses": [
    {
      "title": "string",
      "description": "string",
      "impact": "string"
    }
  ]
}`;

        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'Sei un esperto di valutazione di manuali universitari. Analizza i manuali rispetto ai framework di valutazione e fornisci valutazioni strutturate in JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'manual_evaluation',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  didacticApproach: {
                    type: 'object',
                    properties: {
                      approachType: { type: 'string' },
                      pedagogicalPhilosophy: { type: 'string' },
                      contentLevel: { type: 'string' }
                    },
                    required: ['approachType', 'pedagogicalPhilosophy', 'contentLevel']
                  },
                  frameworkCoverage: {
                    type: 'object',
                    properties: {
                      overallCoverage: { type: 'number' },
                      modules: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            moduleId: { type: 'number' },
                            moduleName: { type: 'string' },
                            coverage: { type: 'number' },
                            coveredTopics: { type: 'array', items: { type: 'string' } },
                            missingTopics: { type: 'array', items: { type: 'string' } },
                            notes: { type: 'string' }
                          },
                          required: ['moduleId', 'moduleName', 'coverage', 'coveredTopics', 'missingTopics', 'notes']
                        }
                      }
                    },
                    required: ['overallCoverage', 'modules']
                  },
                  strengths: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' }
                      },
                      required: ['title', 'description']
                    }
                  },
                  weaknesses: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        impact: { type: 'string' }
                      },
                      required: ['title', 'description', 'impact']
                    }
                  }
                },
                required: ['didacticApproach', 'frameworkCoverage', 'strengths', 'weaknesses'],
                additionalProperties: false
              }
            }
          }
        });

        const evaluationContent = JSON.parse(response.choices[0].message.content);

        // Save evaluation to database
        await pool.query(
          `UPDATE manuals SET frameworkCoverage = ?, didacticApproach = ?, strengths = ?, weaknesses = ?, updatedAt = NOW() WHERE id = ?`,
          [
            JSON.stringify(evaluationContent.frameworkCoverage),
            JSON.stringify(evaluationContent.didacticApproach),
            JSON.stringify(evaluationContent.strengths),
            JSON.stringify(evaluationContent.weaknesses),
            manual.id
          ]
        );

        console.log(`    ✅ Valutazione salvata`);
      } catch (error) {
        console.error(`    ❌ Errore: ${error.message}`);
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n✅ Rigenerazione completata!`);
} catch (error) {
  console.error('❌ Errore:', error);
} finally {
  await pool.end();
}
