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
    console.log('Testing improved evaluator...\n');
    console.log('Subject:', subj[0].name);
    console.log('Manual:', mans[0].title);
    console.log('Framework modules:', fws[0].content.content?.modules?.length || 'unknown');
    console.log('Target degrees:', fws[0].content.content?.target_degrees?.length || 'unknown');
    
    const evaluation = await generateImprovedManualEvaluation(
      1,
      { title: mans[0].title, author: mans[0].author, publisher: mans[0].publisher },
      mans[0].indexContent,
      fws[0].content,
      subj[0].name
    );
    
    console.log('\n✅ Evaluation completed!');
    console.log(`- Modules analyzed: ${evaluation.moduleByModuleAnalysis.length}`);
    console.log(`- Degree programs evaluated: ${evaluation.degreeCompatibility.length}`);
    console.log(`- Overall score: ${evaluation.overallScore}/100`);
    console.log(`- Verdict: ${evaluation.verdict}`);
    
    console.log('\nModules:');
    evaluation.moduleByModuleAnalysis.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.moduleName}: ${m.coverage}%`);
    });
    
    console.log('\nDegree compatibility:');
    evaluation.degreeCompatibility.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.degreeProgram}: ${d.compatible}`);
    });
  }
}

process.exit(0);
