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
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  
  const { data: subjects } = trpc.subjects.list.useQuery();
  
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

        {/* Dropbox Import Section */}
        <DropboxImportSection />

        {/* Subject Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seleziona Materia</CardTitle>
            <CardDescription>
              Scegli la materia per visualizzare e modificare i dati associati
            </CardDescription>
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
              <ManualsTab subjectId={selectedSubjectId} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}

function DropboxImportSection() {
  const utils = trpc.useUtils();
  
  const { data: folderStructure, isLoading: isLoadingStructure, refetch: refetchStructure } = 
    trpc.dropbox.getFolderStructure.useQuery(undefined, {
      retry: false,
    });
  
  const importFrameworksMutation = trpc.dropbox.importFrameworks.useMutation({
    onSuccess: (result) => {
      if (result.imported > 0) {
        toast.success(`Importati ${result.imported} framework`);
      }
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} errori durante l'importazione`);
        console.error("Import errors:", result.errors);
      }
      utils.frameworks.listBySubject.invalidate();
      utils.frameworks.getActive.invalidate();
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const importZanichelliMutation = trpc.dropbox.importManuals.useMutation({
    onSuccess: (result) => {
      if (result.imported > 0) {
        toast.success(`Importati ${result.imported} manuali Zanichelli`);
      }
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} errori durante l'importazione`);
        console.error("Import errors:", result.errors);
      }
      utils.manuals.listBySubject.invalidate();
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const importCompetitorMutation = trpc.dropbox.importManuals.useMutation({
    onSuccess: (result) => {
      if (result.imported > 0) {
        toast.success(`Importati ${result.imported} manuali competitor`);
      }
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} errori durante l'importazione`);
        console.error("Import errors:", result.errors);
      }
      utils.manuals.listBySubject.invalidate();
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const isImporting = importFrameworksMutation.isPending || 
                      importZanichelliMutation.isPending || 
                      importCompetitorMutation.isPending;

  const hasDropboxConfig = folderStructure?.success;

  return (
    <Card className="border-dashed border-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Cloud className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-base">Importa da Dropbox</CardTitle>
            <CardDescription>
              Importa automaticamente framework e manuali dalla cartella Dropbox
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasDropboxConfig ? (
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              {folderStructure?.error || "Configura la chiave API Dropbox nelle Impostazioni per abilitare l'importazione"}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetchStructure()}>
              Riprova
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Folder Status */}
            <div className="grid gap-2 text-sm">
              {Object.entries(folderStructure.structure || {}).map(([path, data]) => {
                const folderData = data as { files: any[]; subfolderCount?: number };
                const fileCount = folderData.files?.length || 0;
                const subfolderCount = folderData.subfolderCount || 0;
                
                return (
                  <div key={path} className="flex items-center gap-2 text-muted-foreground">
                    <FolderOpen className="h-4 w-4" />
                    <span>{path.split("/").pop()}</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      {fileCount} file
                    </span>
                    {subfolderCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({subfolderCount} sottocartelle)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Import Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => importFrameworksMutation.mutate()}
                disabled={isImporting}
              >
                {importFrameworksMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Importa Framework
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => importZanichelliMutation.mutate({ type: "zanichelli" })}
                disabled={isImporting}
              >
                {importZanichelliMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Importa Manuali Zanichelli
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => importCompetitorMutation.mutate({ type: "competitor" })}
                disabled={isImporting}
              >
                {importCompetitorMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Importa Manuali Competitor
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FrameworksTab({ subjectId }: { subjectId: number }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [version, setVersion] = useState("");
  const [content, setContent] = useState("");
  
  const utils = trpc.useUtils();
  const { data: frameworks, isLoading } = trpc.frameworks.listBySubject.useQuery({ subjectId });
  const { data: activeFramework } = trpc.frameworks.getActive.useQuery({ subjectId });
  
  const createMutation = trpc.frameworks.create.useMutation({
    onSuccess: () => {
      toast.success("Framework creato con successo");
      utils.frameworks.listBySubject.invalidate({ subjectId });
      utils.frameworks.getActive.invalidate({ subjectId });
      setIsDialogOpen(false);
      setVersion("");
      setContent("");
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
      createMutation.mutate({
        subjectId,
        version: version.trim(),
        content: parsedContent,
      });
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
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Framework
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crea Nuovo Framework</DialogTitle>
                <DialogDescription>
                  Definisci un nuovo framework di valutazione per questa materia
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
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Salva Framework
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
                        Creato il {new Date(fw.createdAt).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeFramework?.id === fw.id && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Attivo
                      </span>
                    )}
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
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
    </Card>
  );
}

function ManualsTab({ subjectId }: { subjectId: number }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    publisher: "",
    type: "zanichelli" as "zanichelli" | "competitor",
    edition: "",
    year: "",
    indexContent: "",
  });
  
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

  const deleteMutation = trpc.manuals.delete.useMutation({
    onSuccess: () => {
      toast.success("Manuale eliminato");
      utils.manuals.listBySubject.invalidate({ subjectId });
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

  const handleDelete = (id: number, title: string) => {
    if (confirm(`Sei sicuro di voler eliminare "${title}"?`)) {
      deleteMutation.mutate({ id });
    }
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
                      onDelete={() => handleDelete(manual.id, manual.title)}
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
                      onDelete={() => handleDelete(manual.id, manual.title)}
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

function ManualCard({ manual, onDelete }: { manual: any; onDelete: () => void }) {
  return (
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
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
