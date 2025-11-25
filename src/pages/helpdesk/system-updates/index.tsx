import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Server,
  Shield,
  TrendingUp,
  Settings,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalDevices: number;
  compliantDevices: number;
  nonCompliantDevices: number;
  offlineDevices: number;
  pendingCritical: number;
  pendingTotal: number;
  failedUpdates: number;
  activeAlerts: number;
}

export default function SystemUpdatesDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalDevices: 0,
    compliantDevices: 0,
    nonCompliantDevices: 0,
    offlineDevices: 0,
    pendingCritical: 0,
    pendingTotal: 0,
    failedUpdates: 0,
    activeAlerts: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch devices
      const { data: devices } = await supabase
        .from("system_devices")
        .select("*")
        .eq("is_deleted", false);

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const totalDevices = devices?.length || 0;
      const compliantDevices =
        devices?.filter((d) => d.update_compliance_status === "compliant").length || 0;
      const nonCompliantDevices =
        devices?.filter((d) => d.update_compliance_status === "non_compliant").length || 0;
      const offlineDevices =
        devices?.filter((d) => !d.last_seen || new Date(d.last_seen) < sevenDaysAgo).length || 0;

      const pendingCritical =
        devices?.reduce((sum, d) => sum + (d.pending_critical_count || 0), 0) || 0;
      const pendingTotal = devices?.reduce((sum, d) => sum + (d.pending_total_count || 0), 0) || 0;
      const failedUpdates =
        devices?.reduce((sum, d) => sum + (d.failed_updates_count || 0), 0) || 0;

      // Fetch active alerts
      const { data: alerts } = await supabase
        .from("system_update_alerts")
        .select("id")
        .eq("resolved", false);

      const activeAlerts = alerts?.length || 0;

      setStats({
        totalDevices,
        compliantDevices,
        nonCompliantDevices,
        offlineDevices,
        pendingCritical,
        pendingTotal,
        failedUpdates,
        activeAlerts,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const complianceData = [
    { name: "Compliant", value: stats.compliantDevices, fill: "hsl(var(--primary))" },
    { name: "Non-Compliant", value: stats.nonCompliantDevices, fill: "hsl(var(--destructive))" },
    { name: "Offline", value: stats.offlineDevices, fill: "hsl(var(--muted))" },
  ];

  const complianceRate =
    stats.totalDevices > 0
      ? Math.round((stats.compliantDevices / stats.totalDevices) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Updates Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor Windows/OS update compliance across your organization
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/helpdesk/system-updates/settings")}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => navigate("/helpdesk/system-updates/devices")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDevices}</div>
              <p className="text-xs text-muted-foreground">Managed devices</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => navigate("/helpdesk/system-updates/devices?filter=compliant")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{complianceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.compliantDevices} of {stats.totalDevices} devices
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => navigate("/helpdesk/system-updates/devices?filter=pending")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.pendingCritical}</div>
              <p className="text-xs text-muted-foreground">{stats.pendingTotal} total pending</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => navigate("/helpdesk/system-updates/alerts")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeAlerts}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => navigate("/helpdesk/system-updates/devices")}
          >
            <CardHeader>
              <CardTitle className="text-base">View All Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage device inventory and compliance status
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => navigate("/helpdesk/system-updates/updates")}
          >
            <CardHeader>
              <CardTitle className="text-base">Browse Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View available KB updates and patch information
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => navigate("/helpdesk/system-updates/reports")}
          >
            <CardHeader>
              <CardTitle className="text-base">Generate Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Export compliance and update aging reports
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
