import * as db from "../server/db";
import { normalizeFramework } from "../server/services/frameworkNormalizer";
import { generateManualEvaluation } from "../server/services/manualEvaluator";

async function debugCompleteFlow() {
  try {
    console.log("=== COMPLETE EVALUATION FLOW DEBUG ===\n");
    
    // Step 1: Get the framework
    console.log("Step 1: Getting Chemistry framework (ID 90006)...");
    const fw = await db.getFrameworkById(90006);
    if (!fw) {
      console.log("❌ Framework not found");
      return;
    }
    console.log(`✅ Framework found: version ${fw.version}`);
    
    // Step 2: Normalize the framework
    console.log("\nStep 2: Normalizing framework...");
    const normalized = normalizeFramework(fw.content as any);
    console.log(`✅ Normalized framework has ${normalized.modules.length} modules:`);
    normalized.modules.forEach((mod, i) => {
      console.log(`   ${i + 1}. ${mod.nome} - ${mod.argomenti.length} concepts`);
    });
    
    // Step 3: Get a manual to evaluate
    console.log("\nStep 3: Getting Atkins manual...");
    const manuals = await db.getManualsBySubject(6, "Zanichelli");
    const atkins = manuals.find(m => m.title.includes("Principi di Chimica"));
    if (!atkins) {
      console.log("❌ Principi di Chimica manual not found");
      console.log("Available manuals:", manuals.map(m => m.title).slice(0, 5));
      return;
    }
    console.log(`✅ Found manual: ${atkins.title}`);
    console.log(`   Has index: ${atkins.indexContent ? "yes" : "no"}`);
    
    if (!atkins.indexContent) {
      console.log("❌ Manual has no index content");
      return;
    }
    
    // Step 4: Generate evaluation
    console.log("\nStep 4: Generating evaluation with LLM...");
    console.log(`   Framework: ${normalized.modules.length} modules`);
    console.log(`   Manual index chapters: ${(atkins.indexContent as any).length}`);
    
    const evaluation = await generateManualEvaluation(
      1,
      { title: atkins.title, author: atkins.author, publisher: atkins.publisher },
      atkins.indexContent as any,
      fw.content as any,
      "Chimica Generale"
    );
    
    console.log(`✅ Evaluation generated!`);
    console.log(`   Overall score: ${evaluation.overallScore}`);
    console.log(`   Modules evaluated: ${evaluation.frameworkCoverage.modules.length}`);
    console.log(`   Modules:`);
    evaluation.frameworkCoverage.modules.forEach((mod, i) => {
      console.log(`     ${i + 1}. ${mod.moduleName} - ${mod.coveragePercentage}%`);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

debugCompleteFlow();
