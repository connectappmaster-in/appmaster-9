import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface DetailsTabProps {
  asset: any;
}

export const DetailsTab = ({ asset }: DetailsTabProps) => {
  return (
    <div className="space-y-6">
      {/* Asset Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asset Details</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-sm font-semibold mb-3">Miscellaneous</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-muted-foreground">Serial No</p>
              <p className="text-sm font-medium">{asset.serial_number || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-muted-foreground">Purchased from</p>
              <p className="text-sm font-medium text-primary hover:underline cursor-pointer">
                {asset.purchased_from || '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-muted-foreground">Asset Configuration</p>
                <p className="text-sm">{asset.asset_configuration || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-muted-foreground">Asset Classification</p>
                <p className="text-sm">{asset.classification || 'Internal'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-muted-foreground">Mouse</p>
                <p className="text-sm">—</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-muted-foreground">Keyboard</p>
                <p className="text-sm">—</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-muted-foreground">Headphone</p>
                <p className="text-sm">—</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check-out Details */}
      {asset.assigned_to && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Check out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-muted-foreground">Assigned to</p>
                <p className="text-sm font-medium text-primary hover:underline cursor-pointer">
                  {asset.assigned_to}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-muted-foreground">Check-out Notes</p>
                <p className="text-sm">{asset.checkout_notes || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-muted-foreground">Check-out Date</p>
                <p className="text-sm">{asset.checkout_date ? format(new Date(asset.checkout_date), "dd/MM/yyyy") : '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-sm text-muted-foreground">Due date</p>
                <p className="text-sm">{asset.due_date ? format(new Date(asset.due_date), "dd/MM/yyyy") : 'No due date'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Creation Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Creation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-muted-foreground">Date Created</p>
              <p className="text-sm">
                {asset.created_at ? format(new Date(asset.created_at), "dd/MM/yyyy HH:mm a") : '—'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-muted-foreground">Created by</p>
              <p className="text-sm font-medium text-primary hover:underline cursor-pointer">
                {asset.created_by || '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
