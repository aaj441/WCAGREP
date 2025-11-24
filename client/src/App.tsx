import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ErrorBoundary } from "@/components/error-boundary";
import { CommandPalette } from "@/components/command-palette";
import { useGlobalShortcuts } from "@/hooks/use-keyboard-shortcuts";
import Dashboard from "@/pages/dashboard";
import Prospects from "@/pages/prospects";
import Analytics from "@/pages/analytics";
import QuickWin from "@/pages/quick-win";
import KeywordDiscovery from "@/pages/keyword-discovery";
import EmailOutreach from "@/pages/email-outreach";
import Integrations from "@/pages/integrations";
import Scanner from "@/pages/scanner";
import Reports from "@/pages/reports";
import KnowledgeBase from "@/pages/knowledge-base";
import AgentStatus from "@/pages/agent-status";
import BackendStatus from "@/pages/backend-status";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={QuickWin} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/prospects" component={Prospects} />
      <Route path="/discovery" component={KeywordDiscovery} />
      <Route path="/outreach" component={EmailOutreach} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/scanner" component={Scanner} />
      <Route path="/reports" component={Reports} />
      <Route path="/knowledge" component={KnowledgeBase} />
      <Route path="/agents" component={AgentStatus} />
      <Route path="/backends" component={BackendStatus} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/cadences" component={() => <div><h1 className="text-3xl font-semibold">📧 Email Cadences</h1><p className="text-muted-foreground mt-2">Manage your automated email campaigns</p></div>} />
      <Route path="/code-generator" component={() => <div><h1 className="text-3xl font-semibold">🛠️ Code Generator</h1><p className="text-muted-foreground mt-2">Generate accessible code snippets</p></div>} />
      <Route path="/templates" component={() => <div><h1 className="text-3xl font-semibold">📝 Templates</h1><p className="text-muted-foreground mt-2">Manage email and outreach templates</p></div>} />
      <Route path="/settings" component={() => <div><h1 className="text-3xl font-semibold">⚙️ Settings</h1><p className="text-muted-foreground mt-2">Configure your platform preferences</p></div>} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Enable global keyboard shortcuts
  useGlobalShortcuts();

  // Set platform-specific modifier key display
  useEffect(() => {
    const modKey = document.getElementById('mod-key');
    if (modKey) {
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      modKey.textContent = isMac ? '⌘' : '⌃';
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div className="flex items-center gap-2">
                    <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:inline-flex">
                      <span className="text-xs" id="mod-key">⌘</span>K
                    </kbd>
                    <ThemeToggle />
                  </div>
                </header>
                <main className="flex-1 overflow-auto p-6">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <CommandPalette />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
