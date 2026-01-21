import { normalizeFramework } from './server/services/frameworkNormalizer.ts';
import { getDb } from './server/db.ts';
import { frameworks, subjects } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();

// Get Chimica Generale subject
const subj = await db.select().from(subjects).where(eq(subjects.name, 'Chimica Generale')).limit(1);

if (subj.length > 0) {
  console.log('Found subject:', subj[0].name);
  
  // Get frameworks for this subject
  const fws = await db.select().from(frameworks).where(eq(frameworks.subjectId, subj[0].id)).limit(1);
  
  if (fws.length > 0) {
    const framework = fws[0].content;
    console.log('\nFramework structure:');
    console.log('- Top level keys:', Object.keys(framework || {}));
    console.log('- Has content.content.syllabus_modules:', Array.isArray(framework?.content?.content?.syllabus_modules));
    console.log('- Has content.content.target_degrees:', Array.isArray(framework?.content?.content?.target_degrees));
    
    const normalized = normalizeFramework(framework);
    console.log('\nNormalized framework:');
    console.log('- Total modules:', normalized.modules.length);
    
    if (normalized.modules.length > 0) {
      console.log('\nAll modules:');
      normalized.modules.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.nome} (${m.argomenti.length} topics)`);
      });
    }
    
    if (Array.isArray(framework?.content?.content?.target_degrees)) {
      console.log('\nTarget degrees:');
      framework.content.content.target_degrees.forEach((d, i) => {
        console.log(`  ${i + 1}. ${d.name || d.degree || d}`);
      });
    }
  } else {
    console.log('No frameworks found for this subject');
  }
} else {
  console.log('Subject not found');
}

process.exit(0);
