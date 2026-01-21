import { getDb } from '../server/db';
import { manuals, subjects } from '../drizzle/schema';
import { analyzeManualStructure } from '../server/services/contentClassifier';
import { eq } from 'drizzle-orm';

async function testContentClassifier() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  console.log('🔍 Testing CONTENT CLASSIFIER...\n');

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

  // Get an Atkins manual
  const manual = await db
    .select()
    .from(manuals)
    .where(eq(manuals.subjectId, chemistrySubject[0].id))
    .limit(1);

  if (!manual.length) {
    console.error('❌ No manuals found');
    process.exit(1);
  }

  console.log(`📖 Manual: ${manual[0].title} by ${manual[0].author}\n`);

  const indexContent = manual[0].indexContent as any;
  const chapters = indexContent.chapters || [];

  console.log(`📚 Analyzing ${chapters.length} chapters...\n`);

  try {
    const analysis = analyzeManualStructure(chapters);

    console.log('📊 ANALYSIS RESULTS:\n');

    console.log('📈 OVERALL METRICS:');
    console.log(`   Total estimated exercises: ${analysis.totalEstimatedExercises}`);
    console.log(`   Total estimated examples: ${analysis.totalEstimatedExamples}`);
    console.log(`   Total estimated pages: ${analysis.totalEstimatedPages}\n`);

    console.log('📋 CONTENT DISTRIBUTION:');
    Object.entries(analysis.contentDistribution).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`   ${type}: ${count} sections`);
      }
    });
    console.log();

    console.log('📚 CHAPTER BREAKDOWN (first 5):\n');
    analysis.chapterAnalyses.slice(0, 5).forEach(chapter => {
      console.log(`   Chapter ${chapter.chapterNumber}: ${chapter.chapterTitle}`);
      console.log(`      Pages: ${chapter.totalPages}`);
      console.log(`      Exercises: ~${chapter.estimatedTotalExercises}`);
      console.log(`      Examples: ~${chapter.estimatedTotalExamples}`);
      console.log(`      Sections: ${chapter.sections.length}`);
      
      // Show section breakdown
      chapter.sections.slice(0, 3).forEach(section => {
        console.log(`         - ${section.title} (${section.contentType}, ${section.estimatedPages}p)`);
      });
      if (chapter.sections.length > 3) {
        console.log(`         ... and ${chapter.sections.length - 3} more sections`);
      }
      console.log();
    });

    console.log('✅ Content classifier test successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during classification:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    process.exit(1);
  }
}

testContentClassifier();
