import { invokeLLMWithUserPreference } from './server/_core/llm.ts';
import { getDb } from './server/db.ts';
import { frameworks, subjects, manuals } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();

// Get Chimica Generale framework
const chim = await db.select().from(subjects).where(eq(subjects.name, 'Chimica Generale')).limit(1);
const fw = await db.select().from(frameworks).where(eq(frameworks.subjectId, chim[0].id)).limit(1);

// Get framework modules and degrees
const frameworkContent = fw[0].content;
const modules = frameworkContent.content?.syllabus_modules || frameworkContent.syllabus_modules || [];
const degrees = frameworkContent.content?.target_degrees || frameworkContent.target_degrees || [];

console.log('Modules count:', modules.length);
console.log('Degrees count:', degrees.length);
console.log('Degrees:', degrees);

// Create a simple test prompt
const testPrompt = `Valuta questo manuale rispetto ai seguenti moduli:
${modules.slice(0, 3).map(m => `- ${m.nome}`).join('\n')}

Per le seguenti classi di laurea:
${degrees.slice(0, 3).map(d => `- ${d}`).join('\n')}

Rispondi con JSON contenente moduleByModuleAnalysis e degreeCompatibility.`;

const response = await invokeLLMWithUserPreference('user-123', {
  messages: [
    { role: "system", content: "Sei un valutatore di manuali. Rispondi sempre con JSON valido." },
    { role: "user", content: testPrompt }
  ]
});

console.log('\n=== RAW LLM RESPONSE ===');
console.log(response.content);

process.exit(0);
