import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { BookOpen, Filter, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EvaluazioniManuali() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedManualId, setSelectedManualId] = useState<string>("");

  // Get all subjects
  const { data: subjects, isLoading: subjectsLoading } = trpc.subjects.list.useQuery();

  // Get manuals for selected subject
  const { data: manuals, isLoading: manualsLoading } = trpc.manuals.listBySubject.useQuery(
    { subjectId: parseInt(selectedSubjectId) },
    { enabled: !!selectedSubjectId }
  );

  // Get evaluation for selected manual
  const { data: evaluation, isLoading: evaluationLoading } = trpc.evaluations.getByManual.useQuery(
    { manualId: parseInt(selectedManualId) },
    { enabled: !!selectedManualId }
  );

  const getVerdictColor = (verdict: string) => {
    switch (verdict?.toLowerCase()) {
      case "eccellente":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "buono":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "sufficiente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "sconsigliato":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Valutazioni Manuali</h1>
        <p className="text-muted-foreground mt-2">
          Visualizza le valutazioni complete dei manuali rispetto ai framework di riferimento
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Seleziona Manuale
          </CardTitle>
          <CardDescription>
            Scegli una materia e un manuale per visualizzare la valutazione
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Materia</label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger disabled={subjectsLoading}>
                  <SelectValue placeholder="Seleziona una materia..." />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Manual Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Manuale</label>
              <Select 
                value={selectedManualId} 
                onValueChange={setSelectedManualId}
                disabled={!selectedSubjectId || manualsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un manuale..." />
                </SelectTrigger>
                <SelectContent>
                  {manuals?.map((manual: any) => (
                    <SelectItem key={manual.id} value={manual.id.toString()}>
                      {manual.title} - {manual.author}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Display */}
      {selectedManualId && (
        <div>
          {evaluationLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Caricamento valutazione...</span>
              </CardContent>
            </Card>
          ) : evaluation ? (
            <div>
              {/* Check if evaluation.content is HTML */}
              {typeof evaluation.content === "string" && evaluation.content.includes("<!DOCTYPE html>") ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Valutazione Completa
                        </CardTitle>
                        <CardDescription>
                          Report dettagliato della valutazione del manuale
                        </CardDescription>
                      </div>
                      <Badge className={getVerdictColor(evaluation.verdict || "")}>
                        {evaluation.verdict}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full overflow-auto">
                      <iframe
                        srcDoc={evaluation.content}
                        style={{
                          width: "100%",
                          height: "1200px",
                          border: "none",
                          borderRadius: "8px",
                        }}
                        title="Valutazione Manuale"
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <p>Valutazione non disponibile in formato HTML</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>Nessuna valutazione disponibile per questo manuale</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
