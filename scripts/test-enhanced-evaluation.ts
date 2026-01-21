import { getDb } from '../server/db';
import { frameworks, manuals, subjects } from '../drizzle/schema';
import { generateEnhancedManualEvaluation } from '../server/services/enhancedManualEvaluator';
import { eq } from 'drizzle-orm';

async function testEnhancedEvaluation() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  console.log('🧪 Testing ENHANCED manual evaluation...\n');

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

  // Get an Atkins manual
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

  // Define target degree programs for Chemistry
  const targetDegrees = [
    'L-27 Chimica',
    'L-2 Biotecnologie',
    'L-13 Scienze biologiche',
    'LM-54 Scienze chimiche'
  ];

  // Evaluate the manual with enhanced evaluator
  try {
    console.log('⏳ Generating ENHANCED evaluation (this may take 1-2 minutes)...\n');
    
    const evaluation = await generateEnhancedManualEvaluation(
      1, // userId
      {
        title: manual[0].title,
        author: manual[0].author,
        publisher: manual[0].publisher
      },
      indexContent,
      fw[0].content as any,
      chemistrySubject[0].name,
      targetDegrees
    );

    console.log('✅ ENHANCED Evaluation completed!\n');
    console.log('📊 RESULTS:');
    console.log(`   Overall Coverage: ${evaluation.frameworkCoverage.overallCoverage}%`);
    console.log(`   Overall Score: ${evaluation.overallScore}/100`);
    console.log(`   Verdict: ${evaluation.verdict}\n`);

    console.log('📋 Module Coverage (first 3):');
    for (const module of evaluation.frameworkCoverage.modules.slice(0, 3)) {
      console.log(`   - ${module.moduleName}: ${module.coveragePercentage}%`);
      console.log(`     Exercises: ${module.qualityAssessment.exercisesQuality}`);
      console.log(`     Examples: ${module.qualityAssessment.examplesQuality}`);
      console.log(`     Rigor: ${module.qualityAssessment.rigorLevel}\n`);
    }

    console.log('💪 Strengths (first 2):');
    for (const strength of evaluation.strengths.slice(0, 2)) {
      console.log(`   - ${strength.area} (${strength.relevance})`);
      console.log(`     ${strength.description}\n`);
    }

    console.log('⚠️ Weaknesses (first 2):');
    for (const weakness of evaluation.weaknesses.slice(0, 2)) {
      console.log(`   - ${weakness.area} (${weakness.severity})`);
      console.log(`     ${weakness.description}\n`);
    }

    console.log('🎯 Target-Specific Recommendations:');
    for (const rec of evaluation.targetSpecificRecommendations) {
      console.log(`   ${rec.degreeProgram}: ${rec.suitability} (Score: ${rec.targetScore}/100)`);
      console.log(`     ${rec.reasoning}\n`);
    }

    console.log('📝 Executive Summary:');
    console.log(`   ${evaluation.executiveSummary}\n`);

    console.log('✅ Enhanced evaluation test successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during evaluation:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    process.exit(1);
  }
}

testEnhancedEvaluation();
