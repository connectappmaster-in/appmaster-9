import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Plus, Calendar, User } from "lucide-react";

interface AuditTabProps {
  assetId: number;
}

export const AuditTab = ({ assetId }: AuditTabProps) => {
  // Mock data for now - will be connected to database later
  const audits = [
    {
      id: 1,
      audit_date: "2025-11-15",
      auditor: "John Doe",
      status: "passed",
      notes: "Asset verified and in good condition"
    }
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Record Audit
          </Button>

          {audits.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No audit records</div>
          ) : (
            <div className="space-y-2">
              {audits.map((audit) => (
                <div key={audit.id} className="p-2 border rounded">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Asset Audit</p>
                    </div>
                    <Badge variant={audit.status === 'passed' ? 'default' : 'destructive'} className="text-xs">
                      {audit.status}
                    </Badge>
                  </div>
                  <div className="ml-6 space-y-1">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {audit.audit_date}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {audit.auditor}
                      </div>
                    </div>
                    {audit.notes && (
                      <p className="text-xs text-muted-foreground">{audit.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
