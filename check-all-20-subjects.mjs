import { getDb } from './server/db.ts';
import { frameworks, subjects, manuals } from './drizzle/schema.ts';

const db = await getDb();

const allSubjects = await db.select().from(subjects);

console.log(`Total subjects: ${allSubjects.length}\n`);

for (const subj of allSubjects) {
  const fws = await db.select().from(frameworks).where(eq(frameworks.subjectId, subj.id)).limit(1);
  const mans = await db.select().from(manuals).where(eq(manuals.subjectId, subj.id)).limit(1);
  
  if (fws.length > 0 && mans.length > 0) {
    const framework = fws[0].content;
    const modules = framework?.content?.syllabus_modules || [];
    const degrees = framework?.content?.target_degrees || [];
    
    console.log(`✓ ${subj.name}`);
    console.log(`  Modules: ${modules.length}, Degrees: ${degrees.length}`);
  } else {
    console.log(`✗ ${subj.name} - Missing framework or manual`);
  }
}

process.exit(0);
