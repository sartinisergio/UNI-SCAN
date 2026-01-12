import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Search, 
  FileSearch, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ChevronRight,
  Calendar,
  Building2,
  User,
  Trash2
} from "lucide-react";
import { useLocation } from "wouter";

export default function Storico() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const utils = trpc.useUtils();
  const { data: analyses, isLoading } = trpc.analyses.list.useQuery();
  
  const deleteMutation = trpc.analyses.delete.useMutation({
    onSuccess: () => {
      toast.success("Analisi eliminata con successo");
      utils.analyses.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    }
  });

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Sei sicuro di voler eliminare questa analisi? L'operazione non può essere annullata.")) {
      deleteMutation.mutate({ id });
    }
  };

  const filteredAnalyses = analyses?.filter(analysis => 
    analysis.programTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    analysis.universityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    analysis.professorName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { 
          icon: CheckCircle2, 
          color: "text-green-600", 
          bg: "bg-green-100 dark:bg-green-900",
          label: "Completata" 
        };
      case "processing":
        return { 
          icon: Loader2, 
          color: "text-blue-600", 
          bg: "bg-blue-100 dark:bg-blue-900",
          label: "In elaborazione" 
        };
      case "failed":
        return { 
          icon: XCircle, 
          color: "text-red-600", 
          bg: "bg-red-100 dark:bg-red-900",
          label: "Fallita" 
        };
      default:
        return { 
          icon: Clock, 
          color: "text-yellow-600", 
          bg: "bg-yellow-100 dark:bg-yellow-900",
          label: "In attesa" 
        };
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Storico Analisi</h1>
            <p className="text-muted-foreground mt-1">
              Visualizza e gestisci tutte le analisi effettuate
            </p>
          </div>
          <Button onClick={() => setLocation("/analisi")}>
            <FileSearch className="h-4 w-4 mr-2" />
            Nuova Analisi
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per titolo, università o docente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Analyses List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-4">Caricamento analisi...</p>
            </CardContent>
          </Card>
        ) : filteredAnalyses?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? "Nessun risultato" : "Nessuna analisi"}
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                {searchQuery 
                  ? "Prova a modificare i criteri di ricerca"
                  : "Non hai ancora effettuato nessuna analisi. Inizia analizzando un programma universitario."
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setLocation("/analisi")}>
                  <FileSearch className="h-4 w-4 mr-2" />
                  Avvia Prima Analisi
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses?.map((analysis) => {
              const statusConfig = getStatusConfig(analysis.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card 
                  key={analysis.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/storico/${analysis.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`h-10 w-10 rounded-lg ${statusConfig.bg} flex items-center justify-center`}>
                          <StatusIcon className={`h-5 w-5 ${statusConfig.color} ${
                            analysis.status === "processing" ? "animate-spin" : ""
                          }`} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold">{analysis.programTitle}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            {analysis.universityName && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {analysis.universityName}
                              </span>
                            )}
                            {analysis.professorName && (
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {analysis.professorName}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(analysis.createdAt).toLocaleDateString("it-IT", {
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => handleDelete(analysis.id, e)}
                          disabled={deleteMutation.isPending}
                          title="Elimina analisi"
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                        <Badge 
                          variant="secondary"
                          className={`${statusConfig.bg} ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    
                    {analysis.status === "failed" && analysis.errorMessage && (
                      <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 text-sm text-red-600 dark:text-red-400">
                        {analysis.errorMessage}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {analyses && analyses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistiche</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{analyses.length}</div>
                  <div className="text-sm text-muted-foreground">Totale</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="text-2xl font-bold text-green-600">
                    {analyses.filter(a => a.status === "completed").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Completate</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyses.filter(a => a.status === "processing").length}
                  </div>
                  <div className="text-sm text-muted-foreground">In corso</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950">
                  <div className="text-2xl font-bold text-red-600">
                    {analyses.filter(a => a.status === "failed").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Fallite</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
