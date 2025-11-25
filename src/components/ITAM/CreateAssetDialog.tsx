import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const assetSchema = z.object({
  asset_id: z.string().min(1, "Asset ID is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  description: z.string().optional(),
  asset_configuration: z.string().optional(),
  purchase_date: z.string().min(1, "Purchase date is required"),
  cost: z.string().min(1, "Cost is required"),
  serial_number: z.string().optional(),
  purchased_from: z.string().optional(),
  classification: z.string().optional(),
  site: z.string().optional(),
  location: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  department: z.string().optional(),
  photo_url: z.string().optional(),
});

interface CreateAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateAssetDialog = ({ open, onOpenChange }: CreateAssetDialogProps) => {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      asset_id: "",
      brand: "",
      model: "",
      description: "",
      asset_configuration: "",
      purchase_date: "",
      cost: "",
      serial_number: "",
      purchased_from: "",
      classification: "Internal",
      site: "",
      location: "",
      category: "",
      department: "",
      photo_url: "",
    },
  });

  const createAsset = useMutation({
    mutationFn: async (values: z.infer<typeof assetSchema>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: userData } = await supabase
        .from("users")
        .select("id, organisation_id")
        .eq("auth_user_id", user.id)
        .single();

      const { data: profileData } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      // Generate asset tag from asset_id or auto-generate
      const assetTag = values.asset_id || `AST-${Date.now().toString().slice(-6)}`;

      const assetData = {
        asset_id: values.asset_id,
        asset_tag: assetTag,
        brand: values.brand,
        model: values.model,
        type: values.category,
        name: `${values.brand} ${values.model}`,
        description: values.description || null,
        asset_configuration: values.asset_configuration || null,
        purchase_date: values.purchase_date,
        cost: parseFloat(values.cost),
        serial_number: values.serial_number || null,
        purchased_from: values.purchased_from || null,
        classification: values.classification || "Internal",
        site: values.site || null,
        location: values.location || null,
        category: values.category,
        department: values.department || null,
        photo_url: values.photo_url || null,
        status: "available",
        created_by: userData?.id,
        organisation_id: userData?.organisation_id,
        tenant_id: profileData?.tenant_id || 1,
      };

      const { data, error } = await supabase
        .from("itam_assets")
        .insert([assetData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Asset created successfully");
      // Invalidate all asset-related queries
      queryClient.invalidateQueries({ queryKey: ["itam-assets-list"] });
      queryClient.invalidateQueries({ queryKey: ["assets-count"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["itam-stats"] });
      queryClient.invalidateQueries({ queryKey: ["itam-assets"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to create asset: " + error.message);
    },
  });

  const onSubmit = (values: z.infer<typeof assetSchema>) => {
    createAsset.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {/* Basic Info Section */}
            <div>
              <h3 className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase">Basic Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="asset_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Asset ID *</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Make *</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Model *</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Description</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="asset_configuration"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs">Asset Configuration</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Purchase Section */}
            <div>
              <h3 className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase">Purchase</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="purchase_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Purchase Date *</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Cost (₹) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serial_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Serial No</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchased_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Purchased From</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Classification Section */}
            <div>
              <h3 className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase">Classification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="classification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Asset Classification</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Confidential">Confidential</SelectItem>
                          <SelectItem value="Internal">Internal</SelectItem>
                          <SelectItem value="Public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Organization Section */}
            <div>
              <h3 className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase">Organization</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="site"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Site</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Location</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Category *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Laptop">Laptop</SelectItem>
                          <SelectItem value="Desktop">Desktop</SelectItem>
                          <SelectItem value="Monitor">Monitor</SelectItem>
                          <SelectItem value="Printer">Printer</SelectItem>
                          <SelectItem value="Phone">Phone</SelectItem>
                          <SelectItem value="Tablet">Tablet</SelectItem>
                          <SelectItem value="Server">Server</SelectItem>
                          <SelectItem value="Network Device">Network Device</SelectItem>
                          <SelectItem value="Furniture">Furniture</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Department</FormLabel>
                      <FormControl>
                        <Input className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Photo Section */}
            <div>
              <h3 className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase">Photo (Optional)</h3>
              <FormField
                control={form.control}
                name="photo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Add Image</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        className="h-8"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={createAsset.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createAsset.isPending}>
                {createAsset.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Asset
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
