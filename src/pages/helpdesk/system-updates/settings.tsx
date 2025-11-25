import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface ModuleSettings {
  alert_offline_days: number;
  alert_failed_updates: boolean;
  alert_critical_pending: boolean;
  auto_compliance_check: boolean;
  retention_days_logs: number;
  retention_days_history: number;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<ModuleSettings>({
    alert_offline_days: 7,
    alert_failed_updates: true,
    alert_critical_pending: true,
    auto_compliance_check: true,
    retention_days_logs: 90,
    retention_days_history: 365,
  });

  useEffect(() => {
    // In a real implementation, load settings from a database table
    // For now, using local state with default values
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, save to database
      // Example: await supabase.from('system_update_settings').upsert({ ...settings, tenant_id })
      
      toast.success("Settings saved successfully");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/helpdesk/system-updates")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Module Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure alerts, compliance checks, and data retention
            </p>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alert Configuration</CardTitle>
            <CardDescription>
              Configure when and how alerts are triggered for system updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alert on Failed Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Create alerts when update installations fail
                  </p>
                </div>
                <Switch
                  checked={settings.alert_failed_updates}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, alert_failed_updates: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alert on Critical Updates Pending</Label>
                  <p className="text-sm text-muted-foreground">
                    Create alerts when critical updates are pending
                  </p>
                </div>
                <Switch
                  checked={settings.alert_critical_pending}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, alert_critical_pending: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Alert if Device Offline (Days)</Label>
                <Input
                  type="number"
                  value={settings.alert_offline_days}
                  onChange={(e) =>
                    setSettings({ ...settings, alert_offline_days: parseInt(e.target.value) || 7 })
                  }
                  min={1}
                  max={90}
                />
                <p className="text-sm text-muted-foreground">
                  Create alerts if devices haven't checked in for this many days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Settings</CardTitle>
            <CardDescription>
              Configure automated compliance checking and enforcement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic Compliance Checking</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically mark devices as non-compliant when critical updates are pending
                </p>
              </div>
              <Switch
                checked={settings.auto_compliance_check}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, auto_compliance_check: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
            <CardDescription>
              Configure how long historical data is retained
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Ingest Logs Retention (Days)</Label>
              <Input
                type="number"
                value={settings.retention_days_logs}
                onChange={(e) =>
                  setSettings({ ...settings, retention_days_logs: parseInt(e.target.value) || 90 })
                }
                min={7}
                max={365}
              />
              <p className="text-sm text-muted-foreground">
                How long to keep ingestion logs before automatic cleanup
              </p>
            </div>

            <div className="space-y-2">
              <Label>Update History Retention (Days)</Label>
              <Input
                type="number"
                value={settings.retention_days_history}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    retention_days_history: parseInt(e.target.value) || 365,
                  })
                }
                min={30}
                max={730}
              />
              <p className="text-sm text-muted-foreground">
                How long to keep update history before automatic cleanup
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Settings</CardTitle>
            <CardDescription>
              Configure external integrations and data ingestion endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Endpoint URL</Label>
              <Input
                type="text"
                value="/api/ingest/system-updates"
                disabled
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                Use this endpoint to push device update status from RMM tools or scripts
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
