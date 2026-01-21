import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PublisherProvider } from "./contexts/PublisherContext";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import GestioneDati from "./pages/GestioneDati";
import DatabaseManuali from "./pages/DatabaseManuali";
import Analisi from "./pages/Analisi";
import Storico from "./pages/Storico";
import AnalisiDetail from "./pages/AnalisiDetail";
import EvaluazioniManuali from "./pages/EvaluazioniManuali";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/gestione-dati" component={GestioneDati} />
      <Route path="/database-manuali" component={DatabaseManuali} />
      <Route path="/analisi" component={Analisi} />
      <Route path="/storico" component={Storico} />
      <Route path="/storico/:id" component={AnalisiDetail} />
      <Route path="/valutazioni-manuali" component={EvaluazioniManuali} />
      <Route path="/impostazioni" component={Settings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <PublisherProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </PublisherProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
