import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Bot, Settings2, Wand2, Home, BookOpen, BarChart, Activity } from "lucide-react";
import { MobileNav } from "./mobile-nav";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home
  },
  {
    title: "Chatbots",
    href: "/bot/new",
    icon: Bot
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart
  },
  {
    title: "Prompt Lab",
    href: "/prompt-lab",
    icon: Wand2
  },
  {
    title: "Documentation",
    href: "/docs",
    icon: BookOpen
  },
  {
    title: "System Health",
    href: "/health",
    icon: Activity
  }
];

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <MobileNav items={navigationItems} />

        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                <Bot className="mr-2 h-4 w-4" />
                Chatbots
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 w-[400px]">
                  <li className="row-span-3">
                    <Link href="/bot/new">
                      <NavigationMenuLink className={cn(
                        "flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md transition-all hover:bg-muted/80",
                      )}>
                        <Bot className="h-6 w-6 mb-2" />
                        <div className="mb-2 mt-4 text-lg font-medium">
                          Criar Novo Chatbot
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Configure um novo assistente virtual para interagir com seus usuários
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                  <li>
                    <Link href="/bot/knowledge">
                      <NavigationMenuLink className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      )}>
                        <div className="text-sm font-medium leading-none">Base de Conhecimento</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Gerencie os documentos e informações dos seus chatbots
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                <Activity className="mr-2 h-4 w-4" />
                Sistema
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:grid-cols-2">
                  <li>
                    <Link href="/health">
                      <NavigationMenuLink className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      )}>
                        <div className="text-sm font-medium leading-none">Sistema</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Monitore a saúde e desempenho do sistema
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin">
                      <NavigationMenuLink className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      )}>
                        <div className="text-sm font-medium leading-none">Administração</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Configurações gerais do sistema
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center space-x-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <Settings2 className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}