import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PhotosTabProps {
  assetId: number;
}

export const PhotosTab = ({ assetId }: PhotosTabProps) => {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: photos, isLoading } = useQuery({
    queryKey: ["asset-photos", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_photos")
        .select("*")
        .eq("asset_id", assetId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase
        .from("asset_photos")
        .delete()
        .eq("id", photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Photo deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["asset-photos", assetId] });
    },
    onError: () => {
      toast.error("Failed to delete photo");
    }
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/gif', 'image/png'].includes(file.type)) {
      toast.error("Invalid file type. Please upload JPG, GIF, or PNG.");
      return;
    }

    if (file.size > 512000) {
      toast.error("File size exceeds 500 KB.");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.tenant_id}/${assetId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('asset-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('asset-photos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("asset_photos")
        .insert({
          tenant_id: profile.tenant_id,
          asset_id: assetId,
          photo_url: publicUrl,
          uploaded_by: user.id
        });

      if (insertError) throw insertError;

      toast.success("Photo uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["asset-photos", assetId] });
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading photos...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="photo-upload">
          <Button variant="outline" disabled={uploading} asChild>
            <span className="cursor-pointer">
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Photo
            </span>
          </Button>
        </label>
        <Input
          id="photo-upload"
          type="file"
          accept=".jpg,.jpeg,.gif,.png"
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </div>

      {(!photos || photos.length === 0) ? (
        <div className="text-center py-8 text-muted-foreground">No photos uploaded</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <CardContent className="p-0 relative group">
                <img
                  src={photo.photo_url}
                  alt="Asset"
                  className="w-full h-48 object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deletePhoto.mutate(photo.id)}
                  disabled={deletePhoto.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
