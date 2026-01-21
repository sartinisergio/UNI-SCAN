import { getDb } from '../server/db';
import { frameworks, subjects } from '../drizzle/schema';
import { invokeLLM } from '../server/_core/llm';
import { eq } from 'drizzle-orm';

async function extractKeyConceptsFromArrayContents(moduleName: string, coreContentsArray: string[], subjectName: string): Promise<string[]> {
  // Se core_contents è già un array, usalo direttamente come key_concepts
  // ma filtra e normalizza
  if (Array.isArray(coreContentsArray) && coreContentsArray.length > 0) {
    // Filtra stringhe vuote e normalizza
    return coreContentsArray
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim())
      .slice(0, 15); // Limita a 15 concetti
  }

  return [];
}

async function fixChemistryFramework() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
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
    .where(eq(subjects.name, 'Chimica Generale'))
    .limit(1);

  if (!fw.length) {
    console.error('Chimica Generale not found');
    process.exit(1);
  }

  console.log('Processing Chimica Generale...');
  const content = fw[0].content as any;
  const modules = content.syllabus_modules || [];

  console.log(`Found ${modules.length} modules\n`);

  for (const module of modules) {
    console.log(`Processing: ${module.name}`);
    
    // Se core_contents è un array, usalo direttamente come key_concepts
    if (Array.isArray(module.core_contents)) {
      const concepts = await extractKeyConceptsFromArrayContents(
        module.name,
        module.core_contents,
        fw[0].subjectName
      );
      
      if (concepts.length > 0) {
        module.key_concepts = concepts;
        console.log(`  ✅ Set ${concepts.length} concepts from core_contents array`);
        console.log(`     Concepts: ${concepts.slice(0, 3).join(', ')}...`);
      } else {
        console.log(`  ⚠️  No concepts found`);
      }
    } else if (typeof module.core_contents === 'string') {
      // Se è una stringa, usa l'LLM
      console.log(`  📖 core_contents is string, using LLM...`);
      const prompt = `Sei un esperto di chimica. Estrai 8-15 concetti chiave da questa descrizione:

"${module.core_contents}"

Rispondi con JSON: {"key_concepts": ["concetto1", "concetto2"]}`;

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
        if (parsed.key_concepts && Array.isArray(parsed.key_concepts)) {
          module.key_concepts = parsed.key_concepts;
          console.log(`  ✅ Extracted ${parsed.key_concepts.length} concepts`);
        }
      } catch (error) {
        console.log(`  ❌ Error:`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  // Save to database
  await db.update(frameworks)
    .set({ content, updatedAt: new Date() })
    .where(eq(frameworks.id, fw[0].id));

  console.log('\n✅ Chimica Generale updated!');
  process.exit(0);
}

fixChemistryFramework();
