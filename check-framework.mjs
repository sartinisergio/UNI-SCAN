import { getDb } from './server/db.ts';
import { frameworks } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();

// Get Chimica Generale framework
const fw = await db.select().from(frameworks).where(eq(frameworks.name, 'Chimica Generale')).limit(1);

if (fw.length > 0) {
  const framework = fw[0];
  const modules = framework.modules || [];
  console.log('Framework: Chimica Generale');
  console.log('Total modules:', modules.length);
  console.log('\nModules:');
  modules.forEach((m, i) => {
    console.log(`${i + 1}. ${m.nome} (${m.argomenti?.length || 0} topics)`);
  });
} else {
  console.log('Framework not found');
}

process.exit(0);
