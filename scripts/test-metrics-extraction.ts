import { getDb } from '../server/db';
import { frameworks, manuals, subjects } from '../drizzle/schema';
import { extractManualMetrics, calculateQualityScore } from '../server/services/metricsExtractor';
import { extractModules } from '../server/services/frameworkNormalizer';
import { eq } from 'drizzle-orm';

async function testMetricsExtraction() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  console.log('📊 Testing METRICS EXTRACTION...\n');

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

  const frameworkModules = extractModules(fw[0].content as any);
  console.log(`✅ Framework has ${frameworkModules.length} modules\n`);

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

  try {
    console.log('⏳ Extracting concrete metrics (this may take 1-2 minutes)...\n');
    
    const result = await extractManualMetrics(
      1, // userId
      {
        title: manual[0].title,
        author: manual[0].author,
        publisher: manual[0].publisher
      },
      indexContent,
      frameworkModules,
      chemistrySubject[0].name
    );

    console.log('✅ Metrics extraction completed!\n');
    
    // Display results
    console.log('📊 CONCRETE METRICS:\n');
    
    console.log('📚 EXERCISE METRICS:');
    console.log(`   Total exercises: ${result.metrics.totalExercises}`);
    console.log(`   With solutions: ${result.metrics.exercisesWithSolutions} (${Math.round(result.metrics.exercisesWithSolutions / result.metrics.totalExercises * 100)}%)`);
    console.log(`   Difficulty distribution:`);
    console.log(`     - Basic: ${result.metrics.exercisesDifficulty.basic}`);
    console.log(`     - Intermediate: ${result.metrics.exercisesDifficulty.intermediate}`);
    console.log(`     - Advanced: ${result.metrics.exercisesDifficulty.advanced}\n`);

    console.log('📖 CONTENT METRICS:');
    console.log(`   Total pages: ${result.metrics.totalPages}`);
    console.log(`   Average chapter length: ${result.metrics.averageChapterLength} pages\n`);

    console.log('🎯 COVERAGE:');
    console.log(`   Modules with dedicated chapters: ${result.metrics.modulesWithDedicatedChapters.length}`);
    console.log(`   Modules with partial coverage: ${result.metrics.modulesWithPartialCoverage.length}`);
    console.log(`   Modules not covered: ${result.metrics.modulesNotCovered.length}\n`);

    console.log('✨ STRUCTURE QUALITY:');
    console.log(`   Has answer key: ${result.metrics.hasAnswerKey}`);
    console.log(`   Has practice sections: ${result.metrics.hasPracticeSections}`);
    console.log(`   Has case studies: ${result.metrics.hasCaseStudies}`);
    console.log(`   Has real-world applications: ${result.metrics.hasRealWorldApplications}`);
    console.log(`   Has visual aids: ${result.metrics.hasVisualAids}`);
    console.log(`   Has index: ${result.metrics.hasIndex}`);
    console.log(`   Has bibliography: ${result.metrics.hasBibliography}`);
    console.log(`   Number of appendices: ${result.metrics.numberOfAppendices}\n`);

    console.log('💡 OBSERVATIONS:');
    result.metrics.observations.forEach((obs, i) => {
      console.log(`   ${i + 1}. ${obs}`);
    });
    console.log();

    // Calculate quality score
    const qualityScore = calculateQualityScore(result.metrics);
    console.log(`📈 CALCULATED QUALITY SCORE: ${qualityScore}/100`);
    console.log(`   Confidence: ${result.confidence}%\n`);

    console.log('📝 EXTRACTION NOTES:');
    console.log(`   ${result.notes}\n`);

    console.log('✅ Metrics extraction test successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during extraction:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    process.exit(1);
  }
}

testMetricsExtraction();
