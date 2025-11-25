import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

interface DocsTabProps {
  assetId: number;
}

export const DocsTab = ({ assetId }: DocsTabProps) => {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("invoice");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["asset-documents", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_documents")
        .select("*")
        .eq("asset_id", assetId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const deleteDocument = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase
        .from("asset_documents")
        .delete()
        .eq("id", docId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["asset-documents", assetId] });
    },
    onError: () => {
      toast.error("Failed to delete document");
    }
  });

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      const fileName = `${profile.tenant_id}/documents/${assetId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('asset-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('asset-photos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("asset_documents")
        .insert({
          tenant_id: profile.tenant_id,
          asset_id: assetId,
          document_type: docType,
          document_name: file.name,
          document_url: publicUrl,
          uploaded_by: user.id
        });

      if (insertError) throw insertError;

      toast.success("Document uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["asset-documents", assetId] });
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="doc-type">Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="warranty">Warranty Card</SelectItem>
                  <SelectItem value="po">Purchase Order</SelectItem>
                  <SelectItem value="manual">User Manual</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="doc-upload">
                <Button variant="outline" disabled={uploading} asChild>
                  <span className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload Document
                  </span>
                </Button>
              </label>
              <Input
                id="doc-upload"
                type="file"
                onChange={handleDocumentUpload}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {(!documents || documents.length === 0) ? (
        <div className="text-center py-8 text-muted-foreground">No documents uploaded</div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.document_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.document_type} • Uploaded {format(new Date(doc.uploaded_at), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(doc.document_url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteDocument.mutate(doc.id)}
                      disabled={deleteDocument.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
