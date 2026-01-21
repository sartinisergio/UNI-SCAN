import * as db from "../server/db";

async function debugEvaluation() {
  try {
    // Get all analyses
    const analyses = await db.getAnalysesByUser(1);
    
    if (!analyses || analyses.length === 0) {
      console.log("No analyses found");
      return;
    }
    
    // Find one with primary manual
    const analysis = analyses.find(a => a.primaryManualId);
    
    if (!analysis) {
      console.log("No analysis with primary manual found");
      return;
    }
    
    console.log("\n=== Analysis ===");
    console.log("ID:", analysis.id);
    console.log("Primary Manual ID:", analysis.primaryManualId);
    console.log("Program Title:", analysis.programTitle);
    
    // Get the evaluation for this manual
    const evaluation = await db.getEvaluationByManual(analysis.primaryManualId);
    
    if (!evaluation) {
      console.log("\nNo evaluation found for manual ID:", analysis.primaryManualId);
      return;
    }
    
    console.log("\n=== Evaluation ===");
    console.log("ID:", evaluation.id);
    console.log("Manual ID:", evaluation.manualId);
    console.log("Framework ID:", evaluation.frameworkId);
    
    const content = evaluation.content as any;
    console.log("\n=== Evaluation Content Structure ===");
    console.log("Keys:", Object.keys(content));
    
    if (content.frameworkCoverage) {
      console.log("\n=== Framework Coverage ===");
      console.log("Overall Score:", content.frameworkCoverage.overallScore);
      console.log("Number of modules:", content.frameworkCoverage.modules?.length || 0);
      
      if (content.frameworkCoverage.modules) {
        console.log("\nModules:");
        content.frameworkCoverage.modules.forEach((mod: any, i: number) => {
          console.log(`  ${i + 1}. ${mod.moduleName} - ${mod.coverage}%`);
        });
      }
    }
    
    console.log("\n=== Full Content (first 3000 chars) ===");
    console.log(JSON.stringify(content, null, 2).substring(0, 3000));
  } catch (error) {
    console.error("Error:", error);
  }
}

debugEvaluation();
