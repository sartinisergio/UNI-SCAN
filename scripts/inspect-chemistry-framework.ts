import * as db from "../server/db";

async function inspectFramework() {
  try {
    const framework = await db.getFrameworkById(60001); // Chimica Generale
    
    if (!framework) {
      console.log("Framework not found");
      return;
    }
    
    const content = framework.content as any;
    
    console.log("\n=== Framework Structure ===");
    console.log("Top-level keys:", Object.keys(content));
    
    // Check core_modules
    if (content.core_modules) {
      console.log("\n=== core_modules ===");
      console.log("Type:", typeof content.core_modules);
      console.log("Is array:", Array.isArray(content.core_modules));
      if (Array.isArray(content.core_modules)) {
        console.log("Count:", content.core_modules.length);
        console.log("First module keys:", Object.keys(content.core_modules[0] || {}));
        console.log("First module:", JSON.stringify(content.core_modules[0], null, 2).substring(0, 500));
      }
    }
    
    // Check framework
    if (content.framework) {
      console.log("\n=== framework ===");
      console.log("Type:", typeof content.framework);
      console.log("Is array:", Array.isArray(content.framework));
      if (Array.isArray(content.framework)) {
        console.log("Count:", content.framework.length);
        console.log("First item keys:", Object.keys(content.framework[0] || {}));
        console.log("First item:", JSON.stringify(content.framework[0], null, 2).substring(0, 500));
      } else if (typeof content.framework === 'object') {
        console.log("Keys:", Object.keys(content.framework));
        if (content.framework.syllabus_modules) {
          console.log("Has syllabus_modules:", content.framework.syllabus_modules.length);
          console.log("First module:", JSON.stringify(content.framework.syllabus_modules[0], null, 2).substring(0, 500));
        }
      }
    }
    
    // Check modules
    if (content.modules) {
      console.log("\n=== modules ===");
      console.log("Type:", typeof content.modules);
      console.log("Is array:", Array.isArray(content.modules));
      if (Array.isArray(content.modules)) {
        console.log("Count:", content.modules.length);
        console.log("First module keys:", Object.keys(content.modules[0] || {}));
        console.log("First module:", JSON.stringify(content.modules[0], null, 2).substring(0, 500));
      }
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

inspectFramework();
