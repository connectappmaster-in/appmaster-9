import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

interface InlineChangeRequestFormProps {
  onSuccess: (change: any) => void;
  onCancel: () => void;
}

export const InlineChangeRequestForm = ({ onSuccess, onCancel }: InlineChangeRequestFormProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    risk: "low",
    impact: "low",
    implementation_plan: "",
    backout_plan: "",
  });

  const createChange = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: userData } = await supabase
        .from("users")
        .select("organisation_id")
        .eq("auth_user_id", user.id)
        .single();

      const { data: profileData } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      const tenantId = profileData?.tenant_id || 1;
      const changeNumber = `CHG-${Date.now().toString().slice(-6)}`;

      const { data: newChange, error } = await supabase
        .from("change_requests")
        .insert({
          change_number: changeNumber,
          title: data.title,
          description: data.description,
          risk: data.risk,
          impact: data.impact,
          implementation_plan: data.implementation_plan,
          backout_plan: data.backout_plan,
          status: "draft",
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      return newChange;
    },
    onSuccess: (data) => {
      toast.success("Change request created successfully");
      onSuccess(data);
    },
    onError: (error: any) => {
      toast.error("Failed to create change request: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    createChange.mutate(formData);
  };

  return (
    <div className="bg-background border rounded-lg p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Create New Change Request</h3>
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Brief description of the change"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            placeholder="Detailed description of the change"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="risk">Risk Level</Label>
            <Select
              value={formData.risk}
              onValueChange={(val) => setFormData({ ...formData, risk: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="impact">Impact</Label>
            <Select
              value={formData.impact}
              onValueChange={(val) => setFormData({ ...formData, impact: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="implementation_plan">Implementation Plan</Label>
          <Textarea
            id="implementation_plan"
            value={formData.implementation_plan}
            onChange={(e) => setFormData({ ...formData, implementation_plan: e.target.value })}
            rows={3}
            placeholder="Steps to implement this change..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="backout_plan">Backout Plan</Label>
          <Textarea
            id="backout_plan"
            value={formData.backout_plan}
            onChange={(e) => setFormData({ ...formData, backout_plan: e.target.value })}
            rows={3}
            placeholder="Steps to rollback if needed..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={createChange.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={createChange.isPending}>
            {createChange.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Change
          </Button>
        </div>
      </form>
    </div>
  );
};
