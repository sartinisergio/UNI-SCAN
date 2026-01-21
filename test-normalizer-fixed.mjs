import { normalizeFramework } from './server/services/frameworkNormalizer.ts';
import { getDb } from './server/db.ts';
import { frameworks } from './drizzle/schema.ts';

const db = await getDb();

// Get first framework
const fw = await db.select().from(frameworks).limit(1);

if (fw.length > 0) {
  const framework = fw[0].content;
  console.log('Framework structure:');
  console.log('- Has content.content.syllabus_modules:', Array.isArray(framework?.content?.content?.syllabus_modules));
  console.log('- Has content.content.target_degrees:', Array.isArray(framework?.content?.content?.target_degrees));
  
  const normalized = normalizeFramework(framework);
  console.log('\nNormalized framework:');
  console.log('- Total modules:', normalized.modules.length);
  
  if (normalized.modules.length > 0) {
    console.log('\nFirst 5 modules:');
    normalized.modules.slice(0, 5).forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.nome} (${m.argomenti.length} topics)`);
    });
    
    if (normalized.modules.length > 5) {
      console.log(`  ... and ${normalized.modules.length - 5} more`);
    }
  }
  
  if (Array.isArray(framework?.content?.content?.target_degrees)) {
    console.log('\nTarget degrees:');
    framework.content.content.target_degrees.slice(0, 5).forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.name || d.degree || d}`);
    });
  }
}

process.exit(0);
