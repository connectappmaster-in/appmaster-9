import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganisation } from "@/contexts/OrganisationContext";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const AssignAsset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { organisation } = useOrganisation();
  const queryClient = useQueryClient();

  const preselectedAssetId = searchParams.get("assetId");

  const [formData, setFormData] = useState({
    asset_id: preselectedAssetId || "",
    user_id: "",
    expected_return_at: "",
    notes: "",
  });

  // Fetch available assets
  const { data: assets = [] } = useQuery({
    queryKey: ["itam-available-assets", organisation?.id],
    queryFn: async () => {
      if (!organisation?.id) return [];
      const { data } = await supabase
        .from("itam_assets")
        .select("*")
        .eq("organisation_id", organisation.id)
        .eq("status", "available")
        .eq("is_deleted", false);
      return data || [];
    },
    enabled: !!organisation?.id,
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ["org-users", organisation?.id],
    queryFn: async () => {
      if (!organisation?.id) return [];
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("organisation_id", organisation.id)
        .eq("status", "active");
      return data || [];
    },
    enabled: !!organisation?.id,
  });

  // Assign asset mutation
  const assignAsset = useMutation({
    mutationFn: async (assignmentData: any) => {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) throw new Error("Not authenticated");

      // Create assignment record
      const { error: assignmentError } = await supabase
        .from("itam_asset_assignments")
        .insert({
          asset_id: parseInt(assignmentData.asset_id),
          user_id: assignmentData.user_id,
          assigned_by: currentUser.id,
          expected_return_at: assignmentData.expected_return_at || null,
          notes: assignmentData.notes || null,
          tenant_id: 1,
        });

      if (assignmentError) throw assignmentError;

      // Update asset status
      const { error: updateError } = await supabase
        .from("itam_assets")
        .update({
          status: "assigned",
          assigned_to: assignmentData.user_id,
          assigned_date: new Date().toISOString(),
          updated_by: currentUser.id,
        })
        .eq("id", assignmentData.asset_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itam-assets"] });
      queryClient.invalidateQueries({ queryKey: ["itam-asset-assignments"] });
      toast.success("Asset assigned successfully");
      navigate("/helpdesk/assets/list");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign asset");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.asset_id || !formData.user_id) {
      toast.error("Please select an asset and user");
      return;
    }

    assignAsset.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">Assign Asset</h1>
            <p className="text-sm text-muted-foreground">
              Assign an asset to a user
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
              <CardDescription>
                Select an asset and user to create the assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="asset_id">
                  Asset <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.asset_id}
                  onValueChange={(value) => setFormData({ ...formData, asset_id: value })}
                  disabled={!!preselectedAssetId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id.toString()}>
                        {asset.asset_tag} - {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assets.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No available assets. All assets are either assigned or unavailable.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_id">
                  Assign To <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_return_at">Expected Return Date</Label>
                <Input
                  id="expected_return_at"
                  type="date"
                  value={formData.expected_return_at}
                  onChange={(e) =>
                    setFormData({ ...formData, expected_return_at: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information about this assignment..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end mt-6">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={assignAsset.isPending}>
              {assignAsset.isPending ? "Assigning..." : "Assign Asset"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignAsset;
