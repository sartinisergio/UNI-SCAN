import { generateImprovedManualEvaluation } from './server/services/improvedManualEvaluator.ts';
import { getDb } from './server/db.ts';
import { frameworks, subjects, manuals } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();

// Get all subjects
const allSubjects = await db.select().from(subjects);

console.log('Testing evaluation system across all subjects:\n');

for (const subj of allSubjects) {
  const fws = await db.select().from(frameworks).where(eq(frameworks.subjectId, subj.id)).limit(1);
  const mans = await db.select().from(manuals).where(eq(manuals.subjectId, subj.id)).limit(1);
  
  if (fws.length > 0 && mans.length > 0) {
    const framework = fws[0].content;
    const modules = framework?.content?.syllabus_modules || [];
    const degrees = framework?.content?.target_degrees || [];
    
    console.log(`${subj.name}:`);
    console.log(`  - Manual: ${mans[0].title}`);
    console.log(`  - Modules: ${modules.length}`);
    console.log(`  - Degree programs: ${degrees.length}`);
    console.log(`  - Status: Ready for evaluation\n`);
  }
}

process.exit(0);
