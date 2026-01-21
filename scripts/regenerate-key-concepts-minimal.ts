import * as db from "../server/db";
import { invokeLLM } from "../server/_core/llm";

async function regenerateKeyConceptsMinimal() {
  try {
    console.log("=== REGENERATING KEY CONCEPTS (MINIMAL) ===\n");
    
    // Get all frameworks from all subjects
    const subjects = await db.getAllSubjects();
    let frameworks: any[] = [];
    for (const subject of subjects) {
      const fws = await db.getFrameworksBySubject(subject.id);
      frameworks.push(...fws);
    }
    console.log(`Found ${frameworks.length} frameworks\n`);
    
    let updated = 0;
    
    for (const fw of frameworks) {
      try {
        const content = fw.content as any;
        
        // Get modules based on framework structure
        let modules: any[] = [];
        if (content.syllabus_modules) {
          modules = content.syllabus_modules;
        } else if (content.modules) {
          modules = content.modules;
        } else if (content.moduli) {
          modules = content.moduli;
        }
        
        if (modules.length === 0) continue;
        
        console.log(`Processing ${fw.version} (${modules.length} modules)...`);
        
        // Process each module
        for (const module of modules) {
          if (module.key_concepts && module.key_concepts.length > 0) {
            // Already has key_concepts, keep only top 3
            module.key_concepts = module.key_concepts.slice(0, 3);
          } else if (module.core_contents) {
            // Extract key concepts from core_contents
            const coreText = Array.isArray(module.core_contents) 
              ? module.core_contents.join(" ")
              : module.core_contents;
            
            if (!coreText || coreText.length < 20) continue;
            
            try {
              const response = await invokeLLM({
                messages: [
                  {
                    role: "system",
                    content: "Estrai ESATTAMENTE 3 concetti chiave dal testo fornito. Rispondi con un JSON array di 3 stringhe, niente altro."
                  },
                  {
                    role: "user",
                    content: `Testo: "${coreText.substring(0, 500)}"\n\nRispondi con: ["concetto1", "concetto2", "concetto3"]`
                  }
                ],
                response_format: {
                  type: "json_schema",
                  json_schema: {
                    name: "key_concepts",
                    strict: true,
                    schema: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 3,
                      maxItems: 3
                    }
                  }
                }
              });
              
              const content = response.choices[0].message.content;
              let concepts = [];
              
              // Parse JSON response
              try {
                concepts = JSON.parse(content);
              } catch {
                // Try to extract array from markdown
                const match = content.match(/\[.*\]/s);
                if (match) {
                  concepts = JSON.parse(match[0]);
                }
              }
              
              if (Array.isArray(concepts) && concepts.length === 3) {
                module.key_concepts = concepts;
              }
            } catch (error) {
              console.log(`  ⚠️  Error extracting concepts for module: ${module.name || module.nome}`);
            }
          }
        }
        
        // Update framework
        await db.updateFramework(fw.id, { content });
        updated++;
        console.log(`✅ Updated ${fw.version}\n`);
        
      } catch (error) {
        console.log(`❌ Error processing framework ${fw.id}:`, error);
      }
    }
    
    console.log(`\n✅ DONE! Updated ${updated} frameworks`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

regenerateKeyConceptsMinimal();
