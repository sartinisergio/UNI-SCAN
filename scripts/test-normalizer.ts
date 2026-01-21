import { getDb } from '../server/db';
import { frameworks, subjects } from '../drizzle/schema';
import { normalizeFramework, extractModules } from '../server/services/frameworkNormalizer';
import { eq } from 'drizzle-orm';

async function testNormalizer() {
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

  const frameworkContent = fw[0].frameworks.content as any;
  
  console.log('Testing normalizeFramework with Chemistry framework:');
  console.log('='.repeat(60));
  console.log('Input framework keys:', Object.keys(frameworkContent));
  console.log('Has syllabus_modules:', Array.isArray(frameworkContent.syllabus_modules));
  console.log('syllabus_modules count:', frameworkContent.syllabus_modules?.length);
  
  const normalized = normalizeFramework(frameworkContent);
  console.log('\nNormalized modules count:', normalized.modules.length);
  
  if (normalized.modules.length > 0) {
    console.log('\nFirst module:');
    console.log('  Name:', normalized.modules[0].nome);
    console.log('  Topics count:', normalized.modules[0].argomenti.length);
    console.log('  Topics:', normalized.modules[0].argomenti.slice(0, 3));
  }

  const extracted = extractModules(frameworkContent);
  console.log('\nExtracted modules count:', extracted.length);

  process.exit(0);
}

testNormalizer();
