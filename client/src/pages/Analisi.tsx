import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { usePublisher } from "@/contexts/PublisherContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  FileSearch, 
  Upload, 
  Play, 
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BookOpen,
  Mail,
  Copy,
  ArrowRight,
  Target,
  TrendingUp,
  Users,
  Building,
  BarChart3,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Plus,
  X
} from "lucide-react";
import { useLocation } from "wouter";

type AnalysisStep = "input" | "processing" | "results";

interface AnalysisResult {
  metadata: {
    data_analisi: string;
    materia: string;
    corso_laurea: string;
    ateneo: string;
    docente: string;
    versione_sistema: string;
  };
  fase_1_contestuale: {
    filosofia_didattica: {
      approccio_principale: string;
      bilanciamento_teoria_pratica: string;
      livello_rigore: string;
      livello_accessibilita: string;
      enfasi_applicazioni: string;
      interdisciplinarita: string;
      confidence: number;
    };
    priorita_pedagogiche: {
      profondita_vs_ampiezza: string;
      sequenza_didattica: string;
      metodologie: string[];
      valutazione: {
        modalita: string[];
        prove_in_itinere: boolean;
      };
      confidence: number;
    };
    target_studenti: {
      corso_di_laurea: string;
      curriculum: string;
      anno: number | string;
      background_atteso: string[];
      obiettivi_formativi: string;
      confidence: number;
    };
    contesto_istituzionale: {
      ateneo: string;
      dipartimento: string;
      orientamento: string;
      stakeholder: string[];
      confidence: number;
    };
    sintesi_profilo: string;
  };
  fase_2_tecnica: {
    copertura_moduli: Array<{
      modulo_id: number;
      modulo_nome: string;
      copertura_percentuale: number;
      argomenti_coperti: string[];
      argomenti_omessi: string[];
      argomenti_extra: string[];
      livello_profondita: string;
      note: string;
    }>;
    copertura_totale: number;
    moduli_ben_coperti: number[];
    moduli_parzialmente_coperti: number[];
    moduli_omessi: number[];
    profondita_ampiezza: {
      livello_generale: string;
      distribuzione: {
        introduttivo: number;
        intermedio: number;
        avanzato: number;
      };
      bilanciamento_teoria_applicazioni: string;
      argomenti_avanzati: string[];
      note: string;
    };
    sequenza_organizzazione: {
      approccio: string;
      ordine_logico: string;
      prerequisiti_rispettati: boolean;
      integrazione_argomenti: string;
      note: string;
    };
    manuale_adottato: {
      titolo: string;
      autore: string;
      editore: string;
      edizione: string;
      anno: number | string;
      allineamento_programma: number;
      capitoli_utilizzati: number[];
      capitoli_non_utilizzati: number[];
      argomenti_programma_non_in_manuale: string[];
      note: string;
    } | null;
    sintesi_tecnica: string;
  };
  fase_3_commerciale: {
    insight_principale: string;
    valutazione_manuale_adottato: {
      punti_forza: string[];
      punti_debolezza: string[];
      gap_rispetto_programma: string[];
    } | null;
    gap_identificati: Array<{
      tipo: string;
      descrizione: string;
      gravita: string;
      modulo_riferimento?: string;
      impatto_commerciale: string;
    }>;
    opportunita_zanichelli: {
      manuale_consigliato: {
        id: number;
        titolo: string;
        autore: string;
      } | null;
      punti_forza_vs_competitor: Array<{
        area: string;
        descrizione: string;
        rilevanza_per_programma: string;
      }>;
      allineamento_profilo_pedagogico: number;
    };
    argomentazioni_vendita: Array<{
      ordine: number;
      messaggio: string;
      supporto: string;
      impatto: string;
    }>;
    strategia_approccio: {
      fase_1: {
        azione: string;
        contenuto: string;
        materiali: string[];
        obiettivo: string;
      };
      fase_2: {
        azione: string;
        contenuto: string;
        materiali: string[];
        obiettivo: string;
      };
      fase_3: {
        azione: string;
        contenuto: string;
        materiali: string[];
        obiettivo: string;
      };
      punti_attenzione: string[];
    };
    post_it: string;
  };
}

