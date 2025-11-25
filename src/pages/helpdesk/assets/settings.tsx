import { BackButton } from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const AssetSettings = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">ITAM Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure IT Asset Management module
            </p>
          </div>
        </div>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">General Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-generate Asset Tags</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically create unique tags for new assets
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Warranty Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications for expiring warranties
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-2">
              <Label>Warranty Alert Days (Before Expiry)</Label>
              <Input type="number" defaultValue="30" className="w-32" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>License Utilization Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Alert when license usage exceeds threshold
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-2">
              <Label>License Alert Threshold (%)</Label>
              <Input type="number" defaultValue="85" className="w-32" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Default Values</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Input defaultValue="INR" />
            </div>
            <div className="space-y-2">
              <Label>Default Location</Label>
              <Input placeholder="Office Location" />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button>Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

export default AssetSettings;
