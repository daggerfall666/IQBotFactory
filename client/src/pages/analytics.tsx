import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { 
  BarChart3, 
  MessageSquare, 
  Check, 
  Clock, 
  Activity,
  Bot
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend 
} from "recharts";
import type { Chatbot } from "@shared/schema";
import { LoadingAnimation } from "@/components/loading-animation";

interface SystemHealth {
  totalRequests: number;
  errorRate: number;
  averageResponseTime: number;
  activeUsers: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
}

interface ChatbotWithStats extends Chatbot {
  analytics?: {
    totalInteractions: number;
    successRate: number;
    averageResponseTime: number;
  };
}

export default function Analytics() {
  const { data: chatbots = [], isLoading: isLoadingBots } = useQuery<ChatbotWithStats[]>({
    queryKey: ["/api/chatbots"],
  });

  const { data: systemHealth, isLoading: isLoadingHealth } = useQuery<SystemHealth>({
    queryKey: ["/api/system/health"],
    refetchInterval: 30000,
  });

  const isLoading = isLoadingBots || isLoadingHealth;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingAnimation 
            message={
              isLoadingBots && isLoadingHealth
                ? "Loading analytics dashboard..."
                : isLoadingBots
                ? "Fetching chatbot statistics..."
                : "Loading system health metrics..."
            } 
          />
        </div>
      </Layout>
    );
  }

  // Calculate total interactions
  const totalInteractions = chatbots.reduce((acc, bot) => {
    return acc + (bot.analytics?.totalInteractions || 0);
  }, 0);

  // Prepare data for charts
  const botPerformanceData = chatbots.map(bot => ({
    name: bot.name,
    interactions: bot.analytics?.totalInteractions || 0,
    successRate: bot.analytics?.successRate || 0,
    responseTime: bot.analytics?.averageResponseTime || 0
  }));

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Analytics Overview
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor your chatbots performance and system health
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                Active Chatbots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chatbots.length}</div>
              <p className="text-xs text-muted-foreground">
                Total deployed assistants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Total Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInteractions}</div>
              <p className="text-xs text-muted-foreground">
                Messages processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemHealth && systemHealth.errorRate !== undefined
                  ? `${(100 - systemHealth.errorRate).toFixed(1)}%`
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                System reliability
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemHealth?.averageResponseTime
                  ? `${Math.round(systemHealth.averageResponseTime)}ms`
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                Average response time
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Chatbot Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {botPerformanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={botPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="interactions"
                        name="Total Interactions"
                        fill="hsl(var(--primary))"
                      />
                      <Bar
                        dataKey="successRate"
                        name="Success Rate (%)"
                        fill="hsl(var(--primary)/0.5)"
                      />
                      <Bar
                        dataKey="responseTime"
                        name="Avg Response Time (ms)"
                        fill="hsl(var(--primary)/0.75)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {systemHealth ? (
                  <div className="grid grid-cols-2 gap-4 h-full place-content-center">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">CPU Usage</p>
                      <div className="text-2xl font-bold">
                        {systemHealth.cpuUsage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Memory</p>
                      <div className="text-2xl font-bold">
                        {Math.round(systemHealth.memoryUsage / 1024 / 1024)} MB
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Uptime</p>
                      <div className="text-2xl font-bold">
                        {Math.floor(systemHealth.uptime / 3600)}h {Math.floor((systemHealth.uptime % 3600) / 60)}m
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Error Rate</p>
                      <div className="text-2xl font-bold">
                        {systemHealth.errorRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}