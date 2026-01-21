import { generateImprovedManualEvaluation } from './server/services/improvedManualEvaluator.ts';
import { evaluationHtmlRenderer } from './server/services/evaluationHtmlRenderer.ts';
import { getDb } from './server/db.ts';
import { frameworks, subjects, manuals, manualEvaluations } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();

// Get Chimica Generale subject and framework
const subj = await db.select().from(subjects).where(eq(subjects.name, 'Chimica Generale')).limit(1);

if (subj.length > 0) {
  const fws = await db.select().from(frameworks).where(eq(frameworks.subjectId, subj[0].id)).limit(1);
  const mans = await db.select().from(manuals).where(eq(manuals.subjectId, subj[0].id)).limit(1);
  
  if (fws.length > 0 && mans.length > 0) {
    console.log('Generating evaluation...');
    console.log('Subject:', subj[0].name);
    console.log('Manual:', mans[0].title);
    
    const evaluation = await generateImprovedManualEvaluation(
      1,
      { title: mans[0].title, author: mans[0].author, publisher: mans[0].publisher },
      mans[0].indexContent,
      fws[0].content,
      subj[0].name
    );
    
    console.log('\n✅ Evaluation generated!');
    console.log(`- Modules: ${evaluation.moduleByModuleAnalysis.length}`);
    console.log(`- Degrees: ${evaluation.degreeCompatibility.length}`);
    console.log(`- Score: ${evaluation.overallScore}/100`);
    
    // Render to HTML
    const htmlContent = evaluationHtmlRenderer(evaluation, mans[0], subj[0].name);
    
    // Save to database
    await db.insert(manualEvaluations).values({
      manualId: mans[0].id,
      frameworkId: fws[0].id,
      content: htmlContent,
      verdict: evaluation.verdict,
      overallScore: evaluation.overallScore,
      generatedAt: new Date()
    }).onConflictDoUpdate({
      target: [manualEvaluations.manualId, manualEvaluations.frameworkId],
      set: {
        content: htmlContent,
        verdict: evaluation.verdict,
        overallScore: evaluation.overallScore,
        generatedAt: new Date()
      }
    });
    
    console.log('\n✅ Saved to database!');
  }
}

process.exit(0);
