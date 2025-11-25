import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ReturnAsset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const preselectedAssetId = searchParams.get("assetId");

  const [formData, setFormData] = useState({
    asset_id: preselectedAssetId || "",
    return_condition: "good",
    notes: "",
    create_repair: false,
  });

  // Fetch assigned assets
  const { data: asset } = useQuery({
    queryKey: ["itam-asset-for-return", preselectedAssetId],
    queryFn: async () => {
      if (!preselectedAssetId) return null;
      const { data } = await supabase
        .from("itam_assets")
        .select("*")
        .eq("id", parseInt(preselectedAssetId))
        .single();
      return data;
    },
    enabled: !!preselectedAssetId,
  });

  // Get active assignment
  const { data: activeAssignment } = useQuery({
    queryKey: ["active-assignment", preselectedAssetId],
    queryFn: async () => {
      if (!preselectedAssetId) return null;
      const { data } = await supabase
        .from("itam_asset_assignments")
        .select("*")
        .eq("asset_id", parseInt(preselectedAssetId))
        .is("returned_at", null)
        .single();
      return data;
    },
    enabled: !!preselectedAssetId,
  });

  // Return asset mutation
  const returnAsset = useMutation({
    mutationFn: async (returnData: any) => {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) throw new Error("Not authenticated");

      // Update assignment record
      const { error: assignmentError } = await supabase
        .from("itam_asset_assignments")
        .update({
          returned_at: new Date().toISOString(),
          return_condition: returnData.return_condition,
          notes: returnData.notes || null,
        })
        .eq("asset_id", returnData.asset_id)
        .is("returned_at", null);

      if (assignmentError) throw assignmentError;

      // Determine new asset status
      let newStatus = "available";
      if (returnData.return_condition === "damaged" || returnData.create_repair) {
        newStatus = "in_repair";
      }

      // Update asset status
      const { error: updateError } = await supabase
        .from("itam_assets")
        .update({
          status: newStatus,
          assigned_to: null,
          assigned_date: null,
          updated_by: currentUser.id,
        })
        .eq("id", returnData.asset_id);

      if (updateError) throw updateError;

      // Create repair if needed
      if (returnData.create_repair) {
        const { error: repairError } = await supabase
          .from("itam_repairs")
          .insert({
            asset_id: parseInt(returnData.asset_id),
            issue_description: returnData.notes || "Asset returned in damaged condition",
            status: "pending",
            tenant_id: 1,
            created_by: currentUser.id,
          });

        if (repairError) throw repairError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itam-assets"] });
      queryClient.invalidateQueries({ queryKey: ["itam-asset-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["itam-repairs"] });
      toast.success("Asset returned successfully");
      navigate("/helpdesk/assets/list");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to return asset");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.asset_id) {
      toast.error("No asset selected");
      return;
    }

    returnAsset.mutate(formData);
  };

  if (!asset) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">Return Asset</h1>
            <p className="text-sm text-muted-foreground">
              Process asset return and check condition
            </p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Returning <strong>{asset.name}</strong> ({asset.asset_tag})
            {activeAssignment && (
              <span> from User ID: <strong>{activeAssignment.user_id}</strong></span>
            )}
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Return Details</CardTitle>
              <CardDescription>
                Inspect the asset and record its condition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>
                  Asset Condition <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={formData.return_condition}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      return_condition: value,
                      create_repair: value === "damaged",
                    });
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="good" id="good" />
                    <Label htmlFor="good" className="font-normal cursor-pointer">
                      Good - Asset is in working condition
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fair" id="fair" />
                    <Label htmlFor="fair" className="font-normal cursor-pointer">
                      Fair - Minor wear and tear
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="damaged" id="damaged" />
                    <Label htmlFor="damaged" className="font-normal cursor-pointer">
                      Damaged - Requires repair
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.return_condition === "damaged" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    A repair ticket will be automatically created for this asset.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional observations or issues with the asset..."
                  rows={5}
                />
                {formData.return_condition === "damaged" && (
                  <p className="text-sm text-muted-foreground">
                    Please describe the damage or issue in detail.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end mt-6">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={returnAsset.isPending}>
              {returnAsset.isPending ? "Processing..." : "Complete Return"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnAsset;
