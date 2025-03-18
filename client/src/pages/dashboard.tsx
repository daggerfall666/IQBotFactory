import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, Check, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

interface Analytics {
  totalInteractions: number;
  successfulInteractions: number;
  averageResponseTime: number;
  totalTokensUsed: number;
  usageByDay: { date: string; interactions: number }[];
}

export default function Dashboard() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery<Analytics>({
    queryKey: [`/api/analytics/${id}`],
    refetchInterval: 30000,
    retry: 1,
    onError: (err) => {
      console.error("Error fetching analytics:", err);
      toast({
        title: "Error",
        description: "Could not load statistics",
        variant: "destructive"
      });
    }
  });

  const { data: bot, isLoading: botLoading, error: botError } = useQuery({
    queryKey: [`/api/chatbots/${id}`],
    retry: 1
  });

  const isLoading = analyticsLoading || botLoading;
  const error = analyticsError || botError;

  if (error) {
    return (
      <div className="responsive-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading statistics</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !analytics) {
    return (
      <div className="responsive-container flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading statistics...</p>
      </div>
    );
  }

  const successRate = (analytics.successfulInteractions / analytics.totalInteractions) * 100 || 0;

  return (
    <div className="responsive-container py-8">
      <div className="adaptive-flex mb-8">
        <Button variant="ghost" onClick={() => navigate(`/bot/${id}`)}>
          <ArrowLeft className="button-icon" />
          Back to Settings
        </Button>
        <h1 className="text-3xl font-bold">Dashboard - {bot?.name}</h1>
      </div>

      <div className="stats-grid mb-8">
        <Card className="adaptive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalInteractions}</div>
            <p className="text-xs text-muted-foreground">
              Messages exchanged with users
            </p>
          </CardContent>
        </Card>

        <Card className="adaptive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Successful interactions
            </p>
          </CardContent>
        </Card>

        <Card className="adaptive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card className="adaptive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTokensUsed}</div>
            <p className="text-xs text-muted-foreground">
              Total tokens consumed
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="adaptive-card">
        <CardHeader>
          <CardTitle>Daily Usage</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[350px]">
            {analytics.usageByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analytics.usageByDay}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 10,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="interactions"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}