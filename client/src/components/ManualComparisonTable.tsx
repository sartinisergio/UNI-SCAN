import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { generateComparisonHTML, downloadComparisonHTML } from "@/lib/exportComparison";

interface ManualComparisonTableProps {
  manualIds: number[];
  subjectId: number;
  onBack: () => void;
}

// Helper function to safely render any value
function renderValue(value: any): string {
  if (value === null || value === undefined) {
    return "N/A";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(v => renderValue(v)).join(", ");
  }
  if (typeof value === "object") {
    // For objects, try to extract meaningful properties
    if (value.label) return value.label;
    if (value.description) return value.description;
    if (value.title) return value.title;
    if (value.name) return value.name;
    return JSON.stringify(value);
  }
  return String(value);
}

// Helper to format contentLevel object into readable text
function formatContentLevel(contentLevel: any): string {
  if (!contentLevel) return "N/A";
  
  if (typeof contentLevel === "string") {
    return contentLevel;
  }
  
  if (typeof contentLevel === "object") {
    const parts = [];
    if (contentLevel.breadth) parts.push(`Ampiezza: ${contentLevel.breadth}`);
    if (contentLevel.depth) parts.push(`Profondità: ${contentLevel.depth}`);
    if (contentLevel.theoryPracticeBalance) parts.push(`Teoria/Pratica: ${contentLevel.theoryPracticeBalance}`);
    return parts.length > 0 ? parts.join(" | ") : "N/A";
  }
  
  return "N/A";
}

export function ManualComparisonTable({ manualIds, subjectId, onBack }: ManualComparisonTableProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch evaluations for selected manuals
  const { data: evaluationsMap, isLoading: evaluationsLoading } = trpc.evaluations.listBySubject.useQuery(
    { subjectId },
    { enabled: !!subjectId }
  );

  // Fetch manuals to get their metadata
  const { data: manuals, isLoading: manualsLoading } = trpc.manuals.listBySubject.useQuery(
    { subjectId, publisher: "" },
    { enabled: !!subjectId }
  );

  // Update loading state when data is ready
  useEffect(() => {
    setIsLoading(evaluationsLoading || manualsLoading);
  }, [evaluationsLoading, manualsLoading]);

  // Fetch subject name for export
  const { data: subjects } = trpc.subjects.list.useQuery();
  const subjectName = subjects?.find(s => s.id === subjectId)?.name || 'Confronto';

  // Handle export
  const handleExport = () => {
    setIsExporting(true);
    try {
      const html = generateComparisonHTML({
        manuals: selectedEvaluations.map(item => ({
          id: item.manualId,
          title: item.manual?.title || '',
          publisher: item.manual?.publisher || '',
        })),
        evaluations: Object.fromEntries(
          selectedEvaluations.map(item => [
            item.manualId,
            item.evaluation ? { content: item.evaluation.content as any } : undefined
          ])
        ) as any,
        subject: subjectName,
      });
      downloadComparisonHTML(html, subjectName);
    } finally {
      setIsExporting(false);
    }
  };

  // Convert evaluations map to array for selected manuals
  const selectedEvaluations = manualIds
    .map(id => ({
      manualId: id,
      evaluation: evaluationsMap?.[id],
      manual: manuals?.find(m => m.id === id),
    }))
    .filter(item => item.manual); // Only filter by manual, not by evaluation

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Confronto Manuali</CardTitle>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Caricamento dati...</p>
        </CardContent>
      </Card>
    );
  }

  if (selectedEvaluations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Confronto Manuali</CardTitle>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nessun manuale selezionato per il confronto.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Extract common attributes for comparison
  const attributes = [
    { key: "didacticApproach", label: "Approccio Didattico" },
    { key: "contentLevel", label: "Livello Contenuti" },
    { key: "strengths", label: "Punti di Forza" },
    { key: "weaknesses", label: "Punti Deboli" },
    { key: "frameworkCoverage", label: "Copertura Framework" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Confronto Manuali ({selectedEvaluations.length} manuali)</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Esportazione...' : 'Esporta HTML'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-semibold">Attributo</th>
                {selectedEvaluations.map((item) => (
                  <th key={item.manualId} className="text-left py-2 px-3 font-semibold">
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{item.manual?.title}</p>
                      <p className="text-xs text-muted-foreground">{item.manual?.publisher}</p>
                      {!item.evaluation && (
                        <p className="text-xs text-yellow-600 mt-1">Nessuna valutazione</p>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr) => (
                <tr key={attr.key} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-3 font-medium">{attr.label}</td>
                  {selectedEvaluations.map((item) => {
                    const content = (item.evaluation?.content as any);
                    const overview = content?.overview;
                    
                    // If no evaluation, show N/A
                    if (!item.evaluation || !content) {
                      return (
                        <td key={`${item.manualId}-${attr.key}`} className="py-3 px-3">
                          <div className="text-xs text-muted-foreground">N/A</div>
                        </td>
                      );
                    }

                    return (
                      <td key={`${item.manualId}-${attr.key}`} className="py-3 px-3">
                        <div className="text-xs space-y-1">
                          {attr.key === "didacticApproach" && (
                            <div>
                              {overview?.didacticApproach ? (
                                <>
                                  <p>{renderValue(overview.didacticApproach.description)}</p>
                                  {overview.didacticApproach.economicSchool && (
                                    <Badge variant="outline" className="mt-1">
                                      {renderValue(overview.didacticApproach.economicSchool)}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <p>N/A</p>
                              )}
                            </div>
                          )}
                          {attr.key === "contentLevel" && (
                            <div>
                              <p>{formatContentLevel(overview?.contentLevel)}</p>
                            </div>
                          )}
                          {attr.key === "strengths" && (
                            <ul className="list-disc list-inside space-y-1">
                              {content.strengths && Array.isArray(content.strengths) && content.strengths.length > 0 ? (
                                content.strengths.map((s: any, i: number) => (
                                  <li key={i}>
                                    {typeof s === "object" && s.description ? (
                                      <>
                                        <span className="font-medium">{s.area || "Punto di forza"}:</span> {s.description}
                                      </>
                                    ) : (
                                      renderValue(s)
                                    )}
                                  </li>
                                ))
                              ) : (
                                <li>N/A</li>
                              )}
                            </ul>
                          )}
                          {attr.key === "weaknesses" && (
                            <ul className="list-disc list-inside space-y-1">
                              {content.weaknesses && Array.isArray(content.weaknesses) && content.weaknesses.length > 0 ? (
                                content.weaknesses.map((w: any, i: number) => (
                                  <li key={i}>
                                    {typeof w === "object" && w.description ? (
                                      <>
                                        <span className="font-medium">{w.area || "Punto debole"}:</span> {w.description}
                                      </>
                                    ) : (
                                      renderValue(w)
                                    )}
                                  </li>
                                ))
                              ) : (
                                <li>N/A</li>
                              )}
                            </ul>
                          )}
                          {attr.key === "frameworkCoverage" && (
                            <div>
                              {content.frameworkCoverage ? (
                                <>
                                  <p className="font-medium">
                                    {content.frameworkCoverage.overallCoverage ?? 0}% copertura
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {content.frameworkCoverage.modules?.length ?? 0} moduli analizzati
                                  </p>
                                </>
                              ) : (
                                <p>N/A</p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
