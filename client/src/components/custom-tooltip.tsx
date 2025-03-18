import { Card } from "@/components/ui/card";

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload) return null;

  return (
    <Card className="bg-background/95 backdrop-blur-sm border shadow-lg p-3">
      <p className="font-medium mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">
              {entry.name}: {' '}
              <span className="font-medium text-foreground">
                {entry.name.includes('Rate') ? `${entry.value}%` :
                 entry.name.includes('Time') ? `${entry.value}ms` :
                 entry.value}
              </span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
