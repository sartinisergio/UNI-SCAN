import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { 
  BookOpen, 
  FileSearch, 
  Database, 
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: subjects } = trpc.subjects.list.useQuery();
  const { data: analyses } = trpc.analyses.list.useQuery();

  const recentAnalyses = analyses?.slice(0, 5) || [];
  const completedCount = analyses?.filter(a => a.status === "completed").length || 0;
  const pendingCount = analyses?.filter(a => a.status === "pending" || a.status === "processing").length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Benvenuto, {user?.name?.split(" ")[0] || "Utente"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Sistema di Analisi e Confronto di programmi e manuali universitari
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materie Disponibili</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Framework e indici configurati
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analisi Completate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
              <p className="text-xs text-muted-foreground">
                Programmi analizzati con successo
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Elaborazione</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                Analisi in corso o in attesa
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/analisi")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileSearch className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Nuova Analisi</CardTitle>
                  <CardDescription>Analizza un programma universitario</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Carica un programma di corso e ottieni un'analisi completa con identificazione dei gap e raccomandazioni.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Inizia Analisi <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/database-manuali")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Database Manuali</CardTitle>
                  <CardDescription>Consulta le schede di valutazione</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Esplora il database delle valutazioni pre-generate per tutti i manuali Zanichelli e competitor.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Esplora Database <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {user?.role === "admin" && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation("/gestione-dati")}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Gestione Dati</CardTitle>
                    <CardDescription>Configura framework e indici</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Gestisci i framework di valutazione e gli indici dei manuali per ogni materia.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Gestisci <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Analyses */}
        {recentAnalyses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Analisi Recenti</CardTitle>
              <CardDescription>Le ultime analisi effettuate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAnalyses.map((analysis) => (
                  <div 
                    key={analysis.id} 
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/storico/${analysis.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        analysis.status === "completed" ? "bg-green-500" :
                        analysis.status === "failed" ? "bg-red-500" :
                        "bg-yellow-500"
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{analysis.programTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {analysis.universityName || "Università non specificata"}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(analysis.createdAt).toLocaleDateString("it-IT")}
                    </div>
                  </div>
                ))}
              </div>
              {analyses && analyses.length > 5 && (
                <Button 
                  variant="ghost" 
                  className="w-full mt-4"
                  onClick={() => setLocation("/storico")}
                >
                  Vedi tutte le analisi
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Materie disponibili */}
        <Card>
          <CardHeader>
            <CardTitle>Materie Supportate</CardTitle>
            <CardDescription>Le materie attualmente configurate nel sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {subjects?.map((subject) => (
                <div 
                  key={subject.id}
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                >
                  {subject.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
