import { getDb } from './server/db.ts';
import { frameworks, subjects } from './drizzle/schema.ts';
import { normalizeFramework } from './server/services/frameworkNormalizer.ts';

const db = await getDb();

// Get all frameworks
const allFws = await db.select().from(frameworks);
const allSubjects = await db.select().from(subjects);

console.log(`Found ${allFws.length} frameworks and ${allSubjects.length} subjects\n`);
console.log('='.repeat(100));

// Create subject map
const subjectMap = {};
allSubjects.forEach(s => {
  subjectMap[s.id] = s.name;
});

// Analyze each framework
allFws.forEach((fw, idx) => {
  const subjectName = subjectMap[fw.subjectId] || `Subject ${fw.subjectId}`;
  const content = fw.content || {};
  
  // Normalize to get modules
  const normalized = normalizeFramework(content);
  const modules = normalized.modules || [];
  
  // Find degree programs
  let degrees = [];
  if (Array.isArray(content.content?.target_degrees)) {
    degrees = content.content.target_degrees;
  } else if (Array.isArray(content.target_degrees)) {
    degrees = content.target_degrees;
  }
  
  console.log(`\n${idx + 1}. ${subjectName}`);
  console.log(`   Modules: ${modules.length}`);
  console.log(`   Degree programs: ${degrees.length}`);
  
  if (modules.length > 0) {
    console.log(`   Module structure:`);
    modules.slice(0, 3).forEach((m, i) => {
      console.log(`     ${i + 1}. ${m.nome} (${m.argomenti.length} topics)`);
    });
    if (modules.length > 3) {
      console.log(`     ... and ${modules.length - 3} more`);
    }
  }
  
  if (degrees.length > 0) {
    console.log(`   Degree programs:`);
    degrees.slice(0, 3).forEach((d, i) => {
      const name = typeof d === 'string' ? d : d.name || d.degree || JSON.stringify(d);
      console.log(`     ${i + 1}. ${name}`);
    });
    if (degrees.length > 3) {
      console.log(`     ... and ${degrees.length - 3} more`);
    }
  }
});

console.log('\n' + '='.repeat(100));
process.exit(0);
