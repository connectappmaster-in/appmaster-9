import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface WarrantyTabProps {
  assetId: number;
}

export const WarrantyTab = ({ assetId }: WarrantyTabProps) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    warranty_start: "",
    warranty_end: "",
    amc_start: "",
    amc_end: "",
    notes: ""
  });

  const { data: warranty, isLoading } = useQuery({
    queryKey: ["asset-warranty", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_warranties")
        .select("*")
        .eq("asset_id", assetId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setFormData({
          warranty_start: data.warranty_start || "",
          warranty_end: data.warranty_end || "",
          amc_start: data.amc_start || "",
          amc_end: data.amc_end || "",
          notes: data.notes || ""
        });
      }
      
      return data;
    }
  });

  const saveWarranty = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      if (warranty?.id) {
        const { error } = await supabase
          .from("asset_warranties")
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq("id", warranty.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("asset_warranties")
          .insert({
            tenant_id: profile.tenant_id,
            asset_id: assetId,
            ...data
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Warranty information saved");
      queryClient.invalidateQueries({ queryKey: ["asset-warranty", assetId] });
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Failed to save warranty information");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveWarranty.mutate(formData);
  };

  const getExpiryWarning = (endDate: string | null) => {
    if (!endDate) return null;
    const days = differenceInDays(new Date(endDate), new Date());
    if (days < 0) return { message: "Expired", color: "text-destructive" };
    if (days <= 30) return { message: `Expires in ${days} days`, color: "text-orange-500" };
    return null;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading warranty info...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Warranty Information</CardTitle>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warranty_start">Warranty Start</Label>
                  <Input
                    id="warranty_start"
                    type="date"
                    value={formData.warranty_start}
                    onChange={(e) => setFormData({ ...formData, warranty_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty_end">Warranty End</Label>
                  <Input
                    id="warranty_end"
                    type="date"
                    value={formData.warranty_end}
                    onChange={(e) => setFormData({ ...formData, warranty_end: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amc_start">AMC Start</Label>
                  <Input
                    id="amc_start"
                    type="date"
                    value={formData.amc_start}
                    onChange={(e) => setFormData({ ...formData, amc_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amc_end">AMC End</Label>
                  <Input
                    id="amc_end"
                    type="date"
                    value={formData.amc_end}
                    onChange={(e) => setFormData({ ...formData, amc_end: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saveWarranty.isPending}>
                  {saveWarranty.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    if (warranty) {
                      setFormData({
                        warranty_start: warranty.warranty_start || "",
                        warranty_end: warranty.warranty_end || "",
                        amc_start: warranty.amc_start || "",
                        amc_end: warranty.amc_end || "",
                        notes: warranty.notes || ""
                      });
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Warranty Start</p>
                  <p className="font-medium">
                    {warranty?.warranty_start ? format(new Date(warranty.warranty_start), "dd/MM/yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warranty End</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {warranty?.warranty_end ? format(new Date(warranty.warranty_end), "dd/MM/yyyy") : "N/A"}
                    </p>
                    {warranty?.warranty_end && getExpiryWarning(warranty.warranty_end) && (
                      <span className={`text-sm flex items-center gap-1 ${getExpiryWarning(warranty.warranty_end)?.color}`}>
                        <AlertTriangle className="h-4 w-4" />
                        {getExpiryWarning(warranty.warranty_end)?.message}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AMC Start</p>
                  <p className="font-medium">
                    {warranty?.amc_start ? format(new Date(warranty.amc_start), "dd/MM/yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AMC End</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {warranty?.amc_end ? format(new Date(warranty.amc_end), "dd/MM/yyyy") : "N/A"}
                    </p>
                    {warranty?.amc_end && getExpiryWarning(warranty.amc_end) && (
                      <span className={`text-sm flex items-center gap-1 ${getExpiryWarning(warranty.amc_end)?.color}`}>
                        <AlertTriangle className="h-4 w-4" />
                        {getExpiryWarning(warranty.amc_end)?.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {warranty?.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium whitespace-pre-wrap">{warranty.notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
