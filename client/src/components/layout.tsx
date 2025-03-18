import { MainNav } from "@/components/main-nav";
import { Sidebar } from "@/components/sidebar";

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  botId?: number;
}

export function Layout({ children, showSidebar = true, botId }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainNav />
      <div className="flex-1 flex">
        {showSidebar && (
          <aside className="hidden md:block w-64 shrink-0 border-r border-border/40 bg-muted/5 transition-all duration-300 ease-in-out">
            <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
              <Sidebar botId={botId} className="p-4" />
            </div>
          </aside>
        )}
        <main className="flex-1 min-h-[calc(100vh-4rem)] relative">
          <div className="responsive-container adaptive-stack">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}