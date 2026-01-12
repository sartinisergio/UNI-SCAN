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

  const handleToggle = (provider: "manus" | "openai") => {
    if (provider === "openai" && !hasOpenAIKey) {
      toast.error("Configura prima una chiave API OpenAI");
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
        <div className="grid gap-3 md:grid-cols-2">
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
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                currentProvider === "manus" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Manus AI</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Incluso nel tuo abbonamento Manus. Nessun costo aggiuntivo.
                </div>
              </div>
              {currentProvider === "manus" && (
                <CheckCircle2 className="h-5 w-5 text-primary absolute top-3 right-3" />
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
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                currentProvider === "openai" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <Key className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">OpenAI (GPT-4)</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {hasOpenAIKey 
                    ? "Usa la tua chiave API. I costi sono addebitati al tuo account OpenAI."
                    : "Configura una chiave API OpenAI per abilitare questa opzione."
                  }
                </div>
              </div>
              {currentProvider === "openai" && (
                <CheckCircle2 className="h-5 w-5 text-primary absolute top-3 right-3" />
              )}
            </div>
          </button>
        </div>

        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Nota:</strong> Entrambi i provider utilizzano modelli AI avanzati con temperature=0 per garantire risultati consistenti. 
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

  // Initialize form with existing data using useEffect
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setPhone(profile.phone || "");
      setEmail(profile.email || "");
      setTerritory(profile.territory || "");
    }
  }, [profile]);

  const handleSave = () => {
    if (!fullName.trim()) {
      toast.error("Il nome completo è obbligatorio");
      return;
    }
    upsertMutation.mutate({
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      territory: territory.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Caricamento profilo...
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
              Informazioni utilizzate per la generazione delle email
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo *</Label>
            <Input
              id="fullName"
              placeholder="Mario Rossi"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="mario.rossi@zanichelli.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              placeholder="+39 123 456 7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="territory">Territorio</Label>
            <Input
              id="territory"
              placeholder="Emilia-Romagna"
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={upsertMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Salva Profilo
        </Button>
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
            Configura le chiavi API e il profilo promotore
          </p>
        </div>

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
