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

FORMATO RISPOSTA (SOLO JSON VALIDO, senza markdown, senza backtick):
{
  "key_concepts": [
    "concetto 1",
    "concetto 2"
  ]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert in extracting key concepts from academic content. Always respond with VALID JSON ONLY. Do not use markdown code blocks. Do not add backticks. Just return the raw JSON object.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0
    });

    let content = response.choices[0].message.content;
    
    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to extract JSON if it's wrapped in extra text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }
    
    const parsed = JSON.parse(content);
    return parsed.key_concepts || [];
  } catch (error) {
    console.error(`Error extracting concepts for module "${moduleName}":`, error instanceof Error ? error.message : String(error));
    return [];
  }
}

async function processFrameworks() {
  console.log('📚 Starting framework enhancement process...\n');

  const db = await getDb();
  if (!db) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }

  // Get all frameworks with their subjects
  const allFrameworks = await db
    .select({
      id: frameworks.id,
      subjectId: frameworks.subjectId,
      version: frameworks.version,
      content: frameworks.content,
      subjectName: subjects.name
    })
    .from(frameworks)
    .innerJoin(subjects, eq(frameworks.subjectId, subjects.id))
    .where(eq(frameworks.isActive, true));

  console.log(`✅ Found ${allFrameworks.length} active frameworks\n`);

  let processedCount = 0;
  let errorCount = 0;
  let moduleCount = 0;
  let moduleSuccessCount = 0;

  for (const fw of allFrameworks) {
    try {
      console.log(`\n🔄 Processing: ${fw.subjectName} (Framework ID: ${fw.id})`);
      
      const content = fw.content as any;
      if (!content.content?.syllabus_modules) {
        console.log('⚠️  No syllabus_modules found, skipping...');
        continue;
      }

      let modulesUpdated = 0;

      // Process each module
      for (const module of content.content.syllabus_modules) {
        if (!module.core_contents) {
          console.log(`  ⚠️  Module "${module.name}" has no core_contents`);
          continue;
        }

        moduleCount++;
        console.log(`  📖 Processing module: ${module.name}`);
        
        // Extract key concepts
        const keyConcepts = await extractKeyConceptsFromModule(
          module.name,
          module.core_contents,
          fw.subjectName
        );

        if (keyConcepts.length > 0) {
          module.key_concepts = keyConcepts;
          modulesUpdated++;
          moduleSuccessCount++;
          console.log(`     ✅ Extracted ${keyConcepts.length} concepts: ${keyConcepts.slice(0, 3).join(', ')}...`);
        } else {
          console.log(`     ❌ Failed to extract concepts`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      if (modulesUpdated > 0) {
        // Update the framework in database
        await db.update(frameworks)
          .set({
            content: content,
            updatedAt: new Date()
          })
          .where(eq(frameworks.id, fw.id));

        console.log(`  ✅ Updated framework with ${modulesUpdated} modules\n`);
        processedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing framework ${fw.id}:`, error instanceof Error ? error.message : String(error));
      errorCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 SUMMARY:`);
  console.log(`   ✅ Successfully processed: ${processedCount} frameworks`);
  console.log(`   ✅ Successfully extracted: ${moduleSuccessCount}/${moduleCount} modules`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📚 Total frameworks: ${allFrameworks.length}`);
  console.log(`${'='.repeat(60)}\n`);
}

// Run the process
processFrameworks().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
