import { getDb } from '../server/db';
import { frameworks, subjects } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function verifyFrameworks() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  const allFrameworks = await db
    .select({
      id: frameworks.id,
      subjectName: subjects.name,
      content: frameworks.content
    })
    .from(frameworks)
    .innerJoin(subjects, eq(frameworks.subjectId, subjects.id))
    .where(eq(frameworks.isActive, true));

  console.log('📊 Framework Status Report:\n');
  console.log('Subject | Has key_concepts | Module Count');
  console.log('--------|------------------|-------------');

  let updatedCount = 0;
  let totalModules = 0;

  for (const fw of allFrameworks) {
    const content = fw.content as any;
    const modules = content.content?.syllabus_modules || [];
    const hasKeyConcepts = modules.some((m: any) => Array.isArray(m.key_concepts) && m.key_concepts.length > 0);
    
    totalModules += modules.length;
    if (hasKeyConcepts) updatedCount++;

    const status = hasKeyConcepts ? '✅ Yes' : '❌ No';
    console.log(`${fw.subjectName.padEnd(30)} | ${status.padEnd(16)} | ${modules.length}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Updated frameworks: ${updatedCount}/${allFrameworks.length}`);
  console.log(`📚 Total modules: ${totalModules}`);
  console.log('='.repeat(60));

  process.exit(0);
}

verifyFrameworks();
