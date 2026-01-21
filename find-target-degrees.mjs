import { getDb } from './server/db.ts';
import { frameworks, subjects } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();

// Get Chimica Generale subject
const subj = await db.select().from(subjects).where(eq(subjects.name, 'Chimica Generale')).limit(1);

if (subj.length > 0) {
  const fws = await db.select().from(frameworks).where(eq(frameworks.subjectId, subj[0].id)).limit(1);
  
  if (fws.length > 0) {
    const framework = fws[0].content;
    
    // Search for target_degrees in all levels
    function findInObject(obj, path = '') {
      if (!obj || typeof obj !== 'object') return;
      
      if (Array.isArray(obj) && obj.length > 0 && obj[0].name && obj[0].name.includes('L-')) {
        console.log(`Found target_degrees at: ${path}`);
        console.log('Content:', obj.slice(0, 3).map(d => d.name || d));
        return;
      }
      
      for (const key in obj) {
        if (key.includes('degree') || key.includes('target') || key.includes('class')) {
          console.log(`Found key: ${path}.${key}`);
          if (Array.isArray(obj[key])) {
            console.log(`  Array length: ${obj[key].length}`);
            if (obj[key].length > 0) {
              console.log(`  First item:`, obj[key][0]);
            }
          }
        }
        findInObject(obj[key], `${path}.${key}`);
      }
    }
    
    findInObject(framework);
  }
}

process.exit(0);
