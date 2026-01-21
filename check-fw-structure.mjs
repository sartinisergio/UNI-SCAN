import { getDb } from './server/db.ts';
import { frameworks } from './drizzle/schema.ts';

const db = await getDb();

// Get first framework
const fw = await db.select().from(frameworks).limit(1);

if (fw.length > 0) {
  const content = fw[0].content || {};
  console.log('Framework content keys:', Object.keys(content));
  console.log('Has modules:', Array.isArray(content.modules));
  console.log('Has syllabus_modules:', Array.isArray(content.syllabus_modules));
  console.log('Has content.modules:', Array.isArray(content.content?.modules));
  
  if (Array.isArray(content.syllabus_modules)) {
    console.log(`\nFound ${content.syllabus_modules.length} syllabus_modules`);
    console.log('First 3:');
    content.syllabus_modules.slice(0, 3).forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.nome || m.name || 'N/A'} (${m.argomenti?.length || m.topics?.length || 0} items)`);
    });
  }
}

process.exit(0);
