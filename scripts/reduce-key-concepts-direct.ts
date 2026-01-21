import * as db from "../server/db";

async function reduceKeyConceptsTo3() {
  try {
    console.log("=== REDUCING KEY CONCEPTS TO 3 PER MODULE ===\n");
    
    // Get all frameworks from all subjects
    const subjects = await db.getAllSubjects();
    let frameworks: any[] = [];
    for (const subject of subjects) {
      const fws = await db.getFrameworksBySubject(subject.id);
      frameworks.push(...fws);
    }
    console.log(`Found ${frameworks.length} frameworks\n`);
    
    let updated = 0;
    let modulesReduced = 0;
    
    for (const fw of frameworks) {
      try {
        const outerContent = fw.content as any;
        const innerContent = outerContent.content as any;
        
        // Get modules based on framework structure
        let modules: any[] = [];
        if (innerContent.syllabus_modules) {
          modules = innerContent.syllabus_modules;
        } else if (innerContent.modules) {
          modules = innerContent.modules;
        } else if (innerContent.moduli) {
          modules = innerContent.moduli;
        }
        
        if (modules.length === 0) continue;
        
        console.log(`Processing ${fw.name} v${fw.version} (${modules.length} modules)...`);
        
        let frameModified = false;
        
        // Reduce key_concepts in each module
        for (const module of modules) {
          if (module.key_concepts && Array.isArray(module.key_concepts) && module.key_concepts.length > 3) {
            module.key_concepts = module.key_concepts.slice(0, 3);
            frameModified = true;
            modulesReduced++;
          }
        }
        
        // Update framework if modified
        if (frameModified) {
          const updatedContent = {
            ...outerContent,
            content: innerContent
          };
          
          await db.updateFramework(fw.id, { content: updatedContent });
          updated++;
          console.log(`✅ Updated - reduced concepts\n`);
        }
        
      } catch (error) {
        console.log(`❌ Error processing framework ${fw.id}:`, error);
      }
    }
    
    console.log(`\n✅ DONE! Updated ${updated} frameworks, reduced ${modulesReduced} modules`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

reduceKeyConceptsTo3();
