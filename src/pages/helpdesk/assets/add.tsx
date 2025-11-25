import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganisation } from "@/contexts/OrganisationContext";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

const AddAsset = () => {
  const navigate = useNavigate();
  const { organisation } = useOrganisation();
  const queryClient = useQueryClient();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
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
    status: "available"
  });

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/gif', 'image/png'].includes(file.type)) {
      toast.error("Invalid file type. Please upload JPG, GIF, or PNG.");
      return;
    }

    // Validate file size (500 KB = 512000 bytes)
    if (file.size > 512000) {
      toast.error("File size exceeds 500 KB. Please upload a smaller image.");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  // Create asset mutation
  const createAsset = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!organisation?.id) throw new Error("No organization");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      let photoUrl = null;

      // Upload photo if selected
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${profile.tenant_id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('asset-photos')
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('asset-photos')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      // Generate asset tag
      const assetTag = `AST-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      const { data: asset, error } = await supabase
        .from("itam_assets")
        .insert([{
          name: data.brand + " " + data.model,
          asset_tag: assetTag,
          asset_id: data.asset_id,
          brand: data.brand,
          model: data.model,
          description: data.description,
          asset_configuration: data.asset_configuration,
          serial_number: data.serial_number,
          purchase_date: data.purchase_date || null,
          cost: data.cost ? parseFloat(data.cost) : null,
          purchased_from: data.purchased_from,
          classification: data.classification,
          site: data.site,
          location: data.location,
          category: data.category,
          department: data.department,
          photo_url: photoUrl,
          status: data.status,
          tenant_id: profile.tenant_id,
          organisation_id: organisation.id,
          created_by: user.id,
          type: data.category || "Other"
        }])
        .select()
        .single();

      if (error) throw error;

      // Create asset event
      await supabase.from("asset_events").insert({
        tenant_id: profile.tenant_id,
        asset_id: asset.id,
        event_type: "created",
        event_description: "Asset created",
        performed_by: user.id
      });

      return asset;
    },
    onSuccess: (data) => {
      toast.success("Asset created successfully");
      queryClient.invalidateQueries({ queryKey: ["itam-assets"] });
      navigate(`/helpdesk/assets/detail/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create asset");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.asset_id || !formData.brand || !formData.model) {
      toast.error("Please fill all required fields (Asset ID, Brand, Model)");
      return;
    }

    createAsset.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <BackButton />
      
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Add New Asset</h1>
          <p className="text-muted-foreground mt-2">Create a new asset record</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="asset_id">Asset ID *</Label>
                    <Input
                      id="asset_id"
                      value={formData.asset_id}
                      onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                      placeholder="e.g., AST-001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g., Dell, HP, Apple"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="e.g., Latitude 5420"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Asset description"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="asset_configuration">Asset Configuration</Label>
                    <Input
                      id="asset_configuration"
                      value={formData.asset_configuration}
                      onChange={(e) => setFormData({ ...formData, asset_configuration: e.target.value })}
                      placeholder="e.g., i5/8GB/256GB SSD"
                    />
                  </div>
                </div>
              </div>

              {/* Purchase Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Purchase Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost (₹)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serial_number">Serial No</Label>
                    <Input
                      id="serial_number"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                      placeholder="Serial number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchased_from">Purchased From</Label>
                    <Input
                      id="purchased_from"
                      value={formData.purchased_from}
                      onChange={(e) => setFormData({ ...formData, purchased_from: e.target.value })}
                      placeholder="Vendor name"
                    />
                  </div>
                </div>
              </div>

              {/* Classification Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Classification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classification">Asset Classification</Label>
                    <Select 
                      value={formData.classification} 
                      onValueChange={(value) => setFormData({ ...formData, classification: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select classification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Confidential">Confidential</SelectItem>
                        <SelectItem value="Internal">Internal</SelectItem>
                        <SelectItem value="Public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Organization Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Organization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site">Site</Label>
                    <Input
                      id="site"
                      value={formData.site}
                      onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                      placeholder="e.g., Head Office"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Floor 3, Room 305"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g., IT, HR, Finance"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Upload Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Asset Photo</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="photo">Upload Photo (JPG/GIF/PNG, max 500 KB)</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept=".jpg,.jpeg,.gif,.png"
                      onChange={handlePhotoChange}
                      className="cursor-pointer"
                    />
                  </div>

                  {photoPreview && (
                    <div className="relative inline-block">
                      <img 
                        src={photoPreview} 
                        alt="Preview" 
                        className="h-32 w-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={removePhoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/helpdesk/assets")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createAsset.isPending}>
                  {createAsset.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Asset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddAsset;
