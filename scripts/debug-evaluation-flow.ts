import { getDb } from '../server/db';
import { frameworks, subjects, manuals } from '../drizzle/schema';
import { normalizeFramework, extractModules } from '../server/services/frameworkNormalizer';
import { generateManualEvaluation } from '../server/services/manualEvaluator';
import { eq } from 'drizzle-orm';

async function debugEvaluation() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  // Get Chemistry framework
  const fw = await db
    .select()
    .from(frameworks)
    .innerJoin(subjects, eq(frameworks.subjectId, subjects.id))
    .where(eq(subjects.name, 'Chimica Generale'))
    .limit(1);

  if (!fw.length) {
    console.error('Framework not found');
    process.exit(1);
  }

  // Get Atkins manual
  const manual = await db
    .select()
    .from(manuals)
    .where(eq(manuals.title, 'Principi di Chimica'))
    .limit(1);

  if (!manual.length) {
    console.error('Manual not found');
    process.exit(1);
  }

  const frameworkContent = fw[0].frameworks.content as any;
  const manualIndexContent = manual[0].indexContent as any;

  console.log('='.repeat(80));
  console.log('DEBUG: Framework Structure');
  console.log('='.repeat(80));
  console.log('Framework keys:', Object.keys(frameworkContent));
  console.log('Has syllabus_modules:', Array.isArray(frameworkContent.syllabus_modules));
  console.log('syllabus_modules count:', frameworkContent.syllabus_modules?.length);

  console.log('\n' + '='.repeat(80));
  console.log('DEBUG: extractModules Function');
  console.log('='.repeat(80));
  const modules = extractModules(frameworkContent);
  console.log('Extracted modules count:', modules.length);
  console.log('Module names:');
  modules.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.nome} (${m.argomenti.length} topics)`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('DEBUG: Manual Index Structure');
  console.log('='.repeat(80));
  console.log('Manual title:', manual[0].title);
  console.log('Index keys:', Object.keys(manualIndexContent));
  if (manualIndexContent.capitoli) {
    console.log('Chapters count:', manualIndexContent.capitoli.length);
  }

  console.log('\n' + '='.repeat(80));
  console.log('DEBUG: Running generateManualEvaluation');
  console.log('='.repeat(80));

  try {
    const evaluation = await generateManualEvaluation(
      1, // userId
      {
        title: manual[0].title,
        author: manual[0].author,
        publisher: manual[0].publisher
      },
      manualIndexContent,
      frameworkContent,
      'Chimica Generale'
    );

    console.log('\n✅ Evaluation completed!');
    console.log('Modules evaluated:', evaluation.frameworkCoverage.modules.length);
    console.log('Module names in evaluation:');
    evaluation.frameworkCoverage.modules.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.moduleName} - ${m.coveragePercentage}%`);
    });
    console.log('Overall coverage:', evaluation.frameworkCoverage.overallCoverage + '%');
  } catch (error) {
    console.error('❌ Error during evaluation:', error instanceof Error ? error.message : String(error));
  }

  process.exit(0);
}

debugEvaluation();
