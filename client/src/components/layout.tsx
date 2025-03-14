import { MainNav } from "@/components/main-nav";
import { Sidebar } from "@/components/sidebar";

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  botId?: number;
}

export function Layout({ children, showSidebar = true, botId }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="flex">
        {showSidebar && (
          <Sidebar botId={botId} className="w-64 flex-shrink-0 hidden md:block" />
        )}
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}