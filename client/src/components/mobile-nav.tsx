import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  items?: {
    title: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

export function MobileNav({ items }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-1">
          {items?.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-lg font-normal"
              >
                {item.icon && (
                  <item.icon className="h-5 w-5" />
                )}
                {item.title}
              </Button>
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