export default function Analisi() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<AnalysisStep>("input");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [programTitle, setProgramTitle] = useState("");
  const [programContent, setProgramContent] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [professorName, setProfessorName] = useState("");
  const [degreeCourse, setDegreeCourse] = useState("");
  const [degreeClass, setDegreeClass] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [processingPhase, setProcessingPhase] = useState(0);
  const { selectedPublisher } = usePublisher();
  
  // Bibliografia strutturata
  const [primaryManualId, setPrimaryManualId] = useState<number | null>(null);
  const [primaryManualCustom, setPrimaryManualCustom] = useState<{title: string; author: string; publisher: string} | null>(null);
  const [showPrimaryCustom, setShowPrimaryCustom] = useState(false);
  const [alternativeManuals, setAlternativeManuals] = useState<Array<{manualId: number | null; custom: {title: string; author: string; publisher: string} | null; showCustom: boolean}>>([]);
  
  const { data: subjects } = trpc.subjects.list.useQuery();
  
  // Query per ottenere il framework della materia selezionata
  const { data: activeFramework } = trpc.frameworks.getActive.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId }
  );
  
  // Estrarre le classi di laurea dal framework
  const degreeClasses = (activeFramework?.content as any)?.framework?.classes_analyzed || [];
  
  // Formattare i nomi delle classi (es. L-13_Biologia -> L-13 Biologia)
  const formattedDegreeClasses = degreeClasses.map((dc: string) => {
    const parts = dc.split('_');
    const code = parts[0];
    const name = parts.slice(1).join(' ');
    return `${code} ${name}`;
  });
  
  // Query per ottenere i manuali della materia selezionata
  const { data: manualsForSubject } = trpc.manuals.listBySubject.useQuery(
    { subjectId: selectedSubjectId!, publisher: selectedPublisher },
    { enabled: !!selectedSubjectId }
  );
  
  const runAnalysisMutation = trpc.analyses.runAnalysis.useMutation({
    onSuccess: (data) => {
      setAnalysisId(data.id);
      setAnalysisResult(data.result as AnalysisResult);
      setStep("results");
      toast.success("Analisi completata con successo!");
    },
    onError: (error) => {
      setStep("input");
      toast.error(`Errore: ${error.message}`);
    },
  });

  // Simulate processing phases
  useEffect(() => {
    if (step === "processing") {
      const phases = [
        { delay: 2000, phase: 1 },  // Fase 1: Analisi Contestuale
        { delay: 6000, phase: 2 },  // Fase 2: Analisi Tecnica
        { delay: 10000, phase: 3 }, // Fase 3: Sintesi Commerciale
      ];
      
      phases.forEach(({ delay, phase }) => {
        setTimeout(() => {
          if (step === "processing") {
            setProcessingPhase(phase);
          }
        }, delay);
      });
    }
  }, [step]);

  const handleStartAnalysis = () => {
    if (!selectedSubjectId) {
      toast.error("Seleziona una materia");
      return;
    }
    if (!programTitle.trim()) {
      toast.error("Inserisci il titolo del programma");
      return;
    }
    if (!programContent.trim() || programContent.trim().length < 100) {
      toast.error("Inserisci il contenuto del programma (almeno 100 caratteri)");
      return;
    }
    
    setStep("processing");
    setProcessingPhase(0);
    
    // Prepara i dati della bibliografia
    const altManualsData = alternativeManuals
      .filter(m => m.manualId || (m.custom?.title && m.custom?.author))
      .map(m => ({
        manualId: m.manualId || undefined,
        custom: m.custom && m.custom.title && m.custom.author ? m.custom : undefined
      }));
    
    runAnalysisMutation.mutate({
      subjectId: selectedSubjectId,
      programTitle: programTitle.trim(),
      programContent: programContent.trim(),
      universityName: universityName.trim() || undefined,
      professorName: professorName.trim() || undefined,
      degreeCourse: degreeCourse.trim() || undefined,
      degreeClass: degreeClass.trim() || undefined,
      primaryManualId: primaryManualId || undefined,
      primaryManualCustom: primaryManualCustom && primaryManualCustom.title && primaryManualCustom.author 
        ? primaryManualCustom 
        : undefined,
      alternativeManuals: altManualsData.length > 0 ? altManualsData : undefined,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setProgramContent(content);
      if (!programTitle) {
        setProgramTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      toast.success("File caricato con successo");
    };
    reader.readAsText(file);
  };

  const resetForm = () => {
    setStep("input");
    setSelectedSubjectId(null);
    setProgramTitle("");
    setProgramContent("");
    setUniversityName("");
    setProfessorName("");
    setDegreeCourse("");
    setDegreeClass("");
    setPrimaryManualId(null);
    setPrimaryManualCustom(null);
    setShowPrimaryCustom(false);
    setAlternativeManuals([]);
    setAnalysisResult(null);
    setAnalysisId(null);
    setProcessingPhase(0);
  };
  
  // Reset bibliografia quando cambia la materia
  useEffect(() => {
    setPrimaryManualId(null);
    setPrimaryManualCustom(null);
    setShowPrimaryCustom(false);
    setAlternativeManuals([]);
  }, [selectedSubjectId]);
  
  // Funzioni per gestire i manuali alternativi
  const addAlternativeManual = () => {
    setAlternativeManuals([...alternativeManuals, { manualId: null, custom: null, showCustom: false }]);
  };
  
  const removeAlternativeManual = (index: number) => {
    setAlternativeManuals(alternativeManuals.filter((_, i) => i !== index));
  };
  
  const updateAlternativeManual = (index: number, updates: Partial<typeof alternativeManuals[0]>) => {
    setAlternativeManuals(alternativeManuals.map((m, i) => i === index ? { ...m, ...updates } : m));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiato negli appunti");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analisi Situazionale</h1>
          <p className="text-muted-foreground mt-1">
            Analizza un programma universitario e ottieni raccomandazioni personalizzate
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4">
          <StepIndicator 
            step={1} 
            label="Input" 
            active={step === "input"} 
            completed={step !== "input"} 
          />
          <div className="flex-1 h-0.5 bg-muted" />
          <StepIndicator 
            step={2} 
            label="Elaborazione" 
            active={step === "processing"} 
            completed={step === "results"} 
          />
          <div className="flex-1 h-0.5 bg-muted" />
          <StepIndicator 
            step={3} 
            label="Risultati" 
            active={step === "results"} 
            completed={false} 
          />
        </div>

        {/* Input Step */}
        {step === "input" && (
          <Card>
            <CardHeader>
              <CardTitle>Inserisci i dati del programma</CardTitle>
              <CardDescription>
                Carica o incolla il programma del corso da analizzare
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subject Selection */}
              <div className="space-y-2">
                <Label>Materia *</Label>
                <Select 
                  value={selectedSubjectId?.toString() || ""} 
                  onValueChange={(v) => setSelectedSubjectId(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona la materia..." />
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

              {/* Degree Class Selection */}
              {degreeClasses && degreeClasses.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="degreeClass">Classe di Laurea *</Label>
                  <Select value={degreeClass} onValueChange={setDegreeClass}>
                    <SelectTrigger id="degreeClass">
                      <SelectValue placeholder="Seleziona classe di laurea..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(formattedDegreeClasses as string[]).map((dc: string) => {
                        const code = dc.split(' ')[0];
                        return (
                          <SelectItem key={code} value={code}>
                            {dc}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Program Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="programTitle">Titolo Programma *</Label>
                  <Input
                    id="programTitle"
                    placeholder="es. Chimica Organica A.A. 2024/25"
                    value={programTitle}
                    onChange={(e) => setProgramTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="universityName">Università</Label>
                  <Input
                    id="universityName"
                    placeholder="es. Università di Bologna"
                    value={universityName}
                    onChange={(e) => setUniversityName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="professorName">Docente</Label>
                  <Input
                    id="professorName"
                    placeholder="es. Prof. Mario Rossi"
                    value={professorName}
                    onChange={(e) => setProfessorName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degreeCourse">Corso di Laurea</Label>
                  <Input
                    id="degreeCourse"
                    placeholder="es. Laurea Triennale in Economia"
                    value={degreeCourse}
                    onChange={(e) => setDegreeCourse(e.target.value)}
                  />
                </div>
              </div>

              {/* Bibliografia Adottata */}
              {selectedSubjectId && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Bibliografia Adottata</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Seleziona i manuali indicati nel programma del corso. Il primo è considerato il manuale principale/preferito.
                  </p>
                  
                  {/* Manuale Principale */}
                  <div className="space-y-2">
                    <Label>Manuale Principale (preferito dal docente)</Label>
                    {!showPrimaryCustom ? (
                      <div className="flex gap-2">
                        <Select
                          value={primaryManualId?.toString() || ""}
                          onValueChange={(v) => {
                            if (v === "other") {
                              setShowPrimaryCustom(true);
                              setPrimaryManualId(null);
                            } else {
                              setPrimaryManualId(parseInt(v));
                            }
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Seleziona un manuale..." />
                          </SelectTrigger>
                          <SelectContent>
                            {manualsForSubject?.map((manual) => (
                              <SelectItem key={manual.id} value={manual.id.toString()}>
                                <span className="flex items-center gap-2">
                                  {manual.type === "zanichelli" && (
                                    <Badge variant="secondary" className="text-xs">Zanichelli</Badge>
                                  )}
                                  {manual.title} - {manual.author}
                                </span>
                              </SelectItem>
                            ))}
                            <SelectItem value="other">
                              <span className="text-muted-foreground">+ Altro (non presente nel database)</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2 p-3 border rounded bg-background">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Manuale non nel database</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowPrimaryCustom(false);
                              setPrimaryManualCustom(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid gap-2 md:grid-cols-3">
                          <Input
                            placeholder="Titolo"
                            value={primaryManualCustom?.title || ""}
                            onChange={(e) => setPrimaryManualCustom({
                              ...primaryManualCustom || { title: "", author: "", publisher: "" },
                              title: e.target.value
                            })}
                          />
                          <Input
                            placeholder="Autore"
                            value={primaryManualCustom?.author || ""}
                            onChange={(e) => setPrimaryManualCustom({
                              ...primaryManualCustom || { title: "", author: "", publisher: "" },
                              author: e.target.value
                            })}
                          />
                          <Input
                            placeholder="Editore"
                            value={primaryManualCustom?.publisher || ""}
                            onChange={(e) => setPrimaryManualCustom({
                              ...primaryManualCustom || { title: "", author: "", publisher: "" },
                              publisher: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Manuali Alternativi */}
                  <div className="space-y-2">
                    <Label>Manuali Alternativi (opzionali)</Label>
                    {alternativeManuals.map((alt, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        {!alt.showCustom ? (
                          <>
                            <Select
                              value={alt.manualId?.toString() || ""}
                              onValueChange={(v) => {
                                if (v === "other") {
                                  updateAlternativeManual(index, { showCustom: true, manualId: null });
                                } else {
                                  updateAlternativeManual(index, { manualId: parseInt(v) });
                                }
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Seleziona un manuale alternativo..." />
                              </SelectTrigger>
                              <SelectContent>
                                {manualsForSubject?.map((manual) => (
                                  <SelectItem key={manual.id} value={manual.id.toString()}>
                                    <span className="flex items-center gap-2">
                                      {manual.type === "zanichelli" && (
                                        <Badge variant="secondary" className="text-xs">Zanichelli</Badge>
                                      )}
                                      {manual.title} - {manual.author}
                                    </span>
                                  </SelectItem>
                                ))}
                                <SelectItem value="other">
                                  <span className="text-muted-foreground">+ Altro (non presente nel database)</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAlternativeManual(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="flex-1 space-y-2 p-3 border rounded bg-background">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Manuale alternativo #{index + 1}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAlternativeManual(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid gap-2 md:grid-cols-3">
                              <Input
                                placeholder="Titolo"
                                value={alt.custom?.title || ""}
                                onChange={(e) => updateAlternativeManual(index, {
                                  custom: {
                                    ...alt.custom || { title: "", author: "", publisher: "" },
                                    title: e.target.value
                                  }
                                })}
                              />
                              <Input
                                placeholder="Autore"
                                value={alt.custom?.author || ""}
                                onChange={(e) => updateAlternativeManual(index, {
                                  custom: {
                                    ...alt.custom || { title: "", author: "", publisher: "" },
                                    author: e.target.value
                                  }
                                })}
                              />
                              <Input
                                placeholder="Editore"
                                value={alt.custom?.publisher || ""}
                                onChange={(e) => updateAlternativeManual(index, {
                                  custom: {
                                    ...alt.custom || { title: "", author: "", publisher: "" },
                                    publisher: e.target.value
                                  }
                                })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addAlternativeManual}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi manuale alternativo
                    </Button>
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Carica File (opzionale)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Clicca per caricare un file TXT
                    </p>
                  </label>
                </div>
              </div>

              {/* Program Content */}
              <div className="space-y-2">
                <Label htmlFor="programContent">Contenuto del Programma *</Label>
                <Textarea
                  id="programContent"
                  placeholder="Incolla qui il contenuto del programma del corso..."
                  value={programContent}
                  onChange={(e) => setProgramContent(e.target.value)}
                  className="min-h-[300px]"
                />
                <p className="text-xs text-muted-foreground">
                  {programContent.length} caratteri (minimo 100)
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={resetForm}>
                  Cancella
                </Button>
                <Button 
                  onClick={handleStartAnalysis}
                  disabled={runAnalysisMutation.isPending}
                >
                  {runAnalysisMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Avvia Analisi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Step */}
        {step === "processing" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Analisi in corso...
              </CardTitle>
              <CardDescription>
                L'analisi richiede circa 30-60 secondi. Non chiudere questa pagina.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <ProcessingPhase 
                  phase={1} 
                  title="Fase 1: Analisi Contestuale" 
                  description="Estrazione del profilo pedagogico del docente"
                  active={processingPhase === 1}
                  completed={processingPhase > 1}
                />
                <ProcessingPhase 
                  phase={2} 
                  title="Fase 2: Analisi Tecnica" 
                  description="Confronto contenuti vs framework di valutazione"
                  active={processingPhase === 2}
                  completed={processingPhase > 2}
                />
                <ProcessingPhase 
                  phase={3} 
                  title="Fase 3: Sintesi Commerciale" 
                  description="Generazione raccomandazioni e post-it"
                  active={processingPhase === 3}
                  completed={false}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Step */}
        {step === "results" && analysisResult && (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Analisi Completata
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {analysisResult.metadata.materia} - {analysisResult.metadata.ateneo}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetForm}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Nuova Analisi
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 bg-background rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      {Math.round(analysisResult.fase_2_tecnica.copertura_totale)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Copertura Framework</div>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <div className="text-3xl font-bold text-orange-500">
                      {analysisResult.fase_3_commerciale.gap_identificati.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Gap Identificati</div>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <div className="text-3xl font-bold text-green-500">
                      {analysisResult.fase_3_commerciale.opportunita_zanichelli.allineamento_profilo_pedagogico}%
                    </div>
                    <div className="text-sm text-muted-foreground">Allineamento Zanichelli</div>
                  </div>
                  <div className="text-center p-4 bg-background rounded-lg">
                    <div className="text-3xl font-bold text-blue-500">
                      {analysisResult.fase_3_commerciale.argomentazioni_vendita.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Argomentazioni</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Results Tabs */}
            <Tabs defaultValue="postit" className="space-y-4">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="postit">Post-it</TabsTrigger>
                <TabsTrigger value="profilo">Profilo Docente</TabsTrigger>
                <TabsTrigger value="copertura">Copertura</TabsTrigger>
                <TabsTrigger value="gap">Gap & Opportunità</TabsTrigger>
                <TabsTrigger value="strategia">Strategia</TabsTrigger>
              </TabsList>

              {/* Post-it Tab */}
              <TabsContent value="postit">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Post-it Commerciale
                        </CardTitle>
                        <CardDescription>
                          Sintesi pronta per il promotore
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(analysisResult.fase_3_commerciale.post_it)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copia
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {analysisResult.fase_3_commerciale.post_it}
                      </p>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Insight Principale
                      </h4>
                      <p className="text-muted-foreground">
                        {analysisResult.fase_3_commerciale.insight_principale}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profilo Docente Tab */}
              <TabsContent value="profilo">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Target className="h-4 w-4" />
                        Filosofia Didattica
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoRow label="Approccio" value={analysisResult.fase_1_contestuale.filosofia_didattica.approccio_principale} />
                      <InfoRow label="Teoria/Pratica" value={analysisResult.fase_1_contestuale.filosofia_didattica.bilanciamento_teoria_pratica} />
                      <InfoRow label="Rigore" value={analysisResult.fase_1_contestuale.filosofia_didattica.livello_rigore} />
                      <InfoRow label="Accessibilità" value={analysisResult.fase_1_contestuale.filosofia_didattica.livello_accessibilita} />
                      <InfoRow label="Applicazioni" value={analysisResult.fase_1_contestuale.filosofia_didattica.enfasi_applicazioni} />
                      {/* Nuovi campi per economia */}
                      {(analysisResult.fase_1_contestuale.filosofia_didattica as any).scuola_pensiero && (
                        <InfoRow label="Scuola di Pensiero" value={(analysisResult.fase_1_contestuale.filosofia_didattica as any).scuola_pensiero} />
                      )}
                      {(analysisResult.fase_1_contestuale.filosofia_didattica as any).sequenza_micro && (analysisResult.fase_1_contestuale.filosofia_didattica as any).sequenza_micro !== "non applicabile" && (
                        <InfoRow label="Sequenza Micro" value={(analysisResult.fase_1_contestuale.filosofia_didattica as any).sequenza_micro === "breve-lungo" ? "Prima Breve, poi Lungo" : (analysisResult.fase_1_contestuale.filosofia_didattica as any).sequenza_micro === "lungo-breve" ? "Prima Lungo, poi Breve" : (analysisResult.fase_1_contestuale.filosofia_didattica as any).sequenza_micro} />
                      )}
                      {(analysisResult.fase_1_contestuale.filosofia_didattica as any).sequenza_macro && (analysisResult.fase_1_contestuale.filosofia_didattica as any).sequenza_macro !== "non applicabile" && (
                        <InfoRow label="Sequenza Macro" value={(analysisResult.fase_1_contestuale.filosofia_didattica as any).sequenza_macro === "breve-lungo" ? "Prima Breve, poi Lungo" : (analysisResult.fase_1_contestuale.filosofia_didattica as any).sequenza_macro === "lungo-breve" ? "Prima Lungo, poi Breve" : (analysisResult.fase_1_contestuale.filosofia_didattica as any).sequenza_macro} />
                      )}
                      {(analysisResult.fase_1_contestuale.filosofia_didattica as any).approccio_crescita && (analysisResult.fase_1_contestuale.filosofia_didattica as any).approccio_crescita !== "Non trattato" && (
                        <InfoRow label="Approccio Crescita" value={(analysisResult.fase_1_contestuale.filosofia_didattica as any).approccio_crescita} />
                      )}
                      <div className="pt-2">
                        <Badge variant="outline">
                          Confidence: {Math.round(analysisResult.fase_1_contestuale.filosofia_didattica.confidence * 100)}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        Target Studenti
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoRow label="Corso di Laurea" value={analysisResult.fase_1_contestuale.target_studenti.corso_di_laurea} />
                      <InfoRow label="Curriculum" value={analysisResult.fase_1_contestuale.target_studenti.curriculum} />
                      <InfoRow label="Anno" value={String(analysisResult.fase_1_contestuale.target_studenti.anno)} />
                      <div>
                        <span className="text-sm text-muted-foreground">Background atteso:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysisResult.fase_1_contestuale.target_studenti.background_atteso.map((bg, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{bg}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building className="h-4 w-4" />
                        Contesto Istituzionale
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoRow label="Ateneo" value={analysisResult.fase_1_contestuale.contesto_istituzionale.ateneo} />
                      <InfoRow label="Dipartimento" value={analysisResult.fase_1_contestuale.contesto_istituzionale.dipartimento} />
                      <InfoRow label="Orientamento" value={analysisResult.fase_1_contestuale.contesto_istituzionale.orientamento} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="h-4 w-4" />
                        Priorità Pedagogiche
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <InfoRow label="Profondità vs Ampiezza" value={analysisResult.fase_1_contestuale.priorita_pedagogiche.profondita_vs_ampiezza} />
                      <InfoRow label="Sequenza" value={analysisResult.fase_1_contestuale.priorita_pedagogiche.sequenza_didattica} />
                      <div>
                        <span className="text-sm text-muted-foreground">Metodologie:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysisResult.fase_1_contestuale.priorita_pedagogiche.metodologie.map((m, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{m}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base">Sintesi del Profilo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {analysisResult.fase_1_contestuale.sintesi_profilo}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Copertura Tab */}
              <TabsContent value="copertura">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Copertura dei Moduli
                    </CardTitle>
                    <CardDescription>
                      Confronto tra programma e framework di valutazione
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysisResult.fase_2_tecnica.copertura_moduli.map((modulo) => (
                        <div key={modulo.modulo_id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{modulo.modulo_nome}</span>
                            <span className={`text-sm font-semibold ${
                              modulo.copertura_percentuale >= 80 ? 'text-green-500' :
                              modulo.copertura_percentuale >= 50 ? 'text-yellow-500' :
                              'text-red-500'
                            }`}>
                              {modulo.copertura_percentuale}%
                            </span>
                          </div>
                          <Progress value={modulo.copertura_percentuale} className="h-2" />
                          {modulo.argomenti_omessi.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              <span className="text-red-500">Omessi:</span> {modulo.argomenti_omessi.join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <h4 className="font-semibold">Sintesi Tecnica</h4>
                      <p className="text-muted-foreground">
                        {analysisResult.fase_2_tecnica.sintesi_tecnica}
                      </p>
                    </div>

                    {analysisResult.fase_2_tecnica.manuale_adottato && (
                      <>
                        <Separator className="my-6" />
                        <div className="space-y-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Manuale Adottato Identificato
                          </h4>
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="font-medium">
                              {analysisResult.fase_2_tecnica.manuale_adottato.titolo}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {analysisResult.fase_2_tecnica.manuale_adottato.autore} - {analysisResult.fase_2_tecnica.manuale_adottato.editore}
                            </p>
                            <p className="text-sm mt-2">
                              Allineamento con programma: <span className="font-semibold">{analysisResult.fase_2_tecnica.manuale_adottato.allineamento_programma}%</span>
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Gap & Opportunità Tab */}
              <TabsContent value="gap">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Gap Identificati
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {analysisResult.fase_3_commerciale.gap_identificati.map((gap, i) => (
                            <div key={i} className="border rounded-lg p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant={
                                  gap.gravita === "alta" ? "destructive" :
                                  gap.gravita === "media" ? "default" : "secondary"
                                }>
                                  {gap.gravita}
                                </Badge>
                                <Badge variant="outline">{gap.tipo.replace(/_/g, " ")}</Badge>
                              </div>
                              <p className="text-sm">{gap.descrizione}</p>
                              {gap.modulo_riferimento && (
                                <p className="text-xs text-muted-foreground">
                                  Modulo: {gap.modulo_riferimento}
                                </p>
                              )}
                              <p className="text-xs text-primary">
                                Impatto: {gap.impatto_commerciale}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BookOpen className="h-4 w-4 text-green-500" />
                        Opportunità Zanichelli
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysisResult.fase_3_commerciale.opportunita_zanichelli.manuale_consigliato ? (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <p className="font-semibold text-green-700 dark:text-green-300">
                            Manuale Consigliato
                          </p>
                          <p className="font-medium mt-1">
                            {analysisResult.fase_3_commerciale.opportunita_zanichelli.manuale_consigliato.titolo}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {analysisResult.fase_3_commerciale.opportunita_zanichelli.manuale_consigliato.autore}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-muted rounded-lg p-4 text-center text-muted-foreground">
                          Nessun manuale Zanichelli disponibile per questa materia
                        </div>
                      )}

                      <div className="space-y-3">
                        <h5 className="font-medium">Punti di Forza vs Competitor</h5>
                        {analysisResult.fase_3_commerciale.opportunita_zanichelli.punti_forza_vs_competitor.map((punto, i) => (
                          <div key={i} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{punto.area}</span>
                              <Badge variant="outline" className="text-xs">
                                {punto.rilevanza_per_programma}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{punto.descrizione}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {analysisResult.fase_3_commerciale.valutazione_manuale_adottato && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-base">Valutazione Manuale Adottato</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <h5 className="font-medium text-green-600 mb-2">Punti di Forza</h5>
                          <ul className="text-sm space-y-1">
                            {analysisResult.fase_3_commerciale.valutazione_manuale_adottato.punti_forza.map((p, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-red-600 mb-2">Punti di Debolezza</h5>
                          <ul className="text-sm space-y-1">
                            {analysisResult.fase_3_commerciale.valutazione_manuale_adottato.punti_debolezza.map((p, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-orange-600 mb-2">Gap vs Programma</h5>
                          <ul className="text-sm space-y-1">
                            {analysisResult.fase_3_commerciale.valutazione_manuale_adottato.gap_rispetto_programma.map((p, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <ArrowRight className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Strategia Tab */}
              <TabsContent value="strategia">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Argomentazioni di Vendita
                      </CardTitle>
                      <CardDescription>
                        Messaggi chiave ordinati per impatto
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysisResult.fase_3_commerciale.argomentazioni_vendita.map((arg) => (
                          <div key={arg.ordine} className="flex gap-4 items-start">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              arg.impatto === "alto" ? "bg-green-100 text-green-700" :
                              arg.impatto === "medio" ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {arg.ordine}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{arg.messaggio}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Supporto: {arg.supporto}
                              </p>
                              <Badge variant="outline" className="mt-2">
                                Impatto: {arg.impatto}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Strategia di Approccio</CardTitle>
                      <CardDescription>
                        Piano d'azione in 3 fasi
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <StrategyPhase 
                          phase={1}
                          data={analysisResult.fase_3_commerciale.strategia_approccio.fase_1}
                        />
                        <StrategyPhase 
                          phase={2}
                          data={analysisResult.fase_3_commerciale.strategia_approccio.fase_2}
                        />
                        <StrategyPhase 
                          phase={3}
                          data={analysisResult.fase_3_commerciale.strategia_approccio.fase_3}
                        />
                      </div>

                      {analysisResult.fase_3_commerciale.strategia_approccio.punti_attenzione.length > 0 && (
                        <>
                          <Separator className="my-6" />
                          <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-3">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              Punti di Attenzione
                            </h4>
                            <ul className="space-y-2">
                              {analysisResult.fase_3_commerciale.strategia_approccio.punti_attenzione.map((punto, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <span className="text-yellow-500">•</span>
                                  {punto}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Helper Components
function StepIndicator({ step, label, active, completed }: { 
  step: number; 
  label: string; 
  active: boolean; 
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
        ${completed ? "bg-primary text-primary-foreground" : 
          active ? "bg-primary/20 text-primary border-2 border-primary" : 
          "bg-muted text-muted-foreground"}
      `}>
        {completed ? <CheckCircle2 className="h-4 w-4" /> : step}
      </div>
      <span className={`text-sm ${active ? "font-medium" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}

function ProcessingPhase({ phase, title, description, active, completed }: {
  phase: number;
  title: string;
  description: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg ${
      active ? "bg-primary/10 border border-primary/20" :
      completed ? "bg-green-50 dark:bg-green-900/20" : "bg-muted/50"
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        completed ? "bg-green-500 text-white" :
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}>
        {completed ? <CheckCircle2 className="h-4 w-4" /> :
         active ? <Loader2 className="h-4 w-4 animate-spin" /> : phase}
      </div>
      <div>
        <p className={`font-medium ${active ? "text-primary" : completed ? "text-green-700 dark:text-green-300" : ""}`}>
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function StrategyPhase({ phase, data }: { 
  phase: number; 
  data: { azione: string; contenuto: string; materiali: string[]; obiettivo: string; } 
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
          {phase}
        </div>
        <h4 className="font-semibold">{data.azione}</h4>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{data.contenuto}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {data.materiali.map((m, i) => (
          <Badge key={i} variant="secondary" className="text-xs">{m}</Badge>
        ))}
      </div>
      <p className="text-sm">
        <span className="font-medium">Obiettivo:</span> {data.obiettivo}
      </p>
    </div>
  );
}
