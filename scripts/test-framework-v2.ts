import * as db from "../server/db";
import { normalizeFramework } from "../server/services/frameworkNormalizer";

async function testFramework() {
  try {
    // Get Chemistry framework version 2.0
    const fw = await db.getFrameworkById(90006);
    if (!fw) {
      console.log("Framework not found");
      return;
    }
    
    console.log("Framework ID:", fw.id);
    console.log("Framework version:", fw.version);
    
    const normalized = normalizeFramework(fw.content as any);
    console.log("Normalized modules count:", normalized.modules.length);
    console.log("Modules:");
    normalized.modules.forEach((mod, i) => {
      console.log(`  ${i + 1}. ${mod.nome} - ${mod.argomenti.length} concepts`);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

testFramework();
