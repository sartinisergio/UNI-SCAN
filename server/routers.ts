import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { SUBJECTS } from "@shared/types";
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
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSubject(input.id);
        return { success: true };
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
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // Soft delete: mark as inactive
        await db.updateFramework(input.id, { isActive: false });
        return { success: true };
      }),
    
    deactivateAll: adminProcedure
      .mutation(async () => {
        await db.deactivateAllFrameworks();
        return { success: true };
      })
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
        // Soft delete: mark as inactive
        await db.updateManual(input.id, { isActive: false });
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
    
    // Restore a soft-deleted manual
    restore: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateManual(input.id, { isActive: true });
        return { success: true };
      }),
    regenerateAllEvaluations: adminProcedure
      .input(z.object({ subjectId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const manuals = await db.getManualsBySubject(input.subjectId);
        const framework = await db.getActiveFramework(input.subjectId);
        
        if (!framework) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Framework non trovato" });
        }
        
        const subject = await db.getSubjectById(input.subjectId);
        const subjectName = subject?.name || "Materia";
        
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];
        
        for (const manual of manuals) {
          try {
            if (!manual.indexContent) {
              errorCount++;
              errors.push(manual.title + ": Indice non caricato");
              continue;
            }
            
            const evaluation = await manualEvaluator.generateManualEvaluation(
              ctx.user.id,
              { title: manual.title, author: manual.author, publisher: manual.publisher },
              manual.indexContent as any,
              framework.content as any,
              subjectName
            );
            
            const existingEval = await db.getEvaluationByManual(manual.id);
            
            if (existingEval) {
              await db.updateEvaluation(existingEval.id, {
                content: evaluation,
                overallScore: evaluation.overallScore,
                verdict: evaluation.verdict,
              });
            } else {
              await db.createEvaluation({
                manualId: manual.id,
                frameworkId: framework.id,
                content: evaluation,
                overallScore: evaluation.overallScore,
                verdict: evaluation.verdict,
              });
            }
            
            successCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`[regenerateAllEvaluations] Errore per manuale ${manual.title}:`, error);
            errorCount++;
            const msg = error instanceof Error ? error.message : "Errore sconosciuto";
            errors.push(manual.title + ": " + msg);
          }
        }
        
        return {
          success: true,
          successCount,
          errorCount,
          errors,
          message: "Rigenerazione completata: " + successCount + " valutazioni, " + errorCount + " errori"
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
        degreeClass: z.string().optional(),
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
            degreeClass: input.degreeClass,
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

    convertPdf: publicProcedure
      .input(z.object({
        pdfBase64: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        try {
          const base64Data = input.pdfBase64.replace(/^data:application\/pdf;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");
          const fs = await import("fs").then(m => m.promises);
          const path = await import("path");
          const os = await import("os");
          const tmpDir = os.tmpdir();
          const tmpFile = path.join(tmpDir, `pdf-${Date.now()}.pdf`);
          await fs.writeFile(tmpFile, buffer);
          const { execFile: execFileCallback } = await import("child_process");
          const { promisify } = await import("util");
          const execFile = promisify(execFileCallback);
          const { stdout } = await execFile("pdftotext", [tmpFile, "-"]);
          await fs.unlink(tmpFile);
          return {
            testo: stdout,
            success: true,
          };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Errore durante la conversione del PDF",
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

  // Dropbox Integration - COMPLETAMENTE RIMOSSO
  // Gli utenti caricano i framework e i manuali direttamente via UI
});

export type AppRouter = typeof appRouter;
