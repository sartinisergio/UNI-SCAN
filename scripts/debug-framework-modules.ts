import * as db from "../server/db";
import { normalizeFramework } from "../server/services/frameworkNormalizer";

async function debugFramework() {
  try {
    // Get Chemistry General framework
    const framework = await db.getFrameworkById(60001); // Chimica Generale
    
    if (!framework) {
      console.log("Framework not found");
      return;
    }
    
    console.log("\n=== Framework ===");
    console.log("ID:", framework.id);
    console.log("Name:", framework.name);
    
    const content = framework.content as any;
    console.log("\n=== Raw Framework Structure ===");
    console.log("Keys:", Object.keys(content));
    
    if (content.syllabus_modules) {
      console.log("Direct syllabus_modules count:", content.syllabus_modules.length);
    }
    
    if (content.content?.syllabus_modules) {
      console.log("Nested content.syllabus_modules count:", content.content.syllabus_modules.length);
    }
    
    // Normalize the framework
    const normalized = normalizeFramework(framework.content as any);
    
    console.log("\n=== Normalized Framework ===");
    console.log("Modules count:", normalized.modules.length);
    console.log("Modules:");
    normalized.modules.forEach((mod, i) => {
      console.log(`  ${i + 1}. ${mod.name}`);
      console.log(`     Topics: ${mod.topics.length}`);
      if (mod.topics.length > 0) {
        console.log(`     First 3: ${mod.topics.slice(0, 3).join(", ")}`);
      }
    });
    
    console.log("\n=== Full Content (first 2000 chars) ===");
    console.log(JSON.stringify(content, null, 2).substring(0, 2000));
  } catch (error) {
    console.error("Error:", error);
  }
}

debugFramework();
