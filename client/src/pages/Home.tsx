import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

import { BookOpen, FileText, BarChart3, Database } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-center">
              UNI-SCAN
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Sistema di Analisi e Confronto di programmi e manuali universitari
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Accedi per continuare
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Benvenuto, {user?.name}</h1>
            <p className="text-muted-foreground">
              Sistema di Analisi e Confronto di programmi e manuali universitari
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            Esci
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div
            className="p-6 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
            onClick={() => setLocation("/analisi")}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Nuova Analisi</h3>
                <p className="text-sm text-muted-foreground">
                  Analizza un programma universitario
                </p>
              </div>
            </div>
          </div>

          <div
            className="p-6 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
            onClick={() => setLocation("/storico")}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Storico Analisi</h3>
                <p className="text-sm text-muted-foreground">
                  Visualizza le analisi precedenti
                </p>
              </div>
            </div>
          </div>

          <div
            className="p-6 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
            onClick={() => setLocation("/database-manuali")}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Database Manuali</h3>
                <p className="text-sm text-muted-foreground">
                  Esplora i manuali disponibili
                </p>
              </div>
            </div>
          </div>

          <div
            className="p-6 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
            onClick={() => setLocation("/gestione-dati")}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">Gestione Dati</h3>
                <p className="text-sm text-muted-foreground">
                  Configura framework e indici
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PDF Converter Tool */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Strumenti Utili</h2>
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="font-semibold mb-2">Converti PDF in Testo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Scarica lo script Python per convertire i tuoi PDF in file di testo leggibili.
            </p>
            <a
              href="/pdf-converter.py"
              download="pdf-converter.py"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Scarica Script Python
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
