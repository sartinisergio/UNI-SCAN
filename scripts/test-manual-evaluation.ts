import { getDb } from '../server/db';
import { frameworks, manuals, subjects } from '../drizzle/schema';
import { generateManualEvaluation } from '../server/services/manualEvaluator';
import { eq } from 'drizzle-orm';

async function testManualEvaluation() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  console.log('🧪 Testing manual evaluation with updated framework normalizer...\n');

  // Get Chemistry subject
  const chemistrySubject = await db
    .select()
    .from(subjects)
    .where(eq(subjects.name, 'Chimica Generale'))
    .limit(1);

  if (!chemistrySubject.length) {
    console.error('❌ Chemistry subject not found');
    process.exit(1);
  }

  const subjectId = chemistrySubject[0].id;
  console.log(`✅ Found subject: ${chemistrySubject[0].name} (ID: ${subjectId})\n`);

  // Get the Chemistry framework
  const fw = await db
    .select()
    .from(frameworks)
    .where(eq(frameworks.subjectId, subjectId))
    .limit(1);

  if (!fw.length) {
    console.error('❌ Framework not found for Chemistry');
    process.exit(1);
  }

  console.log(`✅ Found framework: ${fw[0].version}\n`);

  // Get an Atkins manual (or any chemistry manual)
  const manual = await db
    .select()
    .from(manuals)
    .where(eq(manuals.subjectId, subjectId))
    .limit(1);

  if (!manual.length) {
    console.error('❌ No manuals found for Chemistry');
    process.exit(1);
  }

  console.log(`✅ Found manual: ${manual[0].title} by ${manual[0].author}\n`);

  // Get the manual's index content
  const indexContent = manual[0].indexContent as any;
  if (!indexContent) {
    console.error('❌ Manual has no index content');
    process.exit(1);
  }

  console.log(`📖 Manual index has ${indexContent.capitoli?.length || 0} chapters\n`);

  // Evaluate the manual
  try {
    console.log('⏳ Generating evaluation (this may take a minute)...\n');
    
    const evaluation = await generateManualEvaluation(
      1, // userId
      {
        title: manual[0].title,
        author: manual[0].author,
        publisher: manual[0].publisher
      },
      indexContent,
      fw[0].content as any,
      chemistrySubject[0].name
    );

    console.log('✅ Evaluation completed!\n');
    console.log('📊 RESULTS:');
    console.log(`   Overall Coverage: ${evaluation.frameworkCoverage.overallCoverage}%`);
    console.log(`   Overall Score: ${evaluation.overallScore}/100`);
    console.log(`   Verdict: ${evaluation.verdict}\n`);

    console.log('📋 Module Coverage:');
    for (const module of evaluation.frameworkCoverage.modules.slice(0, 3)) {
      console.log(`   - ${module.moduleName}: ${module.coveragePercentage}%`);
    }

    console.log('\n✅ Test successful! Framework normalizer is working correctly.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during evaluation:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

testManualEvaluation();
