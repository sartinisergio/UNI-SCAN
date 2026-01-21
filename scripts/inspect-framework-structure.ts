import { getDb } from '../server/db';
import { frameworks, subjects } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function inspectFramework() {
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  const fw = await db
    .select()
    .from(frameworks)
    .innerJoin(subjects, eq(frameworks.subjectId, subjects.id))
    .where(eq(subjects.name, 'Chimica Generale'))
    .limit(1);

  if (!fw.length) {
    console.error('Framework not found');
    process.exit(1);
  }

  const content = fw[0].frameworks.content as any;
  
  console.log('Framework structure:');
  console.log('='.repeat(60));
  console.log('Top-level keys:', Object.keys(content));
  console.log('\n');

  // Check for modules at different levels
  console.log('Checking for modules at different levels:');
  console.log('- content.modules:', Array.isArray(content.modules) ? `YES (${content.modules.length})` : 'NO');
  console.log('- content.moduli:', Array.isArray(content.moduli) ? `YES (${content.moduli.length})` : 'NO');
  console.log('- content.syllabus_modules:', Array.isArray(content.syllabus_modules) ? `YES (${content.syllabus_modules.length})` : 'NO');
  console.log('- content.content:', typeof content.content);
  
  if (content.content && typeof content.content === 'object') {
    console.log('\nContent.content keys:', Object.keys(content.content));
    console.log('- content.content.modules:', Array.isArray(content.content.modules) ? `YES (${content.content.modules.length})` : 'NO');
    console.log('- content.content.moduli:', Array.isArray(content.content.moduli) ? `YES (${content.content.moduli.length})` : 'NO');
    console.log('- content.content.syllabus_modules:', Array.isArray(content.content.syllabus_modules) ? `YES (${content.content.syllabus_modules.length})` : 'NO');
  }

  // Show first module structure
  let modules: any[] = [];
  if (Array.isArray(content.modules)) modules = content.modules;
  else if (Array.isArray(content.moduli)) modules = content.moduli;
  else if (Array.isArray(content.syllabus_modules)) modules = content.syllabus_modules;
  else if (content.content && Array.isArray(content.content.modules)) modules = content.content.modules;
  else if (content.content && Array.isArray(content.content.moduli)) modules = content.content.moduli;
  else if (content.content && Array.isArray(content.content.syllabus_modules)) modules = content.content.syllabus_modules;

  if (modules.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('First module structure:');
    console.log(JSON.stringify(modules[0], null, 2).substring(0, 500));
  }

  process.exit(0);
}

inspectFramework();
