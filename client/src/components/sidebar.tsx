import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Settings2, 
  LayoutDashboard, 
  MessageSquare, 
  Database,
  BookOpen,
  Code2,
  BarChart3
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  botId?: number;
}

export function Sidebar({ className, botId }: SidebarProps) {
  const items = botId ? [
    {
      title: "Overview",
      href: `/bot/${botId}/dashboard`,
      icon: LayoutDashboard
    },
    {
      title: "Configurações",
      href: `/bot/${botId}`,
      icon: Settings2
    },
    {
      title: "Conversas",
      href: `/bot/${botId}/chats`,
      icon: MessageSquare
    },
    {
      title: "Base de Conhecimento",
      href: `/bot/${botId}/knowledge`,
      icon: Database
    },
    {
      title: "Analytics",
      href: `/bot/${botId}/analytics`,
      icon: BarChart3
    },
    {
      title: "Integração",
      href: `/bot/${botId}/integration`,
      icon: Code2
    }
  ] : [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard
    },
    {
      title: "Documentação",
      href: "/docs",
      icon: BookOpen
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3
    }
  ];

  return (
    <div className={cn("pb-12 border-r min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {items.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start transition-all hover:bg-muted"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
