import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Upload, AlertCircle, CheckCircle, Download } from "lucide-react";

/**
 * Tool standalone per convertire PDF in testo
 * Utilizza pdfjs per l'estrazione del testo direttamente nel browser
 * Nessun collegamento con l'app principale
 */
export function PdfConverterTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.includes("pdf")) {
        setError("Per favore seleziona un file PDF");
        return;
      }
      setSelectedFile(file);
      setError("");
      setSuccess(false);
      setExtractedText("");
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setError("Per favore seleziona un file PDF");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Leggi il file come base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(",")[1];

          // Chiama il backend per convertire il PDF
          const response = await fetch("/api/trpc/analyses.convertPdf", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input: {
                pdfBase64: `data:application/pdf;base64,${base64}`,
              },
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error?.message || "Errore durante la conversione"
            );
          }

          const data = await response.json();
          setExtractedText(data.result.testo);
          setSuccess(true);
        } catch (err: any) {
          setError(err.message || "Errore durante la conversione del PDF");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      setError(err.message || "Errore durante la lettura del file");
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      const btn = document.querySelector("[data-copy-btn]") as HTMLButtonElement;
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = "✓ Copiato!";
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }
    } catch (err) {
      setError("Errore durante la copia del testo");
    }
  };

  const handleDownload = () => {
    try {
      const element = document.createElement("a");
      const file = new Blob([extractedText], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `${selectedFile?.name?.replace(".pdf", "") || "documento"}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      setError("Errore durante il download del file");
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setExtractedText("");
    setError("");
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <Upload className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Converti PDF in Testo</h3>
            <p className="text-sm text-muted-foreground">
              Estrai il testo da qualsiasi PDF per usarlo in Analisi Situazionale
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-white"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-blue-400 mb-2" />
          <p className="text-sm font-medium">
            {selectedFile ? selectedFile.name : "Clicca per selezionare un PDF"}
          </p>
          <p className="text-xs text-muted-foreground">
            oppure trascina un file PDF qui
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md border border-green-200">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">PDF convertito con successo!</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleConvert}
            disabled={!selectedFile || isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Conversione in corso..." : "Converti PDF"}
          </Button>
          {selectedFile && (
            <Button onClick={handleClear} variant="outline">
              Cancella
            </Button>
          )}
        </div>

        {/* Extracted Text Section */}
        {extractedText && (
          <div className="space-y-3 pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Testo Estratto</h4>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopy}
                  data-copy-btn
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copia
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Scarica
                </Button>
              </div>
            </div>

            <Textarea
              value={extractedText}
              readOnly
              className="min-h-64 font-mono text-xs bg-white"
              placeholder="Il testo estratto apparirà qui..."
            />

            <div className="text-xs text-muted-foreground">
              {extractedText.length} caratteri
            </div>

            <div className="bg-blue-100 border border-blue-300 rounded-md p-3">
              <p className="text-xs text-blue-900">
                💡 <strong>Suggerimento:</strong> Copia il testo e incollalo nel campo "Contenuto del Programma" in <strong>Analisi Situazionale</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
