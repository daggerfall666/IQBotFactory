import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import BotConfig from "@/pages/bot-config";
import KnowledgeBase from "@/pages/knowledge-base";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import PromptLab from "@/pages/prompt-lab";
import HealthDashboard from "@/pages/health-dashboard";
import Analytics from "@/pages/analytics";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/bot/:id" component={BotConfig} />
      <Route path="/bot/:id/dashboard" component={Dashboard} />
      <Route path="/bot/:id/knowledge" component={KnowledgeBase} />
      <Route path="/admin" component={Admin} />
      <Route path="/prompt-lab" component={PromptLab} />
      <Route path="/health" component={HealthDashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;