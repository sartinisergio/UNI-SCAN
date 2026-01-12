import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import GestioneDati from "./pages/GestioneDati";
import DatabaseManuali from "./pages/DatabaseManuali";
import Analisi from "./pages/Analisi";
import Storico from "./pages/Storico";
import AnalisiDetail from "./pages/AnalisiDetail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/gestione-dati" component={GestioneDati} />
      <Route path="/database-manuali" component={DatabaseManuali} />
      <Route path="/analisi" component={Analisi} />
      <Route path="/storico" component={Storico} />
      <Route path="/storico/:id" component={AnalisiDetail} />
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
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
