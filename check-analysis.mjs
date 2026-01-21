import { getDb } from './server/db.ts';
import { analyses } from './drizzle/schema.ts';

const db = await getDb();
const analysis = await db.select().from(analyses).limit(1);

if (analysis.length > 0) {
  const a = analysis[0];
  console.log('Analysis found:');
  console.log('ID:', a.id);
  console.log('Program Title:', a.programTitle);
  console.log('Primary Manual ID:', a.primaryManualId);
  console.log('Status:', a.status);
} else {
  console.log('No analysis found');
}

process.exit(0);
