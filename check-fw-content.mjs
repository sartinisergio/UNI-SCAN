import { getDb } from './server/db.ts';
import { frameworks } from './drizzle/schema.ts';

const db = await getDb();

// Get first framework
const fw = await db.select().from(frameworks).limit(1);

if (fw.length > 0) {
  const content = fw[0].content || {};
  console.log('Top level keys:', Object.keys(content));
  
  if (content.content) {
    console.log('\ncontent.content keys:', Object.keys(content.content));
    console.log('content.content.modules:', Array.isArray(content.content.modules) ? `YES (${content.content.modules.length})` : 'NO');
    
    if (Array.isArray(content.content.modules)) {
      console.log(`\nFound ${content.content.modules.length} modules`);
      console.log('First 5:');
      content.content.modules.slice(0, 5).forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.nome || m.name || 'N/A'} (${m.argomenti?.length || m.topics?.length || 0} items)`);
      });
    }
  }
}

process.exit(0);
