import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { 
  BookOpen, 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Star,
  ArrowRight,
  Upload,
  Sparkles,
  FileJson,
  Loader2,
  CloudDownload,
  Download
} from "lucide-react";

export default function DatabaseManuali() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedManualId, setSelectedManualId] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadManualId, setUploadManualId] = useState<number | null>(null);
  const [indexJson, setIndexJson] = useState("");
  
  const { data: subjects } = trpc.subjects.list.useQuery();
  const { data: manuals, refetch: refetchManuals } = trpc.manuals.listBySubject.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId }
  );
  
  // Query per ottenere tutte le valutazioni dei manuali della materia selezionata
  const { data: evaluationsMap } = trpc.evaluations.listBySubject.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId }
  );
  const { data: frameworks } = trpc.frameworks.listBySubject.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId }
  );
  
  const utils = trpc.useUtils();
  
  const updateIndexMutation = trpc.manuals.updateIndex.useMutation({
    onSuccess: () => {
      toast.success("Indice caricato con successo!");
      setUploadDialogOpen(false);
      setIndexJson("");
      refetchManuals();
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    }
  });
  
  const generateEvaluationMutation = trpc.evaluations.generate.useMutation({
    onSuccess: (data, variables) => {
      toast.success("Valutazione generata con successo! Clicca sulla scheda per visualizzarla.");
      // Invalida sia la singola valutazione che la lista per materia
      utils.evaluations.getByManual.invalidate();
      utils.evaluations.listBySubject.invalidate();
      // Auto-select the manual to show the evaluation
      setSelectedManualId(variables.manualId);
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    }
  });
  
  const regenerateAllEvaluationsMutation = trpc.manuals.regenerateAllEvaluations.useMutation({
    onSuccess: (data) => {
      toast.success(`Rigenerazione completata: ${data.successCount} valutazioni generate${data.errorCount > 0 ? `, ${data.errorCount} errori` : ""}`);
      if (data.errors.length > 0) {
        data.errors.forEach(err => toast.error(err));
      }
      utils.evaluations.listBySubject.invalidate();
      refetchManuals();
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    }
  });
  
  // reimportFromDropboxMutation rimosso - Dropbox integration completamente eliminata

  const toggleCompare = (manualId: number) => {
    if (selectedForCompare.includes(manualId)) {
      setSelectedForCompare(prev => prev.filter(id => id !== manualId));
    } else if (selectedForCompare.length < 3) {
      setSelectedForCompare(prev => [...prev, manualId]);
    }
  };
  
  const handleUploadIndex = () => {
    if (!uploadManualId || !indexJson.trim()) {
      toast.error("Inserisci il JSON dell'indice");
      return;
    }
    
    try {
      const parsed = JSON.parse(indexJson);
      updateIndexMutation.mutate({ id: uploadManualId, indexContent: parsed });
    } catch (e) {
      toast.error("JSON non valido. Verifica il formato.");
    }
  };
  
  const handleGenerateEvaluation = (manualId: number) => {
    const framework = frameworks?.[0];
    if (!framework) {
      toast.error("Nessun framework disponibile per questa materia");
      return;
    }
    generateEvaluationMutation.mutate({ manualId, frameworkId: framework.id });
  };
  
  const openUploadDialog = (manualId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadManualId(manualId);
    // Load existing index if available
    const manual = manuals?.find(m => m.id === manualId);
    if (manual?.indexContent) {
      setIndexJson(JSON.stringify(manual.indexContent, null, 2));
    } else {
      setIndexJson("");
    }
    setUploadDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Database Manuali</h1>
          <p className="text-muted-foreground mt-1">
            Consulta le schede di valutazione pre-generate per tutti i manuali
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Materia</label>
                <Select 
                  value={selectedSubjectId?.toString() || ""} 
                  onValueChange={(v) => {
                    setSelectedSubjectId(parseInt(v));
                    setSelectedManualId(null);
                    setSelectedForCompare([]);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleziona materia..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedSubjectId && manuals && manuals.length > 1 && (
                <>
                  <Button 
                    variant={compareMode ? "default" : "outline"}
                    onClick={() => {
                      setCompareMode(!compareMode);
                      setSelectedForCompare([]);
                      setSelectedManualId(null);
                    }}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {compareMode ? "Esci Confronto" : "Confronta Manuali"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (window.confirm("Rigenerare tutte le valutazioni per questa materia? Questo potrebbe richiedere alcuni minuti.")) {
                        regenerateAllEvaluationsMutation.mutate({ subjectId: selectedSubjectId });
                      }
                    }}
                    disabled={regenerateAllEvaluationsMutation.isPending}
                  >
                    {regenerateAllEvaluationsMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rigenerazione in corso...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Rigenera Tutte le Valutazioni
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manual List */}
        {selectedSubjectId && manuals && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {manuals.map((manual) => (
              <Card 
                key={manual.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedManualId === manual.id ? "ring-2 ring-primary" : ""
                } ${
                  compareMode && selectedForCompare.includes(manual.id) 
                    ? "ring-2 ring-blue-500" 
                    : ""
                }`}
                onClick={() => {
                  if (compareMode) {
                    toggleCompare(manual.id);
                  } else {
                    setSelectedManualId(manual.id);
                  }
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className={`h-5 w-5 ${
                        manual.type === "zanichelli" ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <Badge variant={manual.type === "zanichelli" ? "default" : "secondary"}>
                        {manual.type === "zanichelli" ? "Zanichelli" : "Competitor"}
                      </Badge>
                    </div>
                    {compareMode && (
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        selectedForCompare.includes(manual.id) 
                          ? "bg-blue-500 border-blue-500" 
                          : "border-muted-foreground"
                      }`}>
                        {selectedForCompare.includes(manual.id) && (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        )}
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-sm mt-2 leading-tight">{manual.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {manual.author} • {manual.publisher}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground mb-2">
                    {manual.edition && <span>{manual.edition} • </span>}
                    {manual.year && <span>{manual.year}</span>}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-1 mt-2">
                    <Button 
                      size="sm" 
                      variant={manual.indexContent ? "outline" : "default"}
                      onClick={(e) => openUploadDialog(manual.id, e)}
                      className="flex-1 text-xs h-7 px-2"
                    >
                      {manual.indexContent ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                          Indice
                        </>
                      ) : (
                        <>
                          <Upload className="h-3 w-3 mr-1" />
                          Indice
                        </>
                      )}
                    </Button>
                    
                    {!!manual.indexContent && (
                      evaluationsMap?.[manual.id] ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedManualId(manual.id);
                            }}
                            className="flex-1 text-xs h-7 px-2 text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Valutaz.
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Vuoi rigenerare la valutazione? La valutazione esistente verrà sovrascritta.')) {
                                handleGenerateEvaluation(manual.id);
                              }
                            }}
                            disabled={generateEvaluationMutation.isPending}
                            className="h-7 px-1.5"
                            title="Rigenera valutazione"
                          >
                            {generateEvaluationMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateEvaluation(manual.id);
                          }}
                          disabled={generateEvaluationMutation.isPending}
                          className="flex-1 text-xs h-7 px-2"
                        >
                          {generateEvaluationMutation.isPending ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3 mr-1" />
                          )}
                          Genera
                        </Button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Compare Mode Selection Info */}
        {compareMode && selectedForCompare.length > 0 && (
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {selectedForCompare.length} manual{selectedForCompare.length > 1 ? "i" : "e"} selezionat{selectedForCompare.length > 1 ? "i" : "o"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Seleziona fino a 3 manuali per il confronto
                  </p>
                </div>
                <Button 
                  disabled={selectedForCompare.length < 2}
                  onClick={() => {
                    // TODO: Navigate to compare view
                    toast.info("Funzionalità in arrivo");
                  }}
                >
                  Confronta <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Evaluation Detail */}
        {selectedManualId && !compareMode && (
          <EvaluationDetail manualId={selectedManualId} />
        )}

        {/* Empty State */}
        {!selectedSubjectId && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Seleziona una materia</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Scegli una materia dal menu sopra per visualizzare i manuali disponibili 
                e le relative schede di valutazione.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Upload Index Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Carica Indice Manuale
            </DialogTitle>
            <DialogDescription>
              Incolla il JSON dell'indice o carica un file .json
            </DialogDescription>
          </DialogHeader>
          
          {/* Action buttons at top */}
          <div className="flex gap-2 flex-shrink-0">
            {/* Pulsante Importa da Dropbox - RIMOSSO */}
          </div>
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <Textarea
              placeholder={`{\n  "capitoli": [\n    {\n      "numero": 1,\n      "titolo": "Introduzione",\n      "argomenti": ["Arg1", "Arg2"]\n    }\n  ]\n}`}
              value={indexJson}
              onChange={(e) => setIndexJson(e.target.value)}
              className="min-h-[250px] h-full font-mono text-sm resize-none"
            />
          </div>
          
          {/* Fixed footer */}
          <DialogFooter className="flex-shrink-0 border-t pt-3">
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleUploadIndex}
              disabled={updateIndexMutation.isPending || !indexJson.trim()}
            >
              {updateIndexMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                'Salva Indice'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function EvaluationDetail({ manualId }: { manualId: number }) {
  const { data: manual } = trpc.manuals.getById.useQuery({ id: manualId });
  const { data: evaluation, isLoading } = trpc.evaluations.getByManual.useQuery({ manualId });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Caricamento valutazione...
        </CardContent>
      </Card>
    );
  }

  if (!evaluation) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Valutazione non disponibile</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            La scheda di valutazione per questo manuale non è ancora stata generata.
            {manual?.indexContent ? (
              <span className="block mt-2">Clicca su "Genera Valutazione" per crearla automaticamente.</span>
            ) : (
              <span className="block mt-2">Prima carica l'indice del manuale, poi genera la valutazione.</span>
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  const content = evaluation.content as any;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{manual?.title}</CardTitle>
            <CardDescription>
              {manual?.author} • {manual?.publisher}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportEvaluationToHTML(manual, evaluation, content)}
            >
              <Download className="h-4 w-4 mr-1" />
              Esporta HTML
            </Button>
            <VerdictBadge verdict={evaluation.verdict || "Sufficiente"} />
            <div className="text-right">
              <div className="text-2xl font-bold">{evaluation.overallScore || 0}</div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="coverage">Copertura</TabsTrigger>
            <TabsTrigger value="strengths">Punti di Forza</TabsTrigger>
            <TabsTrigger value="weaknesses">Punti Deboli</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {content?.overview && (
              <>
                <div>
                  <h4 className="font-medium mb-2">Approccio Didattico</h4>
                  <p className="text-sm text-muted-foreground">
                    {content.overview.didacticApproach?.description || "Non disponibile"}
                  </p>
                  {content.overview.didacticApproach?.targetAudience && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Target:</strong> {content.overview.didacticApproach.targetAudience}
                    </p>
                  )}
                </div>
                
                {/* Nuovi campi per economia */}
                {(content.overview.didacticApproach?.authorSchool || 
                  content.overview.didacticApproach?.microSequence || 
                  content.overview.didacticApproach?.macroSequence || 
                  content.overview.didacticApproach?.growthApproach) && (
                  <div>
                    <h4 className="font-medium mb-2">Caratteristiche Economiche</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {content.overview.didacticApproach?.authorSchool && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                          <p className="text-xs text-muted-foreground">Scuola di Pensiero Autore</p>
                          <p className="font-medium text-blue-700 dark:text-blue-300">{content.overview.didacticApproach.authorSchool}</p>
                        </div>
                      )}
                      {content.overview.didacticApproach?.microSequence && content.overview.didacticApproach.microSequence !== "non applicabile" && (
                        <div className="p-3 rounded-lg bg-muted">
                          <p className="text-xs text-muted-foreground">Sequenza Microeconomia</p>
                          <p className="font-medium">{content.overview.didacticApproach.microSequence === "breve-lungo" ? "Prima Breve, poi Lungo periodo" : content.overview.didacticApproach.microSequence === "lungo-breve" ? "Prima Lungo, poi Breve periodo" : content.overview.didacticApproach.microSequence}</p>
                        </div>
                      )}
                      {content.overview.didacticApproach?.macroSequence && content.overview.didacticApproach.macroSequence !== "non applicabile" && (
                        <div className="p-3 rounded-lg bg-muted">
                          <p className="text-xs text-muted-foreground">Sequenza Macroeconomia</p>
                          <p className="font-medium">{content.overview.didacticApproach.macroSequence === "breve-lungo" ? "Prima Breve, poi Lungo periodo" : content.overview.didacticApproach.macroSequence === "lungo-breve" ? "Prima Lungo, poi Breve periodo" : content.overview.didacticApproach.macroSequence}</p>
                        </div>
                      )}
                      {content.overview.didacticApproach?.growthApproach && content.overview.didacticApproach.growthApproach !== "Non trattato" && (
                        <div className="p-3 rounded-lg bg-muted">
                          <p className="text-xs text-muted-foreground">Approccio alla Crescita</p>
                          <p className="font-medium">{content.overview.didacticApproach.growthApproach}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium mb-2">Livello Contenuti</h4>
                  <div className="grid gap-2 md:grid-cols-3">
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Ampiezza</p>
                      <p className="font-medium">{content.overview.contentLevel?.breadth || "-"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Profondità</p>
                      <p className="font-medium">{content.overview.contentLevel?.depth || "-"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-xs text-muted-foreground">Teoria/Pratica</p>
                      <p className="font-medium">{content.overview.contentLevel?.theoryPracticeBalance || "-"}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="coverage" className="space-y-4">
            {content?.frameworkCoverage?.modules?.map((module: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{module.moduleName}</span>
                  <span className="text-sm text-muted-foreground">{module.coveragePercentage}%</span>
                </div>
                <Progress value={module.coveragePercentage} className="h-2" />
                {module.notes && (
                  <p className="text-xs text-muted-foreground">{module.notes}</p>
                )}
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-4">
                Dati di copertura non disponibili
              </p>
            )}
            
            {content?.frameworkCoverage?.overallCoverage !== undefined && (
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Copertura Complessiva</span>
                  <span className="font-bold text-lg">{content.frameworkCoverage.overallCoverage}%</span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="strengths" className="space-y-3">
            {content?.strengths?.map((strength: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{strength.area}</p>
                  <p className="text-sm text-muted-foreground">{strength.description}</p>
                  {strength.relevance && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Rilevanza: {strength.relevance}
                    </Badge>
                  )}
                </div>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-4">
                Punti di forza non disponibili
              </p>
            )}
          </TabsContent>

          <TabsContent value="weaknesses" className="space-y-3">
            {content?.weaknesses?.map((weakness: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950">
                <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{weakness.area}</p>
                  <p className="text-sm text-muted-foreground">{weakness.description}</p>
                  {weakness.impact && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Impatto: {weakness.impact}
                    </Badge>
                  )}
                </div>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-4">
                Punti deboli non disponibili
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function exportEvaluationToHTML(manual: any, evaluation: any, content: any) {
  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Valutazione - ${manual?.title || 'Manuale'}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 0.5rem; }
    h2 { color: #1e40af; margin-top: 2rem; }
    h3 { color: #374151; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .score { text-align: right; }
    .score-value { font-size: 3rem; font-weight: bold; color: #1e40af; }
    .verdict { display: inline-block; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 600; }
    .verdict-eccellente { background: #dcfce7; color: #166534; }
    .verdict-buono { background: #dbeafe; color: #1e40af; }
    .verdict-sufficiente { background: #fef9c3; color: #854d0e; }
    .verdict-sconsigliato { background: #fee2e2; color: #991b1b; }
    .section { margin: 1.5rem 0; padding: 1rem; background: #f8fafc; border-radius: 0.5rem; }
    .strength { background: #dcfce7; padding: 1rem; border-radius: 0.5rem; margin: 0.5rem 0; }
    .weakness { background: #fee2e2; padding: 1rem; border-radius: 0.5rem; margin: 0.5rem 0; }
    .coverage-item { background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; margin: 0.5rem 0; }
    .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; margin-right: 0.5rem; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-yellow { background: #fef9c3; color: #854d0e; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f1f5f9; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${manual?.title || 'Manuale'}</h1>
      <p><strong>${manual?.author || ''}</strong> • ${manual?.publisher || ''}</p>
    </div>
    <div class="score">
      <span class="verdict verdict-${(evaluation.verdict || 'sufficiente').toLowerCase()}">${evaluation.verdict || 'Sufficiente'}</span>
      <div class="score-value">${evaluation.overallScore || 0}</div>
      <div>/ 100</div>
    </div>
  </div>

  <h2>Panoramica</h2>
  <div class="section">
    <h3>Approccio Didattico</h3>
    <p>${content?.overview?.didacticApproach?.description || 'Non disponibile'}</p>
    ${content?.overview?.didacticApproach?.targetAudience ? `<p><strong>Target:</strong> ${content.overview.didacticApproach.targetAudience}</p>` : ''}
  </div>

  ${(content?.overview?.didacticApproach?.authorSchool || content?.overview?.didacticApproach?.microSequence || content?.overview?.didacticApproach?.macroSequence || content?.overview?.didacticApproach?.growthApproach) ? `
  <div class="section">
    <h3>Caratteristiche Economiche</h3>
    <table>
      ${content.overview.didacticApproach.authorSchool ? `<tr><th>Scuola di Pensiero Autore</th><td><strong>${content.overview.didacticApproach.authorSchool}</strong></td></tr>` : ''}
      ${content.overview.didacticApproach.microSequence && content.overview.didacticApproach.microSequence !== 'non applicabile' ? `<tr><th>Sequenza Microeconomia</th><td>${content.overview.didacticApproach.microSequence === 'breve-lungo' ? 'Prima Breve, poi Lungo periodo' : content.overview.didacticApproach.microSequence === 'lungo-breve' ? 'Prima Lungo, poi Breve periodo' : content.overview.didacticApproach.microSequence}</td></tr>` : ''}
      ${content.overview.didacticApproach.macroSequence && content.overview.didacticApproach.macroSequence !== 'non applicabile' ? `<tr><th>Sequenza Macroeconomia</th><td>${content.overview.didacticApproach.macroSequence === 'breve-lungo' ? 'Prima Breve, poi Lungo periodo' : content.overview.didacticApproach.macroSequence === 'lungo-breve' ? 'Prima Lungo, poi Breve periodo' : content.overview.didacticApproach.macroSequence}</td></tr>` : ''}
      ${content.overview.didacticApproach.growthApproach && content.overview.didacticApproach.growthApproach !== 'Non trattato' ? `<tr><th>Approccio alla Crescita</th><td>${content.overview.didacticApproach.growthApproach}</td></tr>` : ''}
    </table>
  </div>
  ` : ''}

  ${content?.overview?.contentLevel ? `
  <div class="section">
    <h3>Livello Contenuti</h3>
    <table>
      <tr><th>Ampiezza</th><td>${content.overview.contentLevel.breadth || 'N/A'}</td></tr>
      <tr><th>Profondità</th><td>${content.overview.contentLevel.depth || 'N/A'}</td></tr>
      <tr><th>Teoria/Pratica</th><td>${content.overview.contentLevel.theoryPracticeBalance || 'N/A'}</td></tr>
    </table>
  </div>
  ` : ''}

  <h2>Copertura Framework</h2>
  ${content?.frameworkCoverage?.modules?.map((item: any) => `
  <div class="coverage-item">
    <h3>${item.moduleName}</h3>
    <p><span class="badge badge-blue">${item.coveragePercentage}%</span></p>
    ${item.notes ? `<p>${item.notes}</p>` : ''}
    ${item.coveredTopics?.length > 0 ? `
    <div style="margin-top: 0.5rem;">
      <strong style="color: #166534;">Argomenti coperti:</strong>
      <ul style="margin: 0.25rem 0; padding-left: 1.5rem;">
        ${item.coveredTopics.map((t: string) => `<li>${t}</li>`).join('')}
      </ul>
    </div>` : ''}
    ${item.missingTopics?.length > 0 ? `
    <div style="margin-top: 0.5rem;">
      <strong style="color: #991b1b;">Argomenti mancanti:</strong>
      <ul style="margin: 0.25rem 0; padding-left: 1.5rem;">
        ${item.missingTopics.map((t: string) => `<li>${t}</li>`).join('')}
      </ul>
    </div>` : ''}
  </div>
  `).join('') || '<p>Dati di copertura non disponibili</p>'}

  <h2>Punti di Forza</h2>
  ${content?.strengths?.map((s: any) => `
  <div class="strength">
    <h3>${s.area}</h3>
    <p>${s.description}</p>
    ${s.impact ? `<span class="badge badge-green">Impatto: ${s.impact}</span>` : ''}
  </div>
  `).join('') || '<p>Non disponibili</p>'}

  <h2>Punti Deboli</h2>
  ${content?.weaknesses?.map((w: any) => `
  <div class="weakness">
    <h3>${w.area}</h3>
    <p>${w.description}</p>
    ${w.impact ? `<span class="badge badge-yellow">Impatto: ${w.impact}</span>` : ''}
  </div>
  `).join('') || '<p>Non disponibili</p>'}

  <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.875rem;">
    <p>Valutazione generata da UNI-SCAN il ${new Date().toLocaleDateString('it-IT')}</p>
  </footer>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = (manual?.title || 'valutazione').replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `valutazione_${safeTitle}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const config = {
    "Eccellente": { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: Star },
    "Buono": { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: CheckCircle2 },
    "Sufficiente": { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: AlertTriangle },
    "Sconsigliato": { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: XCircle },
  } as const;
  
  const { color, icon: Icon } = config[verdict as keyof typeof config] || config["Sufficiente"];
  
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
      <Icon className="h-4 w-4" />
      {verdict}
    </div>
  );
}
