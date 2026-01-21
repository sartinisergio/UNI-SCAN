import { getDb } from './server/db.ts';
import { manuals } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();
const manual = await db.select().from(manuals).limit(1);

if (manual.length > 0) {
  console.log('Manual found:');
  console.log('Title:', manual[0].title);
  console.log('Author:', manual[0].author);
  console.log('Index content type:', typeof manual[0].indexContent);
  console.log('Index content keys:', Object.keys(manual[0].indexContent || {}).slice(0, 5));
  console.log('\nFirst 500 chars of indexContent:');
  console.log(JSON.stringify(manual[0].indexContent).substring(0, 500));
} else {
  console.log('No manuals found');
}

process.exit(0);
