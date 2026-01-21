import { getDb } from './server/db.ts';
import { frameworks } from './drizzle/schema.ts';

const db = await getDb();

// Get all frameworks
const allFw = await db.select().from(frameworks).limit(5);

console.log(`Found ${allFw.length} frameworks:\n`);

allFw.forEach((fw) => {
  const content = fw.content || {};
  const modules = content.modules || [];
  console.log(`ID: ${fw.id}, Subject: ${fw.subjectId}, Version: ${fw.version}`);
  console.log(`  Modules: ${modules.length}`);
  if (modules.length > 0) {
    modules.slice(0, 3).forEach((m, i) => {
      console.log(`    ${i + 1}. ${m.nome} (${m.argomenti?.length || 0} topics)`);
    });
    if (modules.length > 3) {
      console.log(`    ... and ${modules.length - 3} more`);
    }
  }
  console.log();
});

process.exit(0);
