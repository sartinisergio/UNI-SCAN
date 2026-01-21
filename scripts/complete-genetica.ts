import { getDb } from '../server/db';
import { frameworks, subjects } from '../drizzle/schema';
import { invokeLLM } from '../server/_core/llm';
import { eq } from 'drizzle-orm';

async function extractKeyConceptsFromModule(moduleName: string, coreContents: string, subjectName: string): Promise<string[]> {
  const prompt = `Sei un esperto di didattica universitaria di ${subjectName}.

COMPITO: Estrai i concetti chiave da una descrizione di modulo didattico.

MODULO:
Nome: ${moduleName}
Descrizione: ${coreContents}

ISTRUZIONI:
1. Leggi attentamente la descrizione
2. Identifica 8-15 concetti/argomenti chiave
3. Elenca i concetti in ordine di importanza didattica
4. Usa terminologia accademica precisa
5. Ogni concetto deve essere una frase breve (2-5 parole)

FORMATO RISPOSTA (SOLO JSON VALIDO):
{
  "key_concepts": ["concetto 1", "concetto 2"]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are an expert. Always respond with VALID JSON ONLY.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0
    });

    let content = response.choices[0].message.content;
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) content = jsonMatch[0];
    
    const parsed = JSON.parse(content);
    return parsed.key_concepts || [];
  } catch (error) {
    console.error(`Error for "${moduleName}":`, error instanceof Error ? error.message : String(error));
    return [];
  }
}

async function completeGenetica() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect');
    process.exit(1);
  }

  const fw = await db
    .select({
      id: frameworks.id,
      content: frameworks.content,
      subjectName: subjects.name
    })
    .from(frameworks)
    .innerJoin(subjects, eq(frameworks.subjectId, subjects.id))
    .where(eq(subjects.name, 'Genetica'))
    .limit(1);

  if (!fw.length) {
    console.error('Genetica not found');
    process.exit(1);
  }

  console.log('Processing Genetica...');
  const content = fw[0].content as any;
  const modules = content.content?.syllabus_modules || [];

  for (const module of modules) {
    if (!module.core_contents || module.key_concepts) continue;
    
    console.log(`  Processing: ${module.name}`);
    const concepts = await extractKeyConceptsFromModule(module.name, module.core_contents, fw[0].subjectName);
    if (concepts.length > 0) {
      module.key_concepts = concepts;
      console.log(`    ✅ ${concepts.length} concepts extracted`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  await db.update(frameworks)
    .set({ content, updatedAt: new Date() })
    .where(eq(frameworks.id, fw[0].id));

  console.log('✅ Genetica updated!');
  process.exit(0);
}

completeGenetica();
