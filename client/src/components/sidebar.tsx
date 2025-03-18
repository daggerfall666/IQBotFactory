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
      title: "Settings",
      href: `/bot/${botId}`,
      icon: Settings2
    },
    {
      title: "Conversations",
      href: `/bot/${botId}/chats`,
      icon: MessageSquare
    },
    {
      title: "Knowledge Base",
      href: `/bot/${botId}/knowledge`,
      icon: Database
    },
    {
      title: "Analytics",
      href: `/bot/${botId}/analytics`,
      icon: BarChart3
    },
    {
      title: "Integration",
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
      title: "Documentation",
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
    <div className={cn("space-y-4", className)}>
      <nav>
        <div className="space-y-1">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start transition-all hover:bg-muted/80 group relative"
              >
                <item.icon className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="truncate">{item.title}</span>
              </Button>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}