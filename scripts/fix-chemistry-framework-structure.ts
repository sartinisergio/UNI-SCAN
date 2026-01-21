import * as db from "../server/db";

async function fixChemistryFramework() {
  try {
    // Get the current Chemistry framework
    const framework = await db.getFrameworkById(60001);
    
    if (!framework) {
      console.log("Framework not found");
      return;
    }
    
    const currentContent = framework.content as any;
    
    // The correct structure should have content.syllabus_modules with 15 modules
    // Currently it has modules, core_modules, etc.
    
    // If the framework already has the correct structure, we're done
    if (currentContent.content?.syllabus_modules) {
      console.log("Framework already has correct structure with", currentContent.content.syllabus_modules.length, "modules");
      return;
    }
    
    // If it has syllabus_modules at top level, wrap it in content
    if (currentContent.syllabus_modules) {
      console.log("Framework has syllabus_modules at top level. Wrapping in content...");
      const newContent = {
        ...currentContent,
        content: {
          syllabus_modules: currentContent.syllabus_modules,
          program_profiles: currentContent.program_profiles || []
        }
      };
      
      // Update the framework
      await db.updateFramework(60001, newContent);
      console.log("Framework updated successfully!");
      return;
    }
    
    console.log("Framework structure not recognized. Current keys:", Object.keys(currentContent));
    
  } catch (error) {
    console.error("Error:", error);
  }
}

fixChemistryFramework();
