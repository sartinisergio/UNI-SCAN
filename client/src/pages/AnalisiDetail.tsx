import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { 
  ArrowLeft, 
  Copy, 
  Mail, 
  FileText, 
  User, 
  Target, 
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  Calendar,
  BookOpen,
  TrendingUp,
  Sparkles,
  Download,
  GraduationCap,
  BarChart3,
  Zap,
  BookMarked,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

// Helper to safely parse JSON
function safeParseJSON(data: any): any {
  if (!data) return null;
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Helper to get severity badge color
function getSeverityColor(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'alta':
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'media':
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'bassa':
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

// Helper to get gap type label
function getGapTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'profondita_insufficiente': 'Profondità Insufficiente',
    'contenuto_mancante': 'Contenuto Mancante',
    'approccio_diverso': 'Approccio Diverso',
    'risorse_carenti': 'Risorse Carenti',
    'coverage_gap': 'Gap di Copertura',
    'depth_gap': 'Gap di Profondità',
    'currency_gap': 'Gap di Attualità',
    'pedagogy_gap': 'Gap Pedagogico',
  };
  return labels[type] || type;
}

export default function AnalisiDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  
  const { data: analysis, isLoading, error, refetch } = trpc.analyses.getById.useQuery(
    { id: parseInt(params.id || "0") },
    { enabled: !!params.id }
  );
  
  const { data: manualEvaluation } = trpc.analyses.getManualEvaluation.useQuery(
    { analysisId: parseInt(params.id || "0") },
    { enabled: !!params.id }
  ) as any;

  const generateEmailMutation = trpc.analyses.generateEmail.useMutation({
    onSuccess: (data) => {
      const emailBody = typeof data.email === 'string' 
        ? data.email 
        : data.email?.corpo || '';
      setGeneratedEmail(emailBody);
      refetch(); // Refresh to get saved email
      toast.success("Email generata con successo!");
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const handleGenerateEmail = () => {
    if (!analysis) return;
    setIsGeneratingEmail(true);
    generateEmailMutation.mutate(
      { analysisId: analysis.id },
      {
        onSettled: () => setIsGeneratingEmail(false),
      }
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiato negli appunti`);
  };

  // Export to HTML
  const exportToHTML = () => {
    if (!analysis) return;
    
    const postItData = safeParseJSON(analysis.postIt);
    const contextualData = safeParseJSON(analysis.contextualAnalysis);
    const technicalData = safeParseJSON(analysis.technicalAnalysis);
    const gapsData = safeParseJSON(analysis.gaps);
    const emailData = safeParseJSON(analysis.generatedEmail);
    
    const manuale = postItData?.opportunita_zanichelli?.manuale_consigliato;
    
    const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analisi - ${analysis.programTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    h1 { color: #1e40af; margin-bottom: 10px; font-size: 28px; }
    h2 { color: #1e40af; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #dbeafe; font-size: 20px; }
    h3 { color: #374151; margin: 20px 0 10px; font-size: 16px; }
    .header { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1e40af; }
    .meta { color: #6b7280; font-size: 14px; margin-top: 8px; }
    .meta span { margin-right: 20px; }
    .card { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 15px 0; border-left: 4px solid #3b82f6; }
    .card.warning { border-left-color: #f59e0b; background: #fffbeb; }
    .card.success { border-left-color: #10b981; background: #ecfdf5; }
    .card.danger { border-left-color: #ef4444; background: #fef2f2; }
    .card.highlight { border-left-color: #8b5cf6; background: #f5f3ff; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-right: 8px; }
    .badge.alta { background: #fee2e2; color: #991b1b; }
    .badge.media { background: #fef3c7; color: #92400e; }
    .badge.bassa { background: #d1fae5; color: #065f46; }
    .postit { background: #fef9c3; padding: 25px; border-radius: 8px; font-size: 15px; line-height: 1.8; box-shadow: 2px 2px 8px rgba(0,0,0,0.1); }
    .manual-box { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 25px; border-radius: 12px; margin: 20px 0; }
    .manual-box h3 { color: white; margin: 0 0 5px; font-size: 22px; }
    .manual-box .author { opacity: 0.9; font-size: 16px; }
    .manual-box .score { font-size: 14px; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3); }
    ul { margin: 10px 0 10px 20px; }
    li { margin: 8px 0; }
    .gap-item { margin: 15px 0; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; }
    .gap-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .strategy-phase { margin: 20px 0; padding: 20px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; }
    .phase-number { display: inline-block; width: 30px; height: 30px; background: #1e40af; color: white; border-radius: 50%; text-align: center; line-height: 30px; font-weight: bold; margin-right: 10px; }
    .email-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; white-space: pre-wrap; font-family: inherit; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${analysis.programTitle}</h1>
    <div class="meta">
      ${analysis.universityName ? `<span>🏛️ ${analysis.universityName}</span>` : ''}
      ${analysis.professorName ? `<span>👤 ${analysis.professorName}</span>` : ''}
      <span>📅 ${new Date(analysis.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
    </div>
  </div>

  ${manuale ? `
  <div class="manual-box">
    <h3>📚 ${manuale.titolo}</h3>
    <div class="author">${manuale.autore}</div>
    ${postItData?.opportunita_zanichelli?.allineamento_profilo_pedagogico ? `
    <div class="score">Allineamento al profilo pedagogico: <strong>${postItData.opportunita_zanichelli.allineamento_profilo_pedagogico}%</strong></div>
    ` : ''}
  </div>
  ` : ''}

  <h2>📝 Post-it Commerciale</h2>
  <div class="postit">
    ${postItData?.post_it || 'Non disponibile'}
  </div>

  ${postItData?.analisi_bibliografia ? `
  <h2>📚 Analisi Bibliografia Adottata</h2>
  <div class="card" style="border-left-color: ${postItData.analisi_bibliografia.posizione_zanichelli === 'principale' ? '#10b981' : postItData.analisi_bibliografia.posizione_zanichelli === 'alternativa' ? '#3b82f6' : '#f59e0b'};">
    <p style="margin-bottom: 15px;"><strong>Posizione Zanichelli:</strong> <span class="badge" style="background: ${postItData.analisi_bibliografia.posizione_zanichelli === 'principale' ? '#d1fae5; color: #065f46' : postItData.analisi_bibliografia.posizione_zanichelli === 'alternativa' ? '#dbeafe; color: #1e40af' : '#fef3c7; color: #92400e'};">${postItData.analisi_bibliografia.posizione_zanichelli || 'N/A'}</span></p>
    
    ${postItData.analisi_bibliografia.manuale_principale ? `
    <div style="background: ${postItData.analisi_bibliografia.manuale_principale.tipo?.includes('zanichelli') ? '#eff6ff' : '#fff7ed'}; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 3px solid ${postItData.analisi_bibliografia.manuale_principale.tipo?.includes('zanichelli') ? '#3b82f6' : '#f97316'};">
      <h3 style="margin: 0 0 8px;">Manuale Principale <span class="badge" style="background: ${postItData.analisi_bibliografia.manuale_principale.tipo?.includes('zanichelli') ? '#dbeafe; color: #1e40af' : '#fee2e2; color: #991b1b'};">${postItData.analisi_bibliografia.manuale_principale.tipo?.includes('zanichelli') ? 'Zanichelli' : 'Competitor'}</span></h3>
      <p><strong>${postItData.analisi_bibliografia.manuale_principale.titolo}</strong></p>
      <p style="color: #6b7280;">${postItData.analisi_bibliografia.manuale_principale.autore} - ${postItData.analisi_bibliografia.manuale_principale.editore}</p>
      ${postItData.analisi_bibliografia.manuale_principale.allineamento_programma ? `<p style="margin-top: 8px;">Allineamento: <strong>${postItData.analisi_bibliografia.manuale_principale.allineamento_programma}%</strong></p>` : ''}
      ${postItData.analisi_bibliografia.manuale_principale.valutazione ? `<p style="margin-top: 10px; font-style: italic; background: #f1f5f9; padding: 10px; border-radius: 4px;">${postItData.analisi_bibliografia.manuale_principale.valutazione}</p>` : ''}
    </div>
    ` : ''}
    
    ${postItData.analisi_bibliografia.manuali_alternativi?.length > 0 ? `
    <h3 style="margin: 20px 0 10px;">Manuali Alternativi</h3>
    ${postItData.analisi_bibliografia.manuali_alternativi.map((m: any) => `
    <div style="background: ${m.tipo?.includes('zanichelli') ? '#eff6ff' : '#f9fafb'}; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 2px solid ${m.tipo?.includes('zanichelli') ? '#3b82f6' : '#d1d5db'};">
      <p><strong>${m.titolo}</strong> <span class="badge" style="background: ${m.tipo?.includes('zanichelli') ? '#dbeafe; color: #1e40af' : '#f3f4f6; color: #6b7280'};">${m.tipo?.includes('zanichelli') ? 'Zanichelli' : 'Competitor'}</span></p>
      <p style="color: #6b7280; font-size: 14px;">${m.autore} - ${m.editore}</p>
      ${m.confronto ? `<p style="font-style: italic; font-size: 14px; margin-top: 5px;">${m.confronto}</p>` : ''}
    </div>
    `).join('')}
    ` : ''}
    
    ${postItData.analisi_bibliografia.sintesi_competitiva ? `
    <div style="margin-top: 15px; padding: 15px; background: #f1f5f9; border-radius: 8px;">
      <h3 style="margin: 0 0 8px; font-size: 14px;">Sintesi Competitiva</h3>
      <p>${postItData.analisi_bibliografia.sintesi_competitiva}</p>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <h2>👤 Profilo Pedagogico del Docente</h2>
  ${contextualData ? `
  <div class="card">
    <h3>Insight Principale</h3>
    <p>${postItData?.insight_principale || contextualData?.sintesi_profilo || 'Non disponibile'}</p>
  </div>
  ${contextualData?.filosofia_didattica ? `
  <div class="card">
    <h3>Filosofia Didattica</h3>
    <p><strong>Approccio Principale:</strong> ${contextualData.filosofia_didattica.approccio_principale || 'N/A'}</p>
    <p><strong>Bilanciamento Teoria/Pratica:</strong> ${contextualData.filosofia_didattica.bilanciamento_teoria_pratica || 'N/A'}</p>
    <p><strong>Livello Rigore:</strong> ${contextualData.filosofia_didattica.livello_rigore || 'N/A'}</p>
    <p><strong>Accessibilità:</strong> ${contextualData.filosofia_didattica.livello_accessibilita || 'N/A'}</p>
    <p><strong>Enfasi Applicazioni:</strong> ${contextualData.filosofia_didattica.enfasi_applicazioni || 'N/A'}</p>
    <p><strong>Interdisciplinarità:</strong> ${contextualData.filosofia_didattica.interdisciplinarita || 'N/A'}</p>
    ${contextualData.filosofia_didattica.scuola_pensiero ? `<p><strong>Scuola di Pensiero:</strong> ${contextualData.filosofia_didattica.scuola_pensiero}</p>` : ''}
    ${contextualData.filosofia_didattica.sequenza_micro && contextualData.filosofia_didattica.sequenza_micro !== 'non applicabile' ? `<p><strong>Sequenza Micro:</strong> ${contextualData.filosofia_didattica.sequenza_micro}</p>` : ''}
    ${contextualData.filosofia_didattica.sequenza_macro && contextualData.filosofia_didattica.sequenza_macro !== 'non applicabile' ? `<p><strong>Sequenza Macro:</strong> ${contextualData.filosofia_didattica.sequenza_macro}</p>` : ''}
    ${contextualData.filosofia_didattica.approccio_crescita && contextualData.filosofia_didattica.approccio_crescita !== 'Non trattato' ? `<p><strong>Approccio Crescita:</strong> ${contextualData.filosofia_didattica.approccio_crescita}</p>` : ''}
  </div>
  ` : ''}
  ${contextualData?.valutazione_dimensioni ? `
  <div class="card">
    <h3>Dimensioni di Valutazione</h3>
    <ul>
      <li><strong>Rigore Metodologico:</strong> ${contextualData.valutazione_dimensioni.rigore_metodologico || 'N/A'}</li>
      <li><strong>Accessibilità:</strong> ${contextualData.valutazione_dimensioni.accessibilita || 'N/A'}</li>
      <li><strong>Aggiornamento:</strong> ${contextualData.valutazione_dimensioni.aggiornamento || 'N/A'}</li>
      <li><strong>Applicabilità:</strong> ${contextualData.valutazione_dimensioni.applicabilita || 'N/A'}</li>
    </ul>
  </div>
  ` : ''}
  ` : '<p>Analisi contestuale non disponibile</p>'}

  <h2>📊 Analisi della Copertura</h2>
  ${technicalData ? `
  <div class="card">
    <h3>Sintesi Tecnica</h3>
    <p>${technicalData.sintesi_tecnica || 'Non disponibile'}</p>
  </div>
  ${technicalData?.struttura_programma ? `
  <div class="card">
    <h3>Struttura del Programma</h3>
    <p><strong>Ordine Logico:</strong> ${technicalData.struttura_programma.ordine_logico || 'N/A'}</p>
    <p><strong>Note:</strong> ${technicalData.struttura_programma.note || 'N/A'}</p>
  </div>
  ` : ''}
  ${technicalData?.copertura_moduli?.length ? `
  <h3>Analisi Dettagliata per Modulo</h3>
  ${technicalData.copertura_moduli.map((modulo: any, i: number) => `
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <strong>${modulo.modulo_id || i + 1}. ${modulo.modulo_nome}</strong>
      <span>
        <span class="badge ${modulo.copertura_percentuale >= 75 ? 'bassa' : modulo.copertura_percentuale >= 50 ? 'media' : 'alta'}">${modulo.copertura_percentuale}%</span>
        <span class="badge media">${modulo.livello_profondita || 'N/A'}</span>
      </span>
    </div>
    ${modulo.note ? `<p style="font-style: italic; color: #6b7280; margin-bottom: 10px;">${modulo.note}</p>` : ''}
    ${modulo.argomenti_coperti?.length ? `
    <div style="background: #ecfdf5; padding: 10px; border-radius: 6px; margin: 8px 0;">
      <p style="font-weight: 600; color: #065f46; margin-bottom: 5px;">✓ Argomenti Coperti</p>
      <ul style="margin: 0; padding-left: 20px;">${modulo.argomenti_coperti.map((a: string) => `<li>${a}</li>`).join('')}</ul>
    </div>
    ` : ''}
    ${modulo.argomenti_extra?.length ? `
    <div style="background: #dbeafe; padding: 10px; border-radius: 6px; margin: 8px 0;">
      <p style="font-weight: 600; color: #1e40af; margin-bottom: 5px;">✨ Argomenti Extra</p>
      <ul style="margin: 0; padding-left: 20px;">${modulo.argomenti_extra.map((a: string) => `<li>${a}</li>`).join('')}</ul>
    </div>
    ` : ''}
    ${modulo.argomenti_omessi?.length ? `
    <div style="background: #fef3c7; padding: 10px; border-radius: 6px; margin: 8px 0;">
      <p style="font-weight: 600; color: #92400e; margin-bottom: 5px;">⚠ Argomenti Omessi o Parziali</p>
      <ul style="margin: 0; padding-left: 20px;">${modulo.argomenti_omessi.map((a: string) => `<li>${a}</li>`).join('')}</ul>
    </div>
    ` : ''}
  </div>
  `).join('')}
  ` : ''}
  ` : '<p>Analisi della copertura non disponibile</p>'}

  <h2>📊 Analisi Tecnica</h2>
  ${technicalData ? `
  ${technicalData?.profondita_ampiezza ? `
  <div class="card">
    <h3>Profondità e Ampiezza</h3>
    <p><strong>Livello generale:</strong> ${technicalData.profondita_ampiezza.livello_generale || 'N/A'}</p>
    ${technicalData.profondita_ampiezza.distribuzione ? `
    <p><strong>Distribuzione:</strong> Introduttivo ${technicalData.profondita_ampiezza.distribuzione.introduttivo || 0}%, Intermedio ${technicalData.profondita_ampiezza.distribuzione.intermedio || 0}%, Avanzato ${technicalData.profondita_ampiezza.distribuzione.avanzato || 0}%</p>
    ` : ''}
    <p><strong>Bilanciamento teoria/applicazioni:</strong> ${technicalData.profondita_ampiezza.bilanciamento_teoria_applicazioni || 'N/A'}</p>
    ${technicalData.profondita_ampiezza.argomenti_avanzati?.length ? `
    <p><strong>Argomenti avanzati:</strong> ${technicalData.profondita_ampiezza.argomenti_avanzati.join(', ')}</p>
    ` : ''}
    ${technicalData.profondita_ampiezza.note ? `<p><em>${technicalData.profondita_ampiezza.note}</em></p>` : ''}
  </div>
  ` : ''}
  ${technicalData?.sequenza_organizzazione ? `
  <div class="card">
    <h3>Sequenza e Organizzazione</h3>
    <p><strong>Approccio:</strong> ${technicalData.sequenza_organizzazione.approccio || 'N/A'}</p>
    <p><strong>Ordine logico:</strong> ${technicalData.sequenza_organizzazione.ordine_logico || 'N/A'}</p>
    <p><strong>Prerequisiti rispettati:</strong> ${technicalData.sequenza_organizzazione.prerequisiti_rispettati ? 'Sì' : 'No'}</p>
    <p><strong>Integrazione argomenti:</strong> ${technicalData.sequenza_organizzazione.integrazione_argomenti || 'N/A'}</p>
    ${technicalData.sequenza_organizzazione.note ? `<p><em>${technicalData.sequenza_organizzazione.note}</em></p>` : ''}
  </div>
  ` : ''}
  ` : ''}


  <h2>⚠️ Gap Identificati</h2>
  ${gapsData?.length ? gapsData.map((gap: any, i: number) => `
  <div class="gap-item">
    <div class="gap-header">
      <strong>${getGapTypeLabel(gap.tipo)}</strong>
      <span class="badge ${gap.gravita?.toLowerCase()}">${gap.gravita || 'N/A'}</span>
    </div>
    <p>${gap.descrizione}</p>
    ${gap.modulo_riferimento ? `<p><small><strong>Modulo:</strong> ${gap.modulo_riferimento}</small></p>` : ''}
    ${gap.impatto_commerciale ? `<p><small><strong>Impatto commerciale:</strong> ${gap.impatto_commerciale}</small></p>` : ''}
  </div>
  `).join('') : '<p>Nessun gap identificato</p>'}

  <h2>💡 Strategia di Approccio</h2>
  ${postItData?.strategia_approccio ? `
  ${postItData.strategia_approccio.fase_1 ? `
  <div class="strategy-phase">
    <h3><span class="phase-number">1</span>${postItData.strategia_approccio.fase_1.azione}</h3>
    <p>${postItData.strategia_approccio.fase_1.contenuto}</p>
    <p><strong>Obiettivo:</strong> ${postItData.strategia_approccio.fase_1.obiettivo}</p>
  </div>
  ` : ''}
  ${postItData.strategia_approccio.fase_2 ? `
  <div class="strategy-phase">
    <h3><span class="phase-number">2</span>${postItData.strategia_approccio.fase_2.azione}</h3>
    <p>${postItData.strategia_approccio.fase_2.contenuto}</p>
    <p><strong>Obiettivo:</strong> ${postItData.strategia_approccio.fase_2.obiettivo}</p>
  </div>
  ` : ''}
  ${postItData.strategia_approccio.fase_3 ? `
  <div class="strategy-phase">
    <h3><span class="phase-number">3</span>${postItData.strategia_approccio.fase_3.azione}</h3>
    <p>${postItData.strategia_approccio.fase_3.contenuto}</p>
    <p><strong>Obiettivo:</strong> ${postItData.strategia_approccio.fase_3.obiettivo}</p>
  </div>
  ` : ''}
  ` : '<p>Strategia non disponibile</p>'}

  ${postItData?.opportunita_zanichelli?.punti_forza_vs_competitor?.length ? `
  <h2>✨ Punti di Forza vs Competitor</h2>
  ${postItData.opportunita_zanichelli.punti_forza_vs_competitor.map((p: any) => `
  <div class="card success">
    <h3>${p.area}</h3>
    <p>${p.descrizione}</p>
    <p><small><strong>Rilevanza:</strong> ${p.rilevanza_per_programma}</small></p>
  </div>
  `).join('')}
  ` : ''}

  ${emailData?.corpo || generatedEmail ? `
  <h2>✉️ Email Generata</h2>
  ${emailData?.oggetto ? `<p><strong>Oggetto:</strong> ${emailData.oggetto}</p>` : ''}
  <div class="email-box">${emailData?.corpo || generatedEmail}</div>
  ` : ''}

  <div class="footer">
    <p>Analisi generata da UNI-SCAN - Sistema di Analisi e Confronto Programmi Universitari</p>
    <p>© Zanichelli Editore</p>
  </div>
</body>
</html>`;

    // Download HTML file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisi_${analysis.programTitle.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Analisi esportata in HTML!");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !analysis) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Analisi non trovata</h2>
          <p className="text-muted-foreground mb-4">
            L'analisi richiesta non esiste o è stata eliminata.
          </p>
          <Button onClick={() => setLocation("/storico")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna allo Storico
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Parse all JSON fields
  const postItData = safeParseJSON(analysis.postIt);
  const contextualData = safeParseJSON(analysis.contextualAnalysis);
  const technicalData = safeParseJSON(analysis.technicalAnalysis);
  const gapsData = safeParseJSON(analysis.gaps) || [];
  const emailData = safeParseJSON(analysis.generatedEmail);
  
  // Extract key data
  const manuale = postItData?.opportunita_zanichelli?.manuale_consigliato;
  const postItText = postItData?.post_it || '';
  const emailToShow = generatedEmail || emailData?.corpo || '';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/storico")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{analysis.programTitle}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                {analysis.universityName && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {analysis.universityName}
                  </span>
                )}
                {analysis.professorName && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {analysis.professorName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
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
            <Button variant="outline" onClick={exportToHTML}>
              <Download className="h-4 w-4 mr-2" />
              Esporta HTML
            </Button>
            <Badge 
              variant={analysis.status === "completed" ? "default" : "destructive"}
              className="text-sm"
            >
              {analysis.status === "completed" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Completata
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-1" />
                  Fallita
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Manuale Raccomandato Card */}
        {manuale && (
          <Card className="bg-gradient-to-r from-blue-600 to-blue-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Manuale Zanichelli Raccomandato</p>
                  <h2 className="text-2xl font-bold mb-1">{manuale.titolo}</h2>
                  <p className="text-blue-100">{manuale.autore}</p>
                </div>
                <div className="text-right">
                  {postItData?.opportunita_zanichelli?.allineamento_profilo_pedagogico && (
                    <div className="bg-white/20 rounded-lg px-4 py-2">
                      <p className="text-xs text-blue-100">Allineamento</p>
                      <p className="text-2xl font-bold">{postItData.opportunita_zanichelli.allineamento_profilo_pedagogico}%</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="postit" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="postit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Post-it</span>
            </TabsTrigger>
            <TabsTrigger value="valutazione" className="flex items-center gap-2">
              <BookMarked className="h-4 w-4" />
              <span className="hidden sm:inline">Valutazione</span>
            </TabsTrigger>
            <TabsTrigger value="profilo" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profilo</span>
            </TabsTrigger>
            <TabsTrigger value="copertura" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Copertura</span>
            </TabsTrigger>
            <TabsTrigger value="gap" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Gap</span>
            </TabsTrigger>
            <TabsTrigger value="strategia" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Strategia</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
          </TabsList>

          {/* Manual Evaluation Tab */}
          <TabsContent value="valutazione">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5 text-primary" />
                  Valutazione del Manuale
                </CardTitle>
                <CardDescription>
                  Report dettagliato della valutazione del manuale rispetto al framework
                </CardDescription>
              </CardHeader>
              <CardContent>
                {manualEvaluation && typeof manualEvaluation.content === 'string' && manualEvaluation.content.includes('<!DOCTYPE html>') ? (
                  <div className="w-full overflow-auto">
                    <iframe
                      srcDoc={manualEvaluation.content}
                      style={{
                        width: '100%',
                        height: '800px',
                        border: 'none',
                        borderRadius: '8px'
                      }}
                      title="Valutazione Manuale"
                    />
                  </div>
                ) : manualEvaluation ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Valutazione non disponibile in formato HTML</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nessuna valutazione disponibile per questa analisi</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Post-it Tab */}
          <TabsContent value="postit">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Post-it Commerciale
                    </CardTitle>
                    <CardDescription>
                      Sintesi pronta per l'uso durante la visita al docente
                    </CardDescription>
                  </div>
                  {postItText && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(postItText, "Post-it")}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copia
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {postItText ? (
                  <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {postItText}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Post-it non disponibile per questa analisi
                  </p>
                )}

                {/* Insight Principale */}
                {/* Analisi Bibliografia Adottata */}
                {postItData?.analisi_bibliografia && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      Analisi Bibliografia Adottata
                      {postItData.analisi_bibliografia.posizione_zanichelli && (
                        <Badge variant={postItData.analisi_bibliografia.posizione_zanichelli === 'principale' ? 'default' : postItData.analisi_bibliografia.posizione_zanichelli === 'alternativa' ? 'secondary' : 'outline'}>
                          Zanichelli: {postItData.analisi_bibliografia.posizione_zanichelli}
                        </Badge>
                      )}
                    </h4>
                    
                    {/* Manuale Principale */}
                    {postItData.analisi_bibliografia.manuale_principale && (
                      <div className={`border rounded-lg p-4 mb-4 ${postItData.analisi_bibliografia.manuale_principale.tipo?.includes('zanichelli') ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-orange-500 bg-orange-50 dark:bg-orange-950'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={postItData.analisi_bibliografia.manuale_principale.tipo?.includes('zanichelli') ? 'default' : 'destructive'}>
                              {postItData.analisi_bibliografia.manuale_principale.tipo?.includes('zanichelli') ? 'Zanichelli' : 'Competitor'}
                            </Badge>
                            <span className="font-semibold">Manuale Principale</span>
                          </div>
                          {postItData.analisi_bibliografia.manuale_principale.allineamento_programma && (
                            <Badge variant="outline">
                              Allineamento: {postItData.analisi_bibliografia.manuale_principale.allineamento_programma}%
                            </Badge>
                          )}
                        </div>
                        <h5 className="font-medium">{postItData.analisi_bibliografia.manuale_principale.titolo}</h5>
                        <p className="text-sm text-muted-foreground">{postItData.analisi_bibliografia.manuale_principale.autore} - {postItData.analisi_bibliografia.manuale_principale.editore}</p>
                        
                        {postItData.analisi_bibliografia.manuale_principale.valutazione && (
                          <p className="text-sm mt-2 bg-muted/50 p-2 rounded">
                            {postItData.analisi_bibliografia.manuale_principale.valutazione}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Manuali Alternativi */}
                    {postItData.analisi_bibliografia.manuali_alternativi?.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold">Manuali Alternativi</p>
                        {postItData.analisi_bibliografia.manuali_alternativi.map((m: any, i: number) => (
                          <div key={i} className={`border rounded-lg p-3 ${m.tipo?.includes('zanichelli') ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/50' : 'border-gray-300 bg-gray-50 dark:bg-gray-900'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={m.tipo?.includes('zanichelli') ? 'default' : 'outline'} className="text-xs">
                                {m.tipo?.includes('zanichelli') ? 'Zanichelli' : 'Competitor'}
                              </Badge>
                            </div>
                            <h6 className="font-medium text-sm">{m.titolo}</h6>
                            <p className="text-xs text-muted-foreground">{m.autore} - {m.editore}</p>
                            {m.confronto && (
                              <p className="text-xs mt-1 italic text-muted-foreground">{m.confronto}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Sintesi Competitiva */}
                    {postItData.analisi_bibliografia.sintesi_competitiva && (
                      <div className="mt-4 bg-muted/50 rounded-lg p-3">
                        <p className="text-xs font-semibold mb-1">Sintesi Competitiva</p>
                        <p className="text-sm">{postItData.analisi_bibliografia.sintesi_competitiva}</p>
                      </div>
                    )}
                  </div>
                )}

                {postItData?.insight_principale && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Insight Principale
                    </h4>
                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <p className="text-sm">{postItData.insight_principale}</p>
                    </div>
                  </div>
                )}

                {/* Argomentazioni Vendita */}
                {postItData?.argomentazioni_vendita?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Argomentazioni di Vendita
                    </h4>
                    <div className="space-y-3">
                      {postItData.argomentazioni_vendita.map((arg: any, i: number) => (
                        <div key={i} className="bg-muted/50 rounded-lg p-4 border-l-4 border-green-500">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className={arg.impatto === 'alto' ? 'border-green-500 text-green-700' : 'border-yellow-500 text-yellow-700'}>
                              Impatto {arg.impatto}
                            </Badge>
                            <span className="text-xs text-muted-foreground">#{arg.ordine}</span>
                          </div>
                          <p className="text-sm mb-2">{arg.messaggio}</p>
                          {arg.supporto && (
                            <p className="text-xs text-muted-foreground italic">{arg.supporto}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profilo Tab */}
          <TabsContent value="profilo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profilo Pedagogico del Docente
                </CardTitle>
                <CardDescription>
                  Analisi contestuale basata sul programma del corso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {contextualData ? (
                  <>
                    {/* Filosofia Didattica */}
                    {contextualData.filosofia_didattica && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Filosofia Didattica
                        </h4>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Approccio Principale</p>
                            <p className="font-medium">{contextualData.filosofia_didattica.approccio_principale || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Bilanciamento Teoria/Pratica</p>
                            <p className="font-medium">{contextualData.filosofia_didattica.bilanciamento_teoria_pratica || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Livello Rigore</p>
                            <p className="font-medium">{contextualData.filosofia_didattica.livello_rigore || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Accessibilità</p>
                            <p className="font-medium">{contextualData.filosofia_didattica.livello_accessibilita || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Enfasi Applicazioni</p>
                            <p className="font-medium">{contextualData.filosofia_didattica.enfasi_applicazioni || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Interdisciplinarità</p>
                            <p className="font-medium">{contextualData.filosofia_didattica.interdisciplinarita || 'N/A'}</p>
                          </div>
                          {/* Campi specifici per economia */}
                          {contextualData.filosofia_didattica.scuola_pensiero && (
                            <div>
                              <p className="text-xs text-muted-foreground">Scuola di Pensiero</p>
                              <p className="font-medium">{contextualData.filosofia_didattica.scuola_pensiero}</p>
                            </div>
                          )}
                          {contextualData.filosofia_didattica.sequenza_micro && contextualData.filosofia_didattica.sequenza_micro !== 'non applicabile' && (
                            <div>
                              <p className="text-xs text-muted-foreground">Sequenza Micro</p>
                              <p className="font-medium">{contextualData.filosofia_didattica.sequenza_micro}</p>
                            </div>
                          )}
                          {contextualData.filosofia_didattica.sequenza_macro && contextualData.filosofia_didattica.sequenza_macro !== 'non applicabile' && (
                            <div>
                              <p className="text-xs text-muted-foreground">Sequenza Macro</p>
                              <p className="font-medium">{contextualData.filosofia_didattica.sequenza_macro}</p>
                            </div>
                          )}
                          {contextualData.filosofia_didattica.approccio_crescita && contextualData.filosofia_didattica.approccio_crescita !== 'Non trattato' && (
                            <div>
                              <p className="text-xs text-muted-foreground">Approccio Crescita</p>
                              <p className="font-medium">{contextualData.filosofia_didattica.approccio_crescita}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Valutazione Dimensioni */}
                    {contextualData.valutazione_dimensioni && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Dimensioni di Valutazione
                        </h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          {Object.entries(contextualData.valutazione_dimensioni).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between bg-background rounded-lg p-3">
                              <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                              <Badge variant="secondary">{String(value)}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sintesi Profilo */}
                    {contextualData.sintesi_profilo && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Sintesi del Profilo</h4>
                        <p className="text-sm">{contextualData.sintesi_profilo}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Profilo pedagogico non disponibile per questa analisi
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Copertura Tab */}
          <TabsContent value="copertura">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Analisi della Copertura
                </CardTitle>
                <CardDescription>
                  Report narrativo sulla copertura del programma rispetto al framework della materia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {technicalData ? (
                  <>
                    {/* Sintesi Tecnica */}
                    {technicalData.sintesi_tecnica && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          Sintesi Tecnica
                        </h4>
                        <p className="text-sm leading-relaxed">{technicalData.sintesi_tecnica}</p>
                      </div>
                    )}

                    {/* Struttura Programma */}
                    {technicalData.struttura_programma && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Struttura del Programma
                        </h4>
                        <div className="space-y-3">
                          {technicalData.struttura_programma.ordine_logico && (
                            <div>
                              <p className="text-xs text-muted-foreground font-medium mb-1">Ordine Logico</p>
                              <p className="text-sm leading-relaxed">{technicalData.struttura_programma.ordine_logico}</p>
                            </div>
                          )}
                          {technicalData.struttura_programma.note && (
                            <div>
                              <p className="text-xs text-muted-foreground font-medium mb-1">Note</p>
                              <p className="text-sm leading-relaxed">{technicalData.struttura_programma.note}</p>
                            </div>
                          )}
                          {technicalData.struttura_programma.prerequisiti_rispettati !== undefined && (
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">Prerequisiti Rispettati:</p>
                              {technicalData.struttura_programma.prerequisiti_rispettati ? (
                                <Badge variant="default" className="bg-green-500">Sì</Badge>
                              ) : (
                                <Badge variant="destructive">No</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Analisi Dettagliata per Modulo - Formato Narrativo */}
                    {(manualEvaluation?.frameworkCoverage?.modules || technicalData?.copertura_moduli) && Array.isArray(manualEvaluation?.frameworkCoverage?.modules || technicalData?.copertura_moduli) && (manualEvaluation?.frameworkCoverage?.modules || technicalData?.copertura_moduli)?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Analisi Dettagliata per Modulo
                        </h4>
                        <div className="space-y-4">
                          {(manualEvaluation?.frameworkCoverage?.modules || technicalData?.copertura_moduli || []).map((modulo: any, i: number) => (
                            <div key={i} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                                    {modulo.moduleId || modulo.modulo_id || i + 1}
                                  </span>
                                  <h5 className="font-semibold">{modulo.moduleName || modulo.modulo_nome}</h5>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{modulo.livello_profondita || 'N/A'}</Badge>
                                  <Badge className={(modulo.coveragePercentage || modulo.copertura_percentuale || 0) >= 75 ? 'bg-green-500' : (modulo.coveragePercentage || modulo.copertura_percentuale || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'}>
                                    {modulo.coveragePercentage || modulo.copertura_percentuale}%
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Note narrative */}
                              {modulo.note && (
                                <p className="text-sm text-muted-foreground mb-3 italic">
                                  {modulo.note}
                                </p>
                              )}
                              
                              <div className="grid gap-3 md:grid-cols-2">
                                {/* Argomenti Coperti */}
                                {(modulo.coveredTopics || modulo.argomenti_coperti)?.length > 0 && (
                                  <div className="bg-green-50 dark:bg-green-950/50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2 flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Argomenti Coperti
                                    </p>
                                    <ul className="text-xs space-y-1">
                                      {(modulo.coveredTopics || modulo.argomenti_coperti || []).map((arg: string, j: number) => (
                                        <li key={j} className="flex items-start gap-1">
                                          <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                          <span>{arg}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {/* Argomenti Mancanti */}
                                {(modulo.missingTopics || modulo.argomenti_extra)?.length > 0 && (
                                  <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Argomenti Mancanti
                                    </p>
                                    <ul className="text-xs space-y-1">
                                      {(modulo.missingTopics || modulo.argomenti_extra || []).map((arg: string, j: number) => (
                                        <li key={j} className="flex items-start gap-1">
                                          <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                          <span>{arg}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {/* Argomenti Omessi */}
                                {modulo.argomenti_omessi?.length > 0 && (
                                  <div className="bg-orange-50 dark:bg-orange-950/50 rounded-lg p-3 md:col-span-2">
                                    <p className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Argomenti Omessi o Parziali
                                    </p>
                                    <ul className="text-xs space-y-1">
                                      {modulo.argomenti_omessi.map((arg: string, j: number) => (
                                        <li key={j} className="flex items-start gap-1">
                                          <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                          <span>{arg}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}


                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Analisi della copertura non disponibile
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gap Tab */}
          <TabsContent value="gap">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Gap Identificati
                </CardTitle>
                <CardDescription>
                  Aree di miglioramento e opportunità commerciali
                </CardDescription>
              </CardHeader>
              <CardContent>
                {gapsData.length > 0 ? (
                  <div className="space-y-4">
                    {gapsData.map((gap: any, i: number) => (
                      <div key={i} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{getGapTypeLabel(gap.tipo)}</Badge>
                            {gap.modulo_riferimento && (
                              <span className="text-xs text-muted-foreground">
                                {gap.modulo_riferimento}
                              </span>
                            )}
                          </div>
                          <Badge className={getSeverityColor(gap.gravita)}>
                            {gap.gravita || 'N/A'}
                          </Badge>
                        </div>
                        <p className="text-sm mb-3">{gap.descrizione}</p>
                        {gap.impatto_commerciale && (
                          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1 flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Impatto Commerciale
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">{gap.impatto_commerciale}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : postItData?.gap_identificati?.length > 0 ? (
                  <div className="space-y-4">
                    {postItData.gap_identificati.map((gap: any, i: number) => (
                      <div key={i} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{getGapTypeLabel(gap.tipo)}</Badge>
                            {gap.modulo_riferimento && (
                              <span className="text-xs text-muted-foreground">
                                {gap.modulo_riferimento}
                              </span>
                            )}
                          </div>
                          <Badge className={getSeverityColor(gap.gravita)}>
                            {gap.gravita || 'N/A'}
                          </Badge>
                        </div>
                        <p className="text-sm mb-3">{gap.descrizione}</p>
                        {gap.impatto_commerciale && (
                          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1 flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Impatto Commerciale
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">{gap.impatto_commerciale}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nessun gap identificato per questa analisi
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strategia Tab */}
          <TabsContent value="strategia">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Strategia di Approccio
                </CardTitle>
                <CardDescription>
                  Piano d'azione per la visita al docente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {postItData?.strategia_approccio ? (
                  <>
                    {/* Fasi della Strategia */}
                    <div className="space-y-4">
                      {postItData.strategia_approccio.fase_1 && (
                        <div className="border-l-4 border-blue-500 pl-4 py-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-bold">1</span>
                            <h4 className="font-semibold">{postItData.strategia_approccio.fase_1.azione}</h4>
                          </div>
                          <p className="text-sm mb-2">{postItData.strategia_approccio.fase_1.contenuto}</p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Obiettivo:</strong> {postItData.strategia_approccio.fase_1.obiettivo}
                          </p>
                          {postItData.strategia_approccio.fase_1.materiali?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Materiali:</p>
                              <ul className="text-xs space-y-1">
                                {postItData.strategia_approccio.fase_1.materiali.map((m: string, i: number) => (
                                  <li key={i} className="flex items-center gap-1">
                                    <ChevronRight className="h-3 w-3" />
                                    {m}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {postItData.strategia_approccio.fase_2 && (
                        <div className="border-l-4 border-green-500 pl-4 py-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-sm font-bold">2</span>
                            <h4 className="font-semibold">{postItData.strategia_approccio.fase_2.azione}</h4>
                          </div>
                          <p className="text-sm mb-2">{postItData.strategia_approccio.fase_2.contenuto}</p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Obiettivo:</strong> {postItData.strategia_approccio.fase_2.obiettivo}
                          </p>
                          {postItData.strategia_approccio.fase_2.materiali?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Materiali:</p>
                              <ul className="text-xs space-y-1">
                                {postItData.strategia_approccio.fase_2.materiali.map((m: string, i: number) => (
                                  <li key={i} className="flex items-center gap-1">
                                    <ChevronRight className="h-3 w-3" />
                                    {m}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {postItData.strategia_approccio.fase_3 && (
                        <div className="border-l-4 border-purple-500 pl-4 py-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-sm font-bold">3</span>
                            <h4 className="font-semibold">{postItData.strategia_approccio.fase_3.azione}</h4>
                          </div>
                          <p className="text-sm mb-2">{postItData.strategia_approccio.fase_3.contenuto}</p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Obiettivo:</strong> {postItData.strategia_approccio.fase_3.obiettivo}
                          </p>
                          {postItData.strategia_approccio.fase_3.materiali?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Materiali:</p>
                              <ul className="text-xs space-y-1">
                                {postItData.strategia_approccio.fase_3.materiali.map((m: string, i: number) => (
                                  <li key={i} className="flex items-center gap-1">
                                    <ChevronRight className="h-3 w-3" />
                                    {m}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Punti di Forza vs Competitor */}
                    {postItData.opportunita_zanichelli?.punti_forza_vs_competitor?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <BookMarked className="h-4 w-4 text-green-500" />
                          Punti di Forza vs Competitor
                        </h4>
                        <div className="grid gap-3">
                          {postItData.opportunita_zanichelli.punti_forza_vs_competitor.map((punto: any, i: number) => (
                            <div key={i} className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                              <h5 className="font-medium text-green-800 dark:text-green-200 mb-1">{punto.area}</h5>
                              <p className="text-sm mb-2">{punto.descrizione}</p>
                              <p className="text-xs text-green-600 dark:text-green-400">
                                <strong>Rilevanza:</strong> {punto.rilevanza_per_programma}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Strategia di approccio non disponibile
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Email Personalizzata
                    </CardTitle>
                    <CardDescription>
                      Email di primo contatto generata automaticamente
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={handleGenerateEmail}
                      disabled={isGeneratingEmail}
                      variant={emailToShow ? "outline" : "default"}
                    >
                      {isGeneratingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generazione...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          {emailToShow ? "Rigenera Email" : "Genera Email"}
                        </>
                      )}
                    </Button>
                    {emailToShow && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(emailToShow, "Email")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copia
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {emailToShow ? (
                  <div className="space-y-4">
                    {emailData?.oggetto && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Oggetto</p>
                        <p className="font-medium">{emailData.oggetto}</p>
                      </div>
                    )}
                    <Textarea
                      value={emailToShow}
                      readOnly
                      className="min-h-[400px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Puoi copiare e modificare questa email prima di inviarla al docente.
                    </p>
                    {emailData?.note_per_promotore && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Note per il Promotore</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{emailData.note_per_promotore}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nessuna email generata</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Clicca su "Genera Email" per creare un'email personalizzata 
                      basata sui gap identificati e sul profilo del docente.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
