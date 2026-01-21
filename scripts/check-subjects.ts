import { getDb } from '../server/db';
import { subjects } from '../drizzle/schema';

async function checkSubjects() {
  const db = await getDb();
  const allSubjects = await db.select().from(subjects);
  console.log('Available subjects:');
  allSubjects.forEach(s => console.log(`  - ${s.name} (ID: ${s.id})`));
  process.exit(0);
}

checkSubjects();
