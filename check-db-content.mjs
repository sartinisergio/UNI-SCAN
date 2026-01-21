import { getDb } from './server/db.ts';
import { manualEvaluations, manuals } from './drizzle/schema.ts';

const db = await getDb();
const evals = await db.select().from(manualEvaluations).limit(1);

if (evals.length > 0) {
  const eval_ = evals[0];
  console.log('Found evaluation:');
  console.log('ID:', eval_.id);
  console.log('Manual ID:', eval_.manualId);
  console.log('Score:', eval_.overallScore);
  console.log('Verdict:', eval_.verdict);
  console.log('Content type:', typeof eval_.content);
  console.log('Content is string:', typeof eval_.content === 'string');
  console.log('Content length:', eval_.content ? String(eval_.content).length : 0);
  console.log('First 200 chars:', String(eval_.content).substring(0, 200));
} else {
  console.log('No evaluations found');
}

process.exit(0);
