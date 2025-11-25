import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { format } from "date-fns";

interface ChangeRequestDetailsViewProps {
  change: any;
  onClose: () => void;
}

export const ChangeRequestDetailsView = ({ change, onClose }: ChangeRequestDetailsViewProps) => {
  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    submitted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <div className="bg-background border rounded-lg animate-fade-in overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{change.change_number}</h3>
          <Badge className={statusColors[change.status] || ""} variant="secondary">
            {change.status}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title */}
        <div>
          <h4 className="font-medium text-base">{change.title}</h4>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Risk Level</span>
            <Badge variant="outline" className="capitalize text-xs h-5">
              {change.risk}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Impact</span>
            <Badge variant="outline" className="capitalize text-xs h-5">
              {change.impact}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span className="font-medium">
              {format(new Date(change.created_at), "MMM d, yyyy")}
            </span>
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div>
          <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Description</h5>
          <p className="text-sm">{change.description}</p>
        </div>

        {change.implementation_plan && (
          <>
            <Separator />
            <div>
              <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Implementation Plan</h5>
              <p className="text-sm whitespace-pre-wrap">{change.implementation_plan}</p>
            </div>
          </>
        )}

        {change.backout_plan && (
          <>
            <Separator />
            <div>
              <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Backout Plan</h5>
              <p className="text-sm whitespace-pre-wrap">{change.backout_plan}</p>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            Add Comment
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Update Status
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Schedule Change
          </Button>
          <Button variant="outline" size="sm">
            Cancel Change
          </Button>
        </div>
      </div>
    </div>
  );
};
