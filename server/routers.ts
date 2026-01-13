import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { SUBJECTS } from "@shared/types";
import * as dropbox from "./services/dropbox";
import * as analysisService from "./services/analysis";
import * as emailGenerator from "./services/emailGenerator";
import * as manualEvaluator from "./services/manualEvaluator";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // API Configuration
  apiConfig: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getApiConfigsByUserId(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ provider: z.enum(["openai", "perplexity", "claude", "dropbox"]) }))
      .query(async ({ ctx, input }) => {
        const config = await db.getApiConfig(ctx.user.id, input.provider);
        return config ? { ...config, apiKey: "***" } : null;
      }),
    
    upsert: protectedProcedure
      .input(z.object({
        provider: z.enum(["openai", "perplexity", "claude", "dropbox"]),
        apiKey: z.string().min(1),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertApiConfig({
          userId: ctx.user.id,
          provider: input.provider,
          apiKey: input.apiKey,
          isActive: input.isActive ?? true,
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ provider: z.enum(["openai", "perplexity", "claude", "dropbox"]) }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteApiConfig(ctx.user.id, input.provider);
        return { success: true };
      }),
    
    // LLM Provider preference
    getLlmProvider: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      return { provider: user?.llmProvider || "manus" };
    }),
    
    setLlmProvider: protectedProcedure
      .input(z.object({ provider: z.enum(["manus", "openai"]) }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserLlmProvider(ctx.user.id, input.provider);
        return { success: true };
      }),
  }),

  // Subjects (Materie)
  subjects: router({
    list: publicProcedure.query(async () => {
      const dbSubjects = await db.getAllSubjects();
      if (dbSubjects.length === 0) {
        // Return default subjects if none in DB
        return SUBJECTS.map((s, i) => ({
          id: i + 1,
          code: s.code,
          name: s.name,
          description: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      }
      return dbSubjects;
    }),
    
    getByCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const subject = await db.getSubjectByCode(input.code);
        return subject ?? null;
      }),
    
    create: adminProcedure
      .input(z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createSubject({
          code: input.code,
          name: input.name,
          description: input.description,
        });
        return { id };
      }),
  }),

  // Frameworks
  frameworks: router({
    listBySubject: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ input }) => {
        return db.getFrameworksBySubject(input.subjectId);
      }),
    
    getActive: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ input }) => {
        const framework = await db.getActiveFramework(input.subjectId);
        return framework ?? null;
      }),
    
    create: adminProcedure
      .input(z.object({
        subjectId: z.number(),
        version: z.string().min(1),
        content: z.any(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createFramework({
          subjectId: input.subjectId,
          version: input.version,
          content: input.content,
          createdBy: ctx.user.id,
        });
        return { id };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        version: z.string().optional(),
        content: z.any().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateFramework(id, data);
        return { success: true };
      }),
  }),

  // Manuals
  manuals: router({
    listBySubject: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ input }) => {
        return db.getManualsBySubject(input.subjectId);
      }),
    
    getZanichelli: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ input }) => {
        return db.getZanichelliManuals(input.subjectId);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const manual = await db.getManualById(input.id);
        return manual ?? null;
      }),
    
    create: adminProcedure
      .input(z.object({
        subjectId: z.number(),
        title: z.string().min(1),
        author: z.string().min(1),
        publisher: z.string().min(1),
        edition: z.string().optional(),
        year: z.number().optional(),
        totalPages: z.number().optional(),
        type: z.enum(["zanichelli", "competitor"]),
        indexContent: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createManual({
          ...input,
          createdBy: ctx.user.id,
        });
        return { id };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        author: z.string().optional(),
        publisher: z.string().optional(),
        edition: z.string().optional(),
        year: z.number().optional(),
        totalPages: z.number().optional(),
        indexContent: z.any().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateManual(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteManual(input.id);
        return { success: true };
      }),
    
    // Upload index JSON for a manual
    updateIndex: adminProcedure
      .input(z.object({
        id: z.number(),
        indexContent: z.any(),
      }))
      .mutation(async ({ input }) => {
        await db.updateManual(input.id, { indexContent: input.indexContent });
        return { success: true };
      }),
    
    // Reimport index from Dropbox for a single manual
    reimportIndexFromDropbox: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Get manual info
        const manual = await db.getManualById(input.id);
        if (!manual) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Manuale non trovato" });
        }
        
        // Get subject info
        const subject = await db.getSubjectById(manual.subjectId);
        if (!subject) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Materia non trovata" });
        }
        
        // Determine folder path based on manual type
        const basePath = manual.type === "zanichelli" 
          ? "/2_Manuali_Zanichelli" 
          : "/3_manuali_competitor";
        
        // List files in the subject subfolder
        const subjectFolder = `${basePath}/${subject.name}`;
        let files;
        try {
          files = await dropbox.listDropboxFolder(ctx.user.id, subjectFolder);
        } catch {
          // Try with code instead of name
          const altFolder = `${basePath}/${subject.code}`;
          files = await dropbox.listDropboxFolder(ctx.user.id, altFolder);
        }
        
        // Find matching file by manual title or author
        const normalizeTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
        const manualTitleNorm = normalizeTitle(manual.title);
        const manualAuthorNorm = normalizeTitle(manual.author || "");
        
        // Log available files for debugging
        console.log(`[Dropbox] Looking for manual: "${manual.title}" by ${manual.author}`);
        console.log(`[Dropbox] Available files:`, files.map(f => f.name));
        
        // Try multiple matching strategies
        let matchingFile = files.find(f => {
          const fileTitle = normalizeTitle(f.name.replace(".json", ""));
          // Exact title match
          return fileTitle === manualTitleNorm;
        });
        
        if (!matchingFile) {
          // Try partial title match
          matchingFile = files.find(f => {
            const fileTitle = normalizeTitle(f.name.replace(".json", ""));
            return fileTitle.includes(manualTitleNorm) || manualTitleNorm.includes(fileTitle);
          });
        }
        
        if (!matchingFile) {
          // Try author match (file might be named by author)
          matchingFile = files.find(f => {
            const fileTitle = normalizeTitle(f.name.replace(".json", ""));
            return fileTitle.includes(manualAuthorNorm) || manualAuthorNorm.includes(fileTitle);
          });
        }
        
        if (!matchingFile) {
          // Try combined title+author match
          matchingFile = files.find(f => {
            const fileTitle = normalizeTitle(f.name.replace(".json", ""));
            const combined = manualTitleNorm + manualAuthorNorm;
            return fileTitle.includes(combined.slice(0, 10)) || combined.includes(fileTitle.slice(0, 10));
          });
        }
        
        if (!matchingFile) {
          throw new TRPCError({ 
            code: "NOT_FOUND", 
            message: `File non trovato su Dropbox per: ${manual.title}. File disponibili: ${files.map(f => f.name).join(", ")}` 
          });
        }
        
        // Download and update
        const content = await dropbox.downloadDropboxFile(ctx.user.id, matchingFile.path_lower);
        const indexContent = content.indice || content.index || content;
        
        await db.updateManual(input.id, { indexContent });
        
        return { 
          success: true, 
          fileName: matchingFile.name,
          chaptersCount: Array.isArray(indexContent?.capitoli) ? indexContent.capitoli.length : 0
        };
      }),
  }),

  // Manual Evaluations
  evaluations: router({
    getByManual: protectedProcedure
      .input(z.object({ manualId: z.number() }))
      .query(async ({ input }) => {
        const evaluation = await db.getEvaluationByManual(input.manualId);
        return evaluation ?? null;
      }),
    
    listBySubject: protectedProcedure
      .input(z.object({ subjectId: z.number() }))
      .query(async ({ input }) => {
        return db.getEvaluationsBySubject(input.subjectId);
      }),
    
    create: adminProcedure
      .input(z.object({
        manualId: z.number(),
        frameworkId: z.number(),
        content: z.any(),
        overallScore: z.number().optional(),
        verdict: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createEvaluation(input);
        return { id };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        content: z.any().optional(),
        overallScore: z.number().optional(),
        verdict: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateEvaluation(id, data);
        return { success: true };
      }),
    
    // Generate evaluation using GPT-4
    generate: adminProcedure
      .input(z.object({
        manualId: z.number(),
        frameworkId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get manual with index
        const manual = await db.getManualById(input.manualId);
        if (!manual) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Manuale non trovato" });
        }
        if (!manual.indexContent) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Il manuale non ha un indice caricato" });
        }
        
        // Get framework
        const framework = await db.getFrameworkById(input.frameworkId);
        if (!framework) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Framework non trovato" });
        }
        
        // Get subject name for the manual
        const subject = await db.getSubjectById(manual.subjectId);
        const subjectName = subject?.name || "Materia non specificata";
        
        // Generate evaluation
        const evaluation = await manualEvaluator.generateManualEvaluation(
          ctx.user.id,
          { title: manual.title, author: manual.author, publisher: manual.publisher },
          manual.indexContent as any,
          framework.content as any,
          subjectName
        );
        
        // Check if evaluation already exists
        const existingEval = await db.getEvaluationByManual(input.manualId);
        
        if (existingEval) {
          // Update existing
          await db.updateEvaluation(existingEval.id, {
            content: evaluation,
            overallScore: evaluation.overallScore,
            verdict: evaluation.verdict,
          });
          return { id: existingEval.id, evaluation };
        } else {
          // Create new
          const id = await db.createEvaluation({
            manualId: input.manualId,
            frameworkId: input.frameworkId,
            content: evaluation,
            overallScore: evaluation.overallScore,
            verdict: evaluation.verdict,
          });
          return { id, evaluation };
        }
      }),
  }),

  // Analyses (Scenario 1)
  analyses: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getAnalysesByUser(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.id);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return analysis;
      }),
    
    create: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
        programTitle: z.string().min(1),
        programContent: z.string().min(1),
        universityName: z.string().optional(),
        professorName: z.string().optional(),
        degreeCourse: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createAnalysis({
          ...input,
          userId: ctx.user.id,
          status: "pending",
        });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        contextualAnalysis: z.any().optional(),
        technicalAnalysis: z.any().optional(),
        identifiedManualId: z.number().optional(),
        recommendedManualId: z.number().optional(),
        gaps: z.any().optional(),
        postIt: z.any().optional(),
        generatedEmail: z.any().optional(),
        status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.id);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const { id, ...data } = input;
        await db.updateAnalysis(id, data);
        return { success: true };
      }),
    
    // Delete analysis
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const analysis = await db.getAnalysisById(input.id);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Analisi non trovata" });
        }
        await db.deleteAnalysis(input.id);
        return { success: true };
      }),
    
    // Run full analysis (3 phases)
    runAnalysis: protectedProcedure
      .input(z.object({
        subjectId: z.number(),
        programTitle: z.string().min(1),
        programContent: z.string().min(10),
        universityName: z.string().optional(),
        professorName: z.string().optional(),
        degreeCourse: z.string().optional(),
        primaryManualId: z.number().optional(),
        primaryManualCustom: z.object({
          title: z.string(),
          author: z.string(),
          publisher: z.string(),
        }).optional(),
        alternativeManuals: z.array(z.object({
          manualId: z.number().optional(),
          custom: z.object({
            title: z.string(),
            author: z.string(),
            publisher: z.string(),
          }).optional(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Recupera i dati del manuale principale se selezionato dal database
          let primaryManualData = null;
          if (input.primaryManualId) {
            const manual = await db.getManualById(input.primaryManualId);
            if (manual) {
              primaryManualData = {
                id: manual.id,
                title: manual.title,
                author: manual.author,
                publisher: manual.publisher,
                type: manual.type,
              };
            }
          } else if (input.primaryManualCustom) {
            primaryManualData = {
              id: null,
              title: input.primaryManualCustom.title,
              author: input.primaryManualCustom.author,
              publisher: input.primaryManualCustom.publisher,
              type: "competitor" as const,
            };
          }
          
          // Recupera i dati dei manuali alternativi
          const alternativeManualsData = [];
          if (input.alternativeManuals) {
            for (const alt of input.alternativeManuals) {
              if (alt.manualId) {
                const manual = await db.getManualById(alt.manualId);
                if (manual) {
                  alternativeManualsData.push({
                    id: manual.id,
                    title: manual.title,
                    author: manual.author,
                    publisher: manual.publisher,
                    type: manual.type,
                  });
                }
              } else if (alt.custom) {
                alternativeManualsData.push({
                  id: null,
                  title: alt.custom.title,
                  author: alt.custom.author,
                  publisher: alt.custom.publisher,
                  type: "competitor" as const,
                });
              }
            }
          }
          
          // Run the full 3-phase analysis
          const result = await analysisService.runFullAnalysis({
            programText: input.programContent,
            subjectId: input.subjectId,
            userId: ctx.user.id,
            universityName: input.universityName,
            courseName: input.programTitle,
            professorName: input.professorName,
            degreeCourse: input.degreeCourse,
            primaryManual: primaryManualData,
            alternativeManuals: alternativeManualsData.length > 0 ? alternativeManualsData : undefined,
          });
          
          // Save to database - use extracted text from result metadata
          const extractedText = result.metadata.program_text_extracted || input.programContent;
          const analysisId = await analysisService.saveAnalysis(
            ctx.user.id,
            input.subjectId,
            input.universityName || "Non specificato",
            input.programTitle,
            input.professorName || null,
            extractedText,
            result,
            input.degreeCourse,
            input.primaryManualId,
            input.primaryManualCustom,
            input.alternativeManuals
          );
          
          return {
            id: analysisId,
            result,
          };
        } catch (error) {
          console.error("[Analysis] Error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Errore durante l'analisi",
          });
        }
      }),
    
    // Generate email from analysis
    generateEmail: protectedProcedure
      .input(z.object({
        analysisId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Get the analysis
          const analysis = await db.getAnalysisById(input.analysisId);
          if (!analysis || analysis.userId !== ctx.user.id) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Analisi non trovata" });
          }
          
          // Get promoter profile
          const promoterProfile = await db.getPromoterProfile(ctx.user.id);
          if (!promoterProfile) {
            throw new TRPCError({ 
              code: "BAD_REQUEST", 
              message: "Profilo promotore non configurato. Vai su Impostazioni per completare il profilo." 
            });
          }
          
          // Get subject info
          const subject = await db.getSubjectById(analysis.subjectId);
          
          // Get recommended manual info from postIt
          const postItData = analysis.postIt as any;
          const manualeRaccomandato = postItData?.opportunita_zanichelli?.manuale_consigliato;
          
          // Prepare analysis result object
          const analysisResult = {
            analisi_contestuale: analysis.contextualAnalysis,
            analisi_tecnica: analysis.technicalAnalysis,
            sintesi_commerciale: analysis.gaps,
            raccomandazione_manuale: manualeRaccomandato ? {
              titolo: manualeRaccomandato.titolo,
              autori: manualeRaccomandato.autore,
              punti_forza: postItData?.opportunita_zanichelli?.punti_forza_vs_competitor?.map((p: any) => p.descrizione) || [],
            } : undefined,
            metadata: {
              professor_name: analysis.professorName,
              course_name: analysis.programTitle,
              subject_name: subject?.name || "Non specificato",
            },
          };
          
          // Generate email
          const email = await emailGenerator.generateEmailFromAnalysis(
            ctx.user.id,
            analysisResult,
            {
              nome: promoterProfile.fullName,
              telefono: promoterProfile.phone || undefined,
              email: promoterProfile.email || undefined,
            },
            {
              nomeDocente: analysis.professorName || undefined,
              titoloCorso: analysis.programTitle,
              areaDisciplinare: subject?.name || "Non specificato",
            }
          );
          
          // Save email to analysis
          await db.updateAnalysis(input.analysisId, {
            generatedEmail: email,
          });
          
          return { success: true, email };
        } catch (error) {
          console.error("[GenerateEmail] Error:", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Errore nella generazione dell'email",
          });
        }
      }),
  }),

  // Promoter Profile
  promoterProfile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getPromoterProfile(ctx.user.id);
      return profile ?? null;
    }),
    
    upsert: protectedProcedure
      .input(z.object({
        fullName: z.string().min(1),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        territory: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertPromoterProfile({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),

  // Dropbox Integration
  dropbox: router({
    // Get folder structure from Dropbox
    getFolderStructure: adminProcedure.query(async ({ ctx }) => {
      try {
        const structure = await dropbox.getDropboxFolderStructure(ctx.user.id);
        return { success: true, structure };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: message, structure: {} };
      }
    }),

    // Import frameworks from Dropbox
    importFrameworks: adminProcedure.mutation(async ({ ctx }) => {
      const frameworks = await dropbox.getFrameworksFromDropbox(ctx.user.id);
      const results = { imported: 0, errors: [] as string[] };

      for (const fw of frameworks) {
        try {
          // Find matching subject
          const subjectCode = fw.subjectCode
            .replace(/_/g, "_")
            .toLowerCase();
          
          const allSubjects = await db.getAllSubjects();
          const subject = allSubjects.find(
            (s) => s.code.toLowerCase() === subjectCode ||
                   s.code.toLowerCase().replace(/_/g, "") === subjectCode.replace(/_/g, "")
          );

          if (!subject) {
            results.errors.push(`Subject not found for: ${fw.fileName}`);
            continue;
          }

          // Check if framework already exists
          const existing = await db.getActiveFramework(subject.id);
          if (existing) {
            // Update existing
            await db.updateFramework(existing.id, { content: fw.content });
          } else {
            // Create new
            await db.createFramework({
              subjectId: subject.id,
              version: "1.0",
              content: fw.content,
              createdBy: ctx.user.id,
            });
          }
          results.imported++;
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          results.errors.push(`${fw.fileName}: ${msg}`);
        }
      }

      return results;
    }),

    // Import manuals from Dropbox
    importManuals: adminProcedure
      .input(z.object({ type: z.enum(["zanichelli", "competitor"]) }))
      .mutation(async ({ ctx, input }) => {
        const manuals = input.type === "zanichelli"
          ? await dropbox.getZanichelliManualsFromDropbox(ctx.user.id)
          : await dropbox.getCompetitorManualsFromDropbox(ctx.user.id);

        const results = { imported: 0, errors: [] as string[] };
        const allSubjects = await db.getAllSubjects();

        for (const manual of manuals) {
          try {
            const content = manual.content;
            
            // Extract manual info from content
            const title = content.titolo || content.title || manual.fileName.replace(".json", "");
            const author = content.autore || content.author || "N/A";
            const publisher = input.type === "zanichelli" ? "Zanichelli" : (content.editore || content.publisher || "N/A");
            
            // Use subjectCode from folder structure (more reliable)
            const subjectCodeFromFolder = manual.subjectCode || "";
            const subjectName = content.materia || content.subject || "";

            // Find matching subject - first try folder code, then content
            let subject = allSubjects.find(
              (s) => s.code.toLowerCase() === subjectCodeFromFolder.toLowerCase() ||
                     s.code.toLowerCase().replace(/_/g, "") === subjectCodeFromFolder.toLowerCase().replace(/_/g, "")
            );
            
            // Fallback to content-based matching
            if (!subject && subjectName) {
              subject = allSubjects.find(
                (s) => s.name.toLowerCase().includes(subjectName.toLowerCase()) ||
                       subjectName.toLowerCase().includes(s.name.toLowerCase()) ||
                       s.code.toLowerCase() === subjectName.toLowerCase().replace(/ /g, "_")
              );
            }

            if (!subject) {
              results.errors.push(`Subject not found for manual: ${title} (folder: ${subjectCodeFromFolder})`);
              continue;
            }

            // Create manual
            await db.createManual({
              subjectId: subject.id,
              title,
              author,
              publisher,
              type: input.type,
              indexContent: content.indice || content.index || content,
              createdBy: ctx.user.id,
            });
            results.imported++;
          } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            results.errors.push(`${manual.fileName}: ${msg}`);
          }
        }

        return results;
      }),

    // List files in a specific folder
    listFolder: adminProcedure
      .input(z.object({ path: z.string() }))
      .query(async ({ ctx, input }) => {
        try {
          const files = await dropbox.listDropboxFolder(ctx.user.id, input.path);
          return { success: true, files };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          return { success: false, error: message, files: [] };
        }
      }),

    // Get OAuth authorization URL
    getAuthUrl: adminProcedure
      .input(z.object({
        appKey: z.string().min(1),
        redirectUri: z.string().url(),
      }))
      .mutation(async ({ ctx, input }) => {
        const state = `${ctx.user.id}_${Date.now()}`;
        const authUrl = dropbox.getDropboxAuthUrl(input.appKey, input.redirectUri, state);
        return { authUrl, state };
      }),

    // Exchange authorization code for tokens
    exchangeCode: adminProcedure
      .input(z.object({
        code: z.string().min(1),
        appKey: z.string().min(1),
        appSecret: z.string().min(1),
        redirectUri: z.string().url(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { accessToken, refreshToken, expiresIn } = await dropbox.exchangeCodeForTokens(
            input.code,
            input.appKey,
            input.appSecret,
            input.redirectUri
          );

          // Calculate expiration time
          const expiresAt = new Date(Date.now() + expiresIn * 1000);

          // Save tokens to database (including appKey and appSecret for auto-refresh)
          await db.upsertApiConfigWithRefresh(
            ctx.user.id,
            "dropbox",
            accessToken,
            refreshToken,
            expiresAt,
            input.appKey,
            input.appSecret
          );

          return { 
            success: true, 
            message: "Dropbox connesso con successo! Il token verrà rinnovato automaticamente.",
            expiresAt 
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          throw new TRPCError({ code: "BAD_REQUEST", message });
        }
      }),

    // Check if refresh token is configured
    hasRefreshToken: protectedProcedure.query(async ({ ctx }) => {
      const config = await db.getApiConfig(ctx.user.id, "dropbox");
      return {
        hasRefreshToken: !!config?.refreshToken,
        tokenExpiresAt: config?.tokenExpiresAt || null,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
