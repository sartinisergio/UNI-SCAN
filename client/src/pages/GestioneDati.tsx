import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { usePublisher } from "@/contexts/PublisherContext";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  FileJson,
  Save,
  AlertCircle,
  Download,
  Cloud,
  CheckCircle2,
  Loader2,
  FolderOpen
} from "lucide-react";

export default function GestioneDati() {
  const { user } = useAuth();
  const { selectedPublisher } = usePublisher();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [isCleaningFrameworks, setIsCleaningFrameworks] = useState(false);
  const [isCreateSubjectDialogOpen, setIsCreateSubjectDialogOpen] = useState(false);
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDescription, setNewSubjectDescription] = useState("");
  
  const { data: subjects } = trpc.subjects.list.useQuery();
  const utils = trpc.useUtils();
  
  const createSubjectMutation = trpc.subjects.create.useMutation({
    onSuccess: () => {
      toast.success("Materia creata con successo");
      utils.subjects.list.invalidate();
      setIsCreateSubjectDialogOpen(false);
      setNewSubjectCode("");
      setNewSubjectName("");
      setNewSubjectDescription("");
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });
  
  const deleteSubjectMutation = trpc.subjects.delete.useMutation({
    onSuccess: () => {
      toast.success("Materia eliminata con successo");
      utils.subjects.list.invalidate();
      setSelectedSubjectId(null);
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });
  
  const handleDeleteSubject = (subjectId: number, subjectName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare la materia "${subjectName}"? Questa azione non può essere annullata.`)) {
      return;
    }
    deleteSubjectMutation.mutate({ id: subjectId });
  };
  
  const handleCreateSubject = () => {
    if (!newSubjectCode.trim()) {
      toast.error("Inserisci il codice della materia");
      return;
    }
    if (!newSubjectName.trim()) {
      toast.error("Inserisci il nome della materia");
      return;
    }
    createSubjectMutation.mutate({
      code: newSubjectCode.trim(),
      name: newSubjectName.trim(),
      description: newSubjectDescription.trim() || undefined,
    });
  };
  
  const cleanFrameworksMutation = trpc.frameworks.deactivateAll.useMutation({
    onSuccess: () => {
      toast.success("Tutti i framework sono stati disattivati");
      utils.frameworks.listBySubject.invalidate();
      setIsCleaningFrameworks(false);
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
      setIsCleaningFrameworks(false);
    }
  });
  
  const handleCleanFrameworks = async () => {
    if (!confirm("Sei sicuro? Tutti i framework verranno disattivati.")) return;
    setIsCleaningFrameworks(true);
    cleanFrameworksMutation.mutate();
  };
  
  // Redirect non-admin users
  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Accesso Limitato</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Solo gli amministratori possono accedere alla gestione dei dati.
            Contatta l'amministratore per richiedere l'accesso.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestione Dati</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci framework di valutazione e indici dei manuali per ogni materia
          </p>
        </div>

        {/* Clean Old Frameworks */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Pulisci Framework Vecchi
            </CardTitle>
            <CardDescription>
              Disattiva tutti i framework importati da Dropbox per fare spazio ai nuovi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleCleanFrameworks}
              disabled={isCleaningFrameworks || cleanFrameworksMutation.isPending}
            >
              {isCleaningFrameworks || cleanFrameworksMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Pulizia in corso...
                </>
              ) : (
                <>Disattiva Tutti i Framework</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Create New Subject */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Crea Nuova Materia
            </CardTitle>
            <CardDescription>
              Aggiungi una nuova materia al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isCreateSubjectDialogOpen} onOpenChange={setIsCreateSubjectDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-300 hover:bg-blue-100">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Materia
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crea Nuova Materia</DialogTitle>
                  <DialogDescription>
                    Inserisci i dettagli della nuova materia
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject-code">Codice Materia</Label>
                    <Input
                      id="subject-code"
                      placeholder="es: biochimica"
                      value={newSubjectCode}
                      onChange={(e) => setNewSubjectCode(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject-name">Nome Materia</Label>
                    <Input
                      id="subject-name"
                      placeholder="es: Biochimica"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject-description">Descrizione (Opzionale)</Label>
                    <Textarea
                      id="subject-description"
                      placeholder="Descrizione della materia..."
                      value={newSubjectDescription}
                      onChange={(e) => setNewSubjectDescription(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateSubjectDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button 
                    onClick={handleCreateSubject}
                    disabled={createSubjectMutation.isPending}
                  >
                    {createSubjectMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creazione in corso...
                      </>
                    ) : (
                      <>Crea Materia</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Subject Selector */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Seleziona Materia</CardTitle>
                <CardDescription>
                  Scegli la materia per visualizzare e modificare i dati associati
                </CardDescription>
              </div>
              {selectedSubjectId && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const subject = subjects?.find(s => s.id === selectedSubjectId);
                    if (subject) handleDeleteSubject(selectedSubjectId, subject.name);
                  }}
                  disabled={deleteSubjectMutation.isPending}
                >
                  {deleteSubjectMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Eliminazione...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Elimina Materia
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedSubjectId?.toString() || ""} 
              onValueChange={(v) => setSelectedSubjectId(parseInt(v))}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Seleziona una materia..." />
              </SelectTrigger>
              <SelectContent>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedSubjectId && (
          <Tabs defaultValue="frameworks" className="space-y-4">
            <TabsList>
              <TabsTrigger value="frameworks">
                <FileJson className="h-4 w-4 mr-2" />
                Framework
              </TabsTrigger>
              <TabsTrigger value="manuals">
                <BookOpen className="h-4 w-4 mr-2" />
                Manuali
              </TabsTrigger>
            </TabsList>

            <TabsContent value="frameworks">
              <FrameworksTab subjectId={selectedSubjectId} />
            </TabsContent>

            <TabsContent value="manuals">
              <ManualsTab subjectId={selectedSubjectId} selectedPublisher={selectedPublisher} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}

// DropboxImportSection rimosso - Dropbox integration completamente eliminata

function FrameworksTab({ subjectId }: { subjectId: number }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<any>(null);
  const [version, setVersion] = useState("");
  const [content, setContent] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setContent(JSON.stringify(json, null, 2));
      toast.success("File JSON caricato con successo");
      setFileInputKey(prev => prev + 1);
    } catch (error) {
      toast.error("Errore: il file non è un JSON valido");
      setFileInputKey(prev => prev + 1);
    }
  };
  
  const utils = trpc.useUtils();
  const { data: frameworks, isLoading } = trpc.frameworks.listBySubject.useQuery({ subjectId });
  const { data: activeFramework } = trpc.frameworks.getActive.useQuery({ subjectId });
  
  const createMutation = trpc.frameworks.create.useMutation({
    onSuccess: () => {
      toast.success("Framework creato con successo");
      utils.frameworks.listBySubject.invalidate({ subjectId });
      utils.frameworks.getActive.invalidate({ subjectId });
      setIsDialogOpen(false);
      setSelectedFramework(null);
      setVersion("");
      setContent("");
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const updateMutation = trpc.frameworks.update.useMutation({
    onSuccess: () => {
      toast.success("Framework aggiornato con successo");
      utils.frameworks.listBySubject.invalidate({ subjectId });
      utils.frameworks.getActive.invalidate({ subjectId });
      setIsDialogOpen(false);
      setSelectedFramework(null);
      setVersion("");
      setContent("");
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const deleteMutation = trpc.frameworks.delete.useMutation({
    onSuccess: () => {
      toast.success("Framework eliminato");
      utils.frameworks.listBySubject.invalidate({ subjectId });
      utils.frameworks.getActive.invalidate({ subjectId });
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!version.trim()) {
      toast.error("Inserisci una versione");
      return;
    }
    try {
      const parsedContent = JSON.parse(content);
      if (selectedFramework) {
        // Update existing framework
        updateMutation.mutate({
          id: selectedFramework.id,
          version: version.trim(),
          content: parsedContent,
        });
      } else {
        // Create new framework
        createMutation.mutate({
          subjectId,
          version: version.trim(),
          content: parsedContent,
        });
      }
    } catch {
      toast.error("Il contenuto deve essere un JSON valido");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Framework di Valutazione</CardTitle>
            <CardDescription>
              Definisci i criteri e i moduli per la valutazione dei manuali
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedFramework(null);
                setVersion("");
                setContent("");
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Framework
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedFramework ? "Modifica Framework" : "Crea Nuovo Framework"}</DialogTitle>
                <DialogDescription>
                  {selectedFramework 
                    ? "Modifica il framework di valutazione esistente"
                    : "Definisci un nuovo framework di valutazione per questa materia"
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Versione</Label>
                  <Input
                    id="version"
                    placeholder="es. 1.0.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Contenuto (JSON)</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      key={fileInputKey}
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground self-center">oppure incolla qui sotto</span>
                  </div>
                  <Textarea
                    id="content"
                    placeholder={`{
  "version": "1.0.0",
  "subject": "chimica_organica",
  "modules": [
    {
      "id": 1,
      "name": "Struttura e legami",
      "subtopics": ["Orbitali", "Ibridazione", "Legami covalenti"]
    }
  ]
}`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annulla
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {selectedFramework ? "Aggiorna" : "Salva"} Framework
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Caricamento...
          </div>
        ) : frameworks && frameworks.length > 0 ? (
          <div className="space-y-3">
            {frameworks.map((fw) => (
              <div
                key={fw.id}
                className={`p-4 rounded-lg border ${
                  activeFramework?.id === fw.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileJson className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Versione {fw.version}</p>
                      <p className="text-sm text-muted-foreground">
                        {fw.updatedAt && new Date(fw.updatedAt).getTime() !== new Date(fw.createdAt).getTime() 
                          ? `Aggiornato il ${new Date(fw.updatedAt).toLocaleDateString("it-IT")}`
                          : `Creato il ${new Date(fw.createdAt).toLocaleDateString("it-IT")}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeFramework?.id === fw.id && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Attivo
                      </span>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedFramework(fw);
                        setIsViewDialogOpen(true);
                      }}
                      title="Visualizza framework"
                    >
                      <FileJson className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedFramework(fw);
                        setVersion(fw.version);
                        setContent(JSON.stringify(fw.content, null, 2));
                        setIsDialogOpen(true);
                      }}
                      title="Modifica framework"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        if (confirm(`Sei sicuro di voler eliminare la versione ${fw.version}?`)) {
                          deleteMutation.mutate({ id: fw.id });
                        }
                      }}
                      title="Elimina framework"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileJson className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nessun framework disponibile</p>
            <p className="text-sm">Crea un nuovo framework o importa da Dropbox</p>
          </div>
        )}
      </CardContent>
      
      {/* Dialog per visualizzare il framework */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Framework - Versione {selectedFramework?.version}</DialogTitle>
            <DialogDescription>
              Creato il {selectedFramework && new Date(selectedFramework.createdAt).toLocaleDateString("it-IT")}
              {selectedFramework?.updatedAt && selectedFramework.updatedAt !== selectedFramework.createdAt && (
                <span> • Aggiornato il {new Date(selectedFramework.updatedAt).toLocaleDateString("it-IT")}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[calc(90vh-150px)] overflow-y-auto">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap break-words">
              {selectedFramework && JSON.stringify(selectedFramework.content, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ManualsTab({ subjectId, selectedPublisher }: { subjectId: number; selectedPublisher: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    publisher: "",
    type: "zanichelli" as "zanichelli" | "competitor",
    edition: "",
    year: "",
    indexContent: "",
  });
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setFormData({ ...formData, indexContent: JSON.stringify(json, null, 2) });
      toast.success("File JSON caricato con successo");
      setFileInputKey(prev => prev + 1);
    } catch (error) {
      toast.error("Errore: il file non è un JSON valido");
      setFileInputKey(prev => prev + 1);
    }
  };
  
  const utils = trpc.useUtils();
  const { data: manuals, isLoading } = trpc.manuals.listBySubject.useQuery({ subjectId });
  
  const createMutation = trpc.manuals.create.useMutation({
    onSuccess: () => {
      toast.success("Manuale creato con successo");
      utils.manuals.listBySubject.invalidate({ subjectId });
      setIsDialogOpen(false);
      setFormData({
        title: "",
        author: "",
        publisher: "",
        type: "zanichelli",
        edition: "",
        year: "",
        indexContent: "",
      });
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!formData.title.trim() || !formData.author.trim() || !formData.publisher.trim()) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }
    
    let indexContent = undefined;
    if (formData.indexContent.trim()) {
      try {
        indexContent = JSON.parse(formData.indexContent);
      } catch {
        toast.error("L'indice deve essere un JSON valido");
        return;
      }
    }

    createMutation.mutate({
      subjectId,
      title: formData.title.trim(),
      author: formData.author.trim(),
      publisher: formData.publisher.trim(),
      type: formData.type,
      edition: formData.edition.trim() || undefined,
      year: formData.year ? parseInt(formData.year) : undefined,
      indexContent,
    });
  };

  const zanichelliManuals = manuals?.filter((m) => m.type === "zanichelli") || [];
  const competitorManuals = manuals?.filter((m) => m.type === "competitor") || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Manuali</CardTitle>
            <CardDescription>
              Gestisci gli indici dei manuali Zanichelli e competitor
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Manuale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Aggiungi Nuovo Manuale</DialogTitle>
                <DialogDescription>
                  Inserisci i dettagli del manuale e il suo indice
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titolo *</Label>
                    <Input
                      id="title"
                      placeholder="Chimica Organica"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Autore *</Label>
                    <Input
                      id="author"
                      placeholder="Mario Rossi"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publisher">Editore *</Label>
                    <Input
                      id="publisher"
                      placeholder="Zanichelli"
                      value={formData.publisher}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v as "zanichelli" | "competitor" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zanichelli">Zanichelli</SelectItem>
                        <SelectItem value="competitor">Competitor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edition">Edizione</Label>
                    <Input
                      id="edition"
                      placeholder="3a edizione"
                      value={formData.edition}
                      onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Anno</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="2024"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="indexContent">Indice (JSON)</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      key={fileInputKey}
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground self-center">oppure incolla qui sotto</span>
                  </div>
                  <Textarea
                    id="indexContent"
                    placeholder={`{
  "chapters": [
    {
      "number": 1,
      "title": "Introduzione",
      "topics": ["Storia", "Concetti base"]
    }
  ]
}`}
                    value={formData.indexContent}
                    onChange={(e) => setFormData({ ...formData, indexContent: e.target.value })}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annulla
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Salva Manuale
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Caricamento...
          </div>
        ) : manuals && manuals.length > 0 ? (
          <div className="space-y-6">
            {/* Zanichelli Manuals */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Manuali Zanichelli ({zanichelliManuals.length})
              </h3>
              {zanichelliManuals.length > 0 ? (
                <div className="space-y-2">
                  {zanichelliManuals.map((manual) => (
                    <ManualCard 
                      key={manual.id} 
                      manual={manual} 
                      subjectId={subjectId}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nessun manuale Zanichelli</p>
              )}
            </div>

            {/* Competitor Manuals */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-500" />
                Manuali Competitor ({competitorManuals.length})
              </h3>
              {competitorManuals.length > 0 ? (
                <div className="space-y-2">
                  {competitorManuals.map((manual) => (
                    <ManualCard 
                      key={manual.id} 
                      manual={manual} 
                      subjectId={subjectId}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nessun manuale competitor</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nessun manuale disponibile</p>
            <p className="text-sm">Aggiungi un nuovo manuale o importa da Dropbox</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ManualCard({ manual, subjectId }: { manual: any; subjectId: number }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewIndexOpen, setIsViewIndexOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: manual.title,
    author: manual.author,
    publisher: manual.publisher,
    edition: manual.edition || "",
    year: manual.year?.toString() || "",
  });
  
  const utils = trpc.useUtils();
  
  const updateMutation = trpc.manuals.update.useMutation({
    onSuccess: () => {
      toast.success("Manuale aggiornato con successo");
      utils.manuals.listBySubject.invalidate({ subjectId });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const deleteMutation = trpc.manuals.delete.useMutation({
    onSuccess: () => {
      toast.success("Manuale eliminato");
      utils.manuals.listBySubject.invalidate({ subjectId });
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });
  
  const handleUpdate = () => {
    updateMutation.mutate({
      id: manual.id,
      title: editFormData.title.trim(),
      author: editFormData.author.trim(),
      publisher: editFormData.publisher.trim(),
      edition: editFormData.edition.trim() || undefined,
      year: editFormData.year ? parseInt(editFormData.year) : undefined,
    });
  };

  const handleDelete = () => {
    if (confirm(`Sei sicuro di voler eliminare "${manual.title}"?`)) {
      deleteMutation.mutate({ id: manual.id });
    }
  };
  
  return (
    <>
      <div className="p-3 rounded-lg border border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{manual.title}</p>
            <p className="text-sm text-muted-foreground">
              {manual.author} • {manual.publisher}
              {manual.year && ` • ${manual.year}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {manual.indexContent && (
            <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">
              Indice presente
            </span>
          )}
          {manual.indexContent && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsViewIndexOpen(true)}
              title="Visualizza indice"
            >
              <FileJson className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
            title="Modifica manuale"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifica Manuale</DialogTitle>
            <DialogDescription>
              Aggiorna i dettagli del manuale
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Titolo</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-author">Autore</Label>
                <Input
                  id="edit-author"
                  value={editFormData.author}
                  onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-publisher">Editore</Label>
                <Input
                  id="edit-publisher"
                  value={editFormData.publisher}
                  onChange={(e) => setEditFormData({ ...editFormData, publisher: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-edition">Edizione</Label>
                <Input
                  id="edit-edition"
                  value={editFormData.edition}
                  onChange={(e) => setEditFormData({ ...editFormData, edition: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-year">Anno</Label>
                <Input
                  id="edit-year"
                  type="number"
                  value={editFormData.year}
                  onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Index Dialog */}
      <Dialog open={isViewIndexOpen} onOpenChange={setIsViewIndexOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Indice - {manual.title}</DialogTitle>
            <DialogDescription>
              Visualizza l'indice del manuale
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[calc(90vh-150px)] overflow-y-auto">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap break-words">
              {manual.indexContent && JSON.stringify(manual.indexContent, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
