import { generateImprovedManualEvaluation } from './server/services/improvedManualEvaluator.ts';
import { getDb } from './server/db.ts';
import { frameworks, subjects, manuals } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();

// Get Chimica Generale subject and framework
const subj = await db.select().from(subjects).where(eq(subjects.name, 'Chimica Generale')).limit(1);

if (subj.length > 0) {
  const fws = await db.select().from(frameworks).where(eq(frameworks.subjectId, subj[0].id)).limit(1);
  const mans = await db.select().from(manuals).where(eq(manuals.subjectId, subj[0].id)).limit(1);
  
  if (fws.length > 0 && mans.length > 0) {
    console.log('Testing improved evaluator with ALL degree programs...\n');
    console.log('Subject:', subj[0].name);
    console.log('Manual:', mans[0].title);
    
    const framework = fws[0].content;
    const degrees = framework?.content?.target_degrees || [];
    console.log(`Framework target degrees: ${degrees.length}`);
    degrees.forEach((d, i) => {
      console.log(`  ${i + 1}. ${typeof d === 'string' ? d : d.name || JSON.stringify(d)}`);
    });
    
    const evaluation = await generateImprovedManualEvaluation(
      1,
      { title: mans[0].title, author: mans[0].author, publisher: mans[0].publisher },
      mans[0].indexContent,
      framework,
      subj[0].name
    );
    
    console.log('\n✅ Evaluation generated!');
    console.log(`- Modules analyzed: ${evaluation.moduleByModuleAnalysis.length}`);
    console.log(`- Degree programs evaluated: ${evaluation.degreeCompatibility.length}`);
    
    console.log('\nDegree compatibility:');
    evaluation.degreeCompatibility.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.degreeProgram}: ${d.compatible}`);
    });
  }
}

process.exit(0);
