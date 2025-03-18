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
import {
  StatCardSkeleton,
  ChartSkeleton,
  SystemResourcesSkeleton
} from "@/components/skeletons/analytics-skeleton";
import { useWebSocketMetrics } from "@/hooks/use-websocket-metrics";
import { CustomTooltip } from "@/components/custom-tooltip";
import { motion } from "framer-motion";

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

const StatCard = ({ title, value, subtitle, icon: Icon }: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<any>;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  </motion.div>
);

export default function Analytics() {
  const { data: chatbots = [], isLoading: isLoadingBots } = useQuery<ChatbotWithStats[]>({
    queryKey: ["/api/chatbots"],
  });

  const { metrics: systemHealth, error: wsError } = useWebSocketMetrics();
  const isLoadingHealth = !systemHealth && !wsError;

  const isInitialLoading = isLoadingBots && isLoadingHealth;

  if (isInitialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingAnimation message="Loading analytics dashboard..." />
        </div>
      </Layout>
    );
  }

  const totalInteractions = chatbots.reduce((acc, bot) => {
    return acc + (bot.analytics?.totalInteractions || 0);
  }, 0);

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
          {isLoadingBots ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Active Chatbots"
                value={chatbots.length}
                subtitle="Total deployed assistants"
                icon={Bot}
              />
              <StatCard
                title="Total Interactions"
                value={totalInteractions}
                subtitle="Messages processed"
                icon={MessageSquare}
              />
              <StatCard
                title="System Health"
                value={systemHealth && systemHealth.errorRate !== undefined
                  ? `${(100 - systemHealth.errorRate).toFixed(1)}%`
                  : "N/A"}
                subtitle="System reliability"
                icon={Activity}
              />
              <StatCard
                title="Response Time"
                value={systemHealth?.averageResponseTime
                  ? `${Math.round(systemHealth.averageResponseTime)}ms`
                  : "N/A"}
                subtitle="Average response time"
                icon={Clock}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoadingBots ? (
            <>
              <ChartSkeleton />
              <SystemResourcesSkeleton />
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
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
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar
                              dataKey="interactions"
                              name="Total Interactions"
                              fill="hsl(var(--primary))"
                              radius={[4, 4, 0, 0]}
                              cursor="pointer"
                            />
                            <Bar
                              dataKey="successRate"
                              name="Success Rate (%)"
                              fill="hsl(var(--primary)/0.5)"
                              radius={[4, 4, 0, 0]}
                              cursor="pointer"
                            />
                            <Bar
                              dataKey="responseTime"
                              name="Avg Response Time (ms)"
                              fill="hsl(var(--primary)/0.75)"
                              radius={[4, 4, 0, 0]}
                              cursor="pointer"
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
              </motion.div>

              {isLoadingHealth ? (
                <SystemResourcesSkeleton />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="transition-all hover:shadow-lg">
                    <CardHeader>
                      <CardTitle>System Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px]">
                        {systemHealth ? (
                          <div className="grid grid-cols-2 gap-4 h-full place-content-center">
                            {[
                              {
                                label: "CPU Usage",
                                value: `${systemHealth.cpuUsage.toFixed(1)}%`,
                              },
                              {
                                label: "Memory",
                                value: `${Math.round(systemHealth.memoryUsage / 1024 / 1024)} MB`,
                              },
                              {
                                label: "Uptime",
                                value: `${Math.floor(systemHealth.uptime / 3600)}h ${Math.floor((systemHealth.uptime % 3600) / 60)}m`,
                              },
                              {
                                label: "Error Rate",
                                value: `${systemHealth.errorRate.toFixed(1)}%`,
                              },
                            ].map((item, index) => (
                              <motion.div
                                key={item.label}
                                className="space-y-2"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                <p className="text-sm font-medium">{item.label}</p>
                                <div className="text-2xl font-bold">
                                  {item.value}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground">No data available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}