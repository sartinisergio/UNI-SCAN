import { getDb } from '../server/db';
import { frameworks } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function checkFrameworks() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect');
    process.exit(1);
  }
  
  const fw = await db.select().from(frameworks).where(eq(frameworks.id, 90001)).limit(1);
  if (fw[0]) {
    const content = fw[0].content as any;
    const firstModule = content.content?.syllabus_modules?.[0];
    if (firstModule) {
      console.log('First module:', firstModule.name);
      console.log('Has key_concepts:', !!firstModule.key_concepts);
      console.log('Concepts count:', firstModule.key_concepts?.length || 0);
      if (firstModule.key_concepts) {
        console.log('Concepts:', firstModule.key_concepts.slice(0, 5));
      }
    }
  }
  process.exit(0);
}

checkFrameworks();
