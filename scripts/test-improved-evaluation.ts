import { getDb } from '../server/db';
import { frameworks, manuals, subjects } from '../drizzle/schema';
import { generateImprovedManualEvaluation } from '../server/services/improvedManualEvaluator';
import { eq } from 'drizzle-orm';

async function testImprovedEvaluation() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  console.log('🎯 Testing IMPROVED manual evaluation...\n');

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
  console.log(`✅ Found subject: ${chemistrySubject[0].name}\n`);

  // Get the Chemistry framework
  const fw = await db
    .select()
    .from(frameworks)
    .where(eq(frameworks.subjectId, subjectId))
    .limit(1);

  if (!fw.length) {
    console.error('❌ Framework not found');
    process.exit(1);
  }

  // Get an Atkins manual
  const manual = await db
    .select()
    .from(manuals)
    .where(eq(manuals.subjectId, subjectId))
    .limit(1);

  if (!manual.length) {
    console.error('❌ No manuals found');
    process.exit(1);
  }

  console.log(`📖 Manual: ${manual[0].title} by ${manual[0].author}\n`);

  const indexContent = manual[0].indexContent as any;

  // Define degree programs for Chemistry
  const degreePrograms = [
    'L-27 Chimica',
    'L-2 Biotecnologie',
    'L-13 Scienze biologiche',
    'LM-54 Scienze chimiche'
  ];

  try {
    console.log('⏳ Generating IMPROVED evaluation (this may take 2-3 minutes)...\n');
    
    const evaluation = await generateImprovedManualEvaluation(
      1, // userId
      {
        title: manual[0].title,
        author: manual[0].author,
        publisher: manual[0].publisher
      },
      indexContent,
      fw[0].content as any,
      chemistrySubject[0].name,
      degreePrograms
    );

    console.log('✅ IMPROVED Evaluation completed!\n');
    
    console.log('📊 OVERALL RESULTS:');
    console.log(`   Score: ${evaluation.overallScore}/100`);
    console.log(`   Verdict: ${evaluation.verdict}\n`);

    console.log('📝 OVERVIEW:');
    console.log(`   ${evaluation.overview}\n`);

    console.log('💪 STRENGTHS:');
    evaluation.strengths.forEach((strength, i) => {
      console.log(`\n   ${i + 1}. ${strength.title}`);
      console.log(`      ${strength.explanation}`);
    });

    console.log('\n\n⚠️ WEAKNESSES:');
    evaluation.weaknesses.forEach((weakness, i) => {
      console.log(`\n   ${i + 1}. ${weakness.title}`);
      console.log(`      ${weakness.explanation}`);
    });

    console.log('\n\n📚 MODULE-BY-MODULE ANALYSIS (first 5):');
    evaluation.moduleByModuleAnalysis.slice(0, 5).forEach(module => {
      console.log(`\n   ${module.moduleName} (${module.coverage}%)`);
      console.log(`      ${module.explanation}`);
    });

    console.log('\n\n🎯 DEGREE PROGRAM COMPATIBILITY:');
    evaluation.degreeCompatibility.forEach(compat => {
      console.log(`\n   ${compat.degreeProgram}: ${compat.compatible}`);
      console.log(`   Reasoning: ${compat.reasoning}`);
      console.log(`   Critical modules: ${compat.criticalModules.join(', ')}`);
      console.log(`   Gaps: ${compat.gaps.join(', ')}`);
      console.log(`   Recommendations: ${compat.recommendations}`);
    });

    console.log('\n\n📝 EXECUTIVE SUMMARY:');
    console.log(`   ${evaluation.executiveSummary}\n`);

    console.log('✅ Improved evaluation test successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during evaluation:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    process.exit(1);
  }
}

testImprovedEvaluation();
