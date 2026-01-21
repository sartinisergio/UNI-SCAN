import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Key, 
  Save, 
  Trash2, 
  Eye, 
  EyeOff,
  CheckCircle2,
  XCircle,
  User,
  Cloud,
  ExternalLink,
  RefreshCw,
  Loader2,
  Cpu,
  Zap
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePublisher, PUBLISHERS } from "@/contexts/PublisherContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen } from "lucide-react";

type Provider = "openai" | "perplexity" | "claude";

interface ApiKeyFormProps {
  provider: Provider;
  label: string;
  description: string;
  placeholder: string;
}

function ApiKeyForm({ provider, label, description, placeholder }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.apiConfig.get.useQuery({ provider });
  
  const upsertMutation = trpc.apiConfig.upsert.useMutation({
    onSuccess: () => {
      toast.success(`Chiave ${label} salvata con successo`);
      utils.apiConfig.get.invalidate({ provider });
      setApiKey("");
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });
  
  const deleteMutation = trpc.apiConfig.delete.useMutation({
    onSuccess: () => {
      toast.success(`Chiave ${label} eliminata`);
      utils.apiConfig.get.invalidate({ provider });
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error("Inserisci una chiave API valida");
      return;
    }
    upsertMutation.mutate({ provider, apiKey: apiKey.trim() });
  };

  const handleDelete = () => {
    if (confirm(`Sei sicuro di voler eliminare la chiave ${label}?`)) {
      deleteMutation.mutate({ provider });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{label}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          {config ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Configurata</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Non configurata</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${provider}-key`}>Chiave API</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id={`${provider}-key`}
                type={showKey ? "text" : "password"}
                placeholder={config ? "••••••••••••••••" : placeholder}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={!apiKey.trim() || upsertMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Salva
            </Button>
            {config && (
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// DropboxOAuthForm rimosso - Dropbox integration completamente eliminata

function LLMProviderToggle() {
  const utils = trpc.useUtils();
  const { data: providerData, isLoading } = trpc.apiConfig.getLlmProvider.useQuery();
  const { data: openaiConfig } = trpc.apiConfig.get.useQuery({ provider: "openai" });
  const { data: perplexityConfig } = trpc.apiConfig.get.useQuery({ provider: "perplexity" });
  const { data: claudeConfig } = trpc.apiConfig.get.useQuery({ provider: "claude" });
  
  const setProviderMutation = trpc.apiConfig.setLlmProvider.useMutation({
    onSuccess: () => {
      toast.success("Provider AI aggiornato");
      utils.apiConfig.getLlmProvider.invalidate();
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const currentProvider = providerData?.provider || "manus";
  const hasOpenAIKey = !!openaiConfig;
  const hasPerplexityKey = !!perplexityConfig;
  const hasClaudeKey = !!claudeConfig;

  const handleToggle = (provider: "manus" | "openai" | "perplexity" | "claude") => {
    if (provider === "openai" && !hasOpenAIKey) {
      toast.error("Configura prima una chiave API OpenAI");
      return;
    }
    if (provider === "perplexity" && !hasPerplexityKey) {
      toast.error("Configura prima una chiave API Perplexity");
      return;
    }
    if (provider === "claude" && !hasClaudeKey) {
      toast.error("Configura prima una chiave API Claude");
      return;
    }
    setProviderMutation.mutate({ provider });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Caricamento...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Cpu className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Provider AI</CardTitle>
            <CardDescription>
              Scegli quale servizio AI utilizzare per le analisi
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* Manus Option */}
          <button
            onClick={() => handleToggle("manus")}
            disabled={setProviderMutation.isPending}
            className={`relative p-4 rounded-lg border-2 transition-all text-left ${
              currentProvider === "manus"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                currentProvider === "manus" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">Manus AI</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Incluso nel tuo abbonamento
                </div>
              </div>
              {currentProvider === "manus" && (
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              )}
            </div>
          </button>

          {/* OpenAI Option */}
          <button
            onClick={() => handleToggle("openai")}
            disabled={setProviderMutation.isPending || !hasOpenAIKey}
            className={`relative p-4 rounded-lg border-2 transition-all text-left ${
              currentProvider === "openai"
                ? "border-primary bg-primary/5"
                : hasOpenAIKey
                ? "border-border hover:border-primary/50"
                : "border-border opacity-60 cursor-not-allowed"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                currentProvider === "openai" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <Key className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">OpenAI</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {hasOpenAIKey ? "Configurata" : "Non configurata"}
                </div>
              </div>
              {currentProvider === "openai" && (
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              )}
            </div>
          </button>

          {/* Perplexity Option */}
          <button
            onClick={() => handleToggle("perplexity")}
            disabled={setProviderMutation.isPending || !hasPerplexityKey}
            className={`relative p-4 rounded-lg border-2 transition-all text-left ${
              currentProvider === "perplexity"
                ? "border-primary bg-primary/5"
                : hasPerplexityKey
                ? "border-border hover:border-primary/50"
                : "border-border opacity-60 cursor-not-allowed"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                currentProvider === "perplexity" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <Cloud className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">Perplexity</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {hasPerplexityKey ? "Configurata" : "Non configurata"}
                </div>
              </div>
              {currentProvider === "perplexity" && (
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              )}
            </div>
          </button>

          {/* Claude Option */}
          <button
            onClick={() => handleToggle("claude")}
            disabled={setProviderMutation.isPending || !hasClaudeKey}
            className={`relative p-4 rounded-lg border-2 transition-all text-left ${
              currentProvider === "claude"
                ? "border-primary bg-primary/5"
                : hasClaudeKey
                ? "border-border hover:border-primary/50"
                : "border-border opacity-60 cursor-not-allowed"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                currentProvider === "claude" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <Cpu className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">Claude</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {hasClaudeKey ? "Configurata" : "Non configurata"}
                </div>
              </div>
              {currentProvider === "claude" && (
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              )}
            </div>
          </button>
        </div>

        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Nota:</strong> Tutti i provider utilizzano temperature=0 per garantire risultati consistenti. 
          La scelta del provider influisce solo su dove vengono addebitate le chiamate API.
        </div>
      </CardContent>
    </Card>
  );
}

function PromoterProfileForm() {
  const { data: profile, isLoading } = trpc.promoterProfile.get.useQuery();
  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [territory, setTerritory] = useState("");
  
  const utils = trpc.useUtils();
  
  const upsertMutation = trpc.promoterProfile.upsert.useMutation({
    onSuccess: () => {
      toast.success("Profilo salvato con successo");
      utils.promoterProfile.get.invalidate();
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setPhone(profile.phone || "");
      setEmail(profile.email || "");
      setTerritory(profile.territory || "");
    }
  }, [profile]);

  const handleSave = () => {
    upsertMutation.mutate({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      territory: territory.trim(),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Caricamento...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Profilo Promotore</CardTitle>
            <CardDescription>
              Informazioni personali e territorio di competenza
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Es. Mario Rossi"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Es. +39 123 456 7890"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Es. mario@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="territory">Territorio</Label>
            <Input
              id="territory"
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
              placeholder="Es. Nord Italia"
            />
          </div>
        </div>
        <Button 
          onClick={handleSave}
          disabled={upsertMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Salva Profilo
        </Button>
      </CardContent>
    </Card>
  );
}

function PublisherSelector() {
  const { selectedPublisher, setSelectedPublisher } = usePublisher();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Editore Predefinito</CardTitle>
            <CardDescription>
              Seleziona l'editore per il quale visualizzare i framework e i manuali
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="publisher">Editore</Label>
          <Select value={selectedPublisher} onValueChange={setSelectedPublisher}>
            <SelectTrigger id="publisher">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PUBLISHERS.map((publisher) => (
                <SelectItem key={publisher} value={publisher}>
                  {publisher}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          L'editore selezionato identifica i manuali competitor nella valutazione. Il framework di valutazione rimane lo stesso per tutti gli editori di una materia.
        </p>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Impostazioni</h1>
          <p className="text-muted-foreground mt-1">
            Configura le chiavi API, l'editore e il profilo promotore
          </p>
        </div>

        {/* Publisher Selector */}
        <PublisherSelector />

        {/* Provider AI */}
        <LLMProviderToggle />

        {/* Profilo Promotore */}
        <PromoterProfileForm />

        {/* API Keys Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Chiavi API</h2>
          <p className="text-sm text-muted-foreground">
            Configura le chiavi API per i servizi di intelligenza artificiale. 
            Le chiavi sono crittografate e memorizzate in modo sicuro.
          </p>
          
          <div className="grid gap-4">
            <ApiKeyForm
              provider="openai"
              label="OpenAI"
              description="GPT-4 per analisi e generazione contenuti"
              placeholder="sk-..."
            />
            
            <ApiKeyForm
              provider="perplexity"
              label="Perplexity"
              description="Ricerca e analisi con accesso web"
              placeholder="pplx-..."
            />
            
            <ApiKeyForm
              provider="claude"
              label="Claude (Anthropic)"
              description="Analisi avanzata e ragionamento"
              placeholder="sk-ant-..."
            />
            
            {/* Dropbox OAuth - RIMOSSO */}
          </div>
        </div>

        {/* Info Box */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Informazioni sulla sicurezza</h3>
                <p className="text-sm text-muted-foreground">
                  Le chiavi API sono memorizzate in modo sicuro nel database e non vengono mai 
                  esposte nel frontend. Ogni utente utilizza le proprie chiavi per le chiamate AI, 
                  garantendo tracciabilità e controllo dei costi.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
