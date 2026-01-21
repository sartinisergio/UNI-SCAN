import * as db from "../server/db";

async function checkKeyConceptsCount() {
  try {
    const fw = await db.getFrameworkById(90006);
    if (!fw) {
      console.log('Framework not found');
      return;
    }
    
    // The content is nested - fw.content is the actual data
    const outerContent = fw.content as any;
    const innerContent = outerContent.content as any;
    
    console.log('Framework version:', fw.version);
    console.log('Outer content keys:', Object.keys(outerContent));
    console.log('Inner content keys:', Object.keys(innerContent));
    
    const modules = innerContent.syllabus_modules || innerContent.modules || innerContent.moduli;
    
    if (!modules) {
      console.log('No modules found in framework');
      return;
    }
    
    console.log('\nModules count:', modules.length);
    console.log('\nFirst 5 modules:');
    
    modules.slice(0, 5).forEach((m: any, i: number) => {
      const concepts = m.key_concepts || m.argomenti || [];
      console.log(`  ${i+1}. ${m.nome || m.name}: ${concepts.length} concepts`);
      if (concepts.length > 0) {
        console.log(`     - ${concepts.slice(0, 3).join(', ')}`);
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

checkKeyConceptsCount();
