import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { 
  BarChart3, 
  MessageSquare, 
  Check, 
  Clock, 
  Zap, 
  Bot,
  Users,
  Activity
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend 
} from "recharts";
import type { Chatbot } from "@shared/schema";

interface SystemAnalytics {
  totalRequests: number;
  errorRate: number;
  averageResponseTime: number;
  activeUsers: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
}

interface ChatbotAnalytics {
  totalInteractions: number;
  successRate: number;
  averageResponseTime: number;
  totalTokensUsed: number;
  usageByDay: { date: string; interactions: number }[];
}

interface BotWithAnalytics extends Chatbot {
  analytics?: ChatbotAnalytics;
}

export default function Analytics() {
  const { data: chatbots = [], isLoading: isLoadingBots } = useQuery<BotWithAnalytics[]>({
    queryKey: ["/api/chatbots"],
  });

  const { data: systemHealth, isLoading: isLoadingHealth } = useQuery<SystemAnalytics>({
    queryKey: ["/api/system/health"],
    refetchInterval: 30000,
  });

  const isLoading = isLoadingBots || isLoadingHealth;

  // Calculate total interactions across all chatbots
  const totalInteractions = chatbots.reduce((acc, bot) => {
    return acc + (bot.analytics?.totalInteractions || 0);
  }, 0);

  // Prepare data for the usage chart
  const usageData = chatbots.map(bot => ({
    name: bot.name,
    interactions: bot.analytics?.totalInteractions || 0,
    successRate: bot.analytics?.successRate || 0,
    responseTime: bot.analytics?.averageResponseTime || 0
  }));

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
          <BarChart3 className="h-16 w-16 animate-bounce text-primary/60" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Analytics Overview
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Monitor your chatbots performance and system health
          </p>
        </div>

        {/* System Health Section */}
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
                {systemHealth && typeof systemHealth.errorRate === 'number'
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

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Chatbot Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {usageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usageData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="interactions"
                        name="Interactions"
                        fill="hsl(var(--primary))"
                      />
                      <Bar
                        dataKey="successRate"
                        name="Success Rate (%)"
                        fill="hsl(var(--primary)/0.5)"
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
              <CardTitle>Response Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {usageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="responseTime"
                        name="Avg. Response Time (ms)"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
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

        {/* System Resources */}
        {systemHealth && (
          <Card>
            <CardHeader>
              <CardTitle>System Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium">CPU Usage</p>
                  <div className="text-2xl font-bold">
                    {typeof systemHealth.cpuUsage === 'number' 
                      ? `${systemHealth.cpuUsage.toFixed(1)}%`
                      : 'N/A'}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Memory Usage</p>
                  <div className="text-2xl font-bold">
                    {typeof systemHealth.memoryUsage === 'number'
                      ? `${Math.round(systemHealth.memoryUsage / 1024 / 1024)} MB`
                      : 'N/A'}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uptime</p>
                  <div className="text-2xl font-bold">
                    {typeof systemHealth.uptime === 'number'
                      ? `${Math.floor(systemHealth.uptime / 3600)}h ${Math.floor((systemHealth.uptime % 3600) / 60)}m`
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}