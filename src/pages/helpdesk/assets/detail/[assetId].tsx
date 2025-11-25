import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Edit, 
  MoreVertical,
  UserCheck,
  AlertTriangle,
  Wrench,
  AlertCircle,
  Trash2,
  Mail,
  Copy,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DetailsTab } from "./[assetId]/tabs/DetailsTab";
import { EventsTab } from "./[assetId]/tabs/EventsTab";
import { PhotosTab } from "./[assetId]/tabs/PhotosTab";
import { DocsTab } from "./[assetId]/tabs/DocsTab";
import { WarrantyTab } from "./[assetId]/tabs/WarrantyTab";
import { HistoryTab } from "./[assetId]/tabs/HistoryTab";
import { LinkingTab } from "./[assetId]/tabs/LinkingTab";
import { MaintenanceTab } from "./[assetId]/tabs/MaintenanceTab";
import { ContractsTab } from "./[assetId]/tabs/ContractsTab";
import { ReserveTab } from "./[assetId]/tabs/ReserveTab";
import { AuditTab } from "./[assetId]/tabs/AuditTab";
import { EditAssetDialog } from "@/components/ITAM/EditAssetDialog";

const AssetDetail = () => {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch asset details
  const { data: asset, isLoading } = useQuery({
    queryKey: ["itam-asset-detail", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("itam_assets")
        .select("*")
        .eq("id", parseInt(assetId || "0"))
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!assetId,
  });

  // Fetch all asset IDs for navigation
  const { data: allAssetIds = [] } = useQuery({
    queryKey: ["all-asset-ids"],
    queryFn: async () => {
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
      const orgId = userData?.organisation_id;

      let query = supabase
        .from("itam_assets")
        .select("id")
        .eq("is_deleted", false)
        .order("id", { ascending: true });

      if (orgId) {
        query = query.eq("organisation_id", orgId);
      } else {
        query = query.eq("tenant_id", tenantId);
      }

      const { data } = await query;
      return data?.map(a => a.id) || [];
    },
  });

  const currentIndex = allAssetIds.indexOf(parseInt(assetId || "0"));
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allAssetIds.length - 1;

  const goToPrev = () => {
    if (hasPrev) {
      navigate(`/helpdesk/assets/detail/${allAssetIds[currentIndex - 1]}`);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      navigate(`/helpdesk/assets/detail/${allAssetIds[currentIndex + 1]}`);
    }
  };

  // Mutation for updating asset status
  const updateAssetStatus = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      const { error } = await supabase
        .from("itam_assets")
        .update({ status })
        .eq("id", parseInt(assetId!));
      
      if (error) throw error;

      // Log the event
      if (notes && asset) {
        await supabase.from("asset_events").insert({
          asset_id: parseInt(assetId!),
          event_type: status,
          event_description: notes,
          tenant_id: asset.tenant_id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itam-asset-detail", assetId] });
      toast.success("Asset status updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update asset status");
      console.error(error);
    },
  });

  // Mutation for deleting asset
  const deleteAsset = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("itam_assets")
        .update({ is_deleted: true })
        .eq("id", parseInt(assetId!));
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Asset deleted successfully");
      navigate("/helpdesk/assets/list");
    },
    onError: (error) => {
      toast.error("Failed to delete asset");
      console.error(error);
    },
  });

  // Mutation for replicating asset
  const replicateAsset = useMutation({
    mutationFn: async () => {
      const { data: assetData, error: fetchError } = await supabase
        .from("itam_assets")
        .select("*")
        .eq("id", parseInt(assetId!))
        .single();
      
      if (fetchError) throw fetchError;

      const { id, created_at, updated_at, asset_id: assetIdField, asset_tag, ...assetToCopy } = assetData;
      
      const { data, error } = await supabase
        .from("itam_assets")
        .insert({
          ...assetToCopy,
          name: `${assetToCopy.name || 'Asset'} (Copy)`,
          asset_tag: `${asset_tag}-COPY-${Date.now()}`,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Asset replicated successfully");
      navigate(`/helpdesk/assets/detail/${data.id}`);
    },
    onError: (error) => {
      toast.error("Failed to replicate asset");
      console.error(error);
    },
  });

  // Handle action clicks
  const handleAction = (action: string) => {
    switch (action) {
      case "check_in":
        updateAssetStatus.mutate({ status: "available", notes: "Asset checked in" });
        break;
      case "lost":
        updateAssetStatus.mutate({ status: "lost", notes: "Asset marked as lost/missing" });
        break;
      case "repair":
        updateAssetStatus.mutate({ status: "in_repair", notes: "Asset sent for repair" });
        break;
      case "broken":
        updateAssetStatus.mutate({ status: "broken", notes: "Asset marked as broken" });
        break;
      case "dispose":
        updateAssetStatus.mutate({ status: "disposed", notes: "Asset disposed" });
        break;
      case "delete":
        if (confirm("Are you sure you want to delete this asset? This action cannot be undone.")) {
          deleteAsset.mutate();
        }
        break;
      case "email":
        if (asset?.assigned_to) {
          toast.success("Email notification sent to assigned user");
        } else {
          toast.error("No user assigned to this asset");
        }
        break;
      case "replicate":
        replicateAsset.mutate();
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "default";
      case "assigned": return "secondary";
      case "in_repair": return "destructive";
      case "retired": return "outline";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Loading asset details...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Asset not found</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="h-full space-y-4 p-4">
        {/* Header with Title and Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold">Asset View</h1>
              <p className="text-xs text-muted-foreground">{asset.category || 'Asset'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Navigation Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrev}
              disabled={!hasPrev}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={!hasNext}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Edit Asset Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="gap-1"
            >
              <Edit className="h-4 w-4" />
              Edit Asset
            </Button>

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="gap-1 bg-green-600 hover:bg-green-700">
                  More Actions
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleAction("check_in")}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Check in
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("lost")}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Lost / Missing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("repair")}>
                  <Wrench className="h-4 w-4 mr-2" />
                  Repair
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("broken")}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Broken
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("dispose")}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Dispose
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("delete")} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("email")}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("replicate")}>
                  <Copy className="h-4 w-4 mr-2" />
                  Replicate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Top Section with Photo and Details */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Asset Photo */}
              <div className="lg:col-span-1">
                <div className="aspect-square rounded-lg border bg-muted flex items-center justify-center overflow-hidden max-h-[240px]">
                  {asset.photo_url ? (
                    <img src={asset.photo_url} alt={asset.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <div className="text-6xl mb-2">📦</div>
                      <p className="text-sm text-muted-foreground">No photo available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Asset Details - Two Tables */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2 text-sm font-semibold">Asset Tag ID</td>
                        <td className="p-2 text-sm font-medium text-primary hover:underline cursor-pointer">{asset.asset_id || '—'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 text-sm font-semibold">Purchase Date</td>
                        <td className="p-2 text-sm">{asset.purchase_date ? format(new Date(asset.purchase_date), "dd/MM/yyyy") : '—'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 text-sm font-semibold">Cost</td>
                        <td className="p-2 text-sm font-semibold">₹{asset.cost?.toLocaleString() || '0.00'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 text-sm font-semibold">Brand</td>
                        <td className="p-2 text-sm">{asset.brand || '—'}</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-sm font-semibold">Model</td>
                        <td className="p-2 text-sm">{asset.model || '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2 text-sm font-semibold">Site</td>
                        <td className="p-2 text-sm text-primary hover:underline cursor-pointer">{asset.site || '—'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 text-sm font-semibold">Location</td>
                        <td className="p-2 text-sm">{asset.location || '—'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 text-sm font-semibold">Category</td>
                        <td className="p-2 text-sm">{asset.category || '—'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 text-sm font-semibold">Department</td>
                        <td className="p-2 text-sm">{asset.department || '—'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 text-sm font-semibold">Assigned to</td>
                        <td className="p-2 text-sm text-primary hover:underline cursor-pointer">{asset.assigned_to || '—'}</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-sm font-semibold">Status</td>
                        <td className="p-2 text-sm">
                          <Badge variant="outline" className={`${getStatusColor(asset.status) === 'default' ? 'bg-green-100 text-green-800' : ''} capitalize`}>
                            {asset.status === 'assigned' ? 'Checked out' : asset.status || 'available'}
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full overflow-x-auto">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
            <TabsTrigger value="warranty">Warranty</TabsTrigger>
            <TabsTrigger value="linking">Linking</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="reserve">Reserve</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-3">
            <DetailsTab asset={asset} />
          </TabsContent>

          <TabsContent value="events" className="mt-3">
            <EventsTab assetId={asset.id} />
          </TabsContent>

          <TabsContent value="photos" className="mt-3">
            <PhotosTab assetId={asset.id} />
          </TabsContent>

          <TabsContent value="docs" className="mt-3">
            <DocsTab assetId={asset.id} />
          </TabsContent>

          <TabsContent value="warranty" className="mt-3">
            <WarrantyTab assetId={asset.id} />
          </TabsContent>

          <TabsContent value="linking" className="mt-3">
            <LinkingTab assetId={asset.id} />
          </TabsContent>

          <TabsContent value="maintenance" className="mt-3">
            <MaintenanceTab assetId={asset.id} />
          </TabsContent>

          <TabsContent value="contracts" className="mt-3">
            <ContractsTab assetId={asset.id} />
          </TabsContent>

          <TabsContent value="reserve" className="mt-3">
            <ReserveTab assetId={asset.id} />
          </TabsContent>

          <TabsContent value="audit" className="mt-3">
            <AuditTab assetId={asset.id} />
          </TabsContent>

          <TabsContent value="history" className="mt-3">
            <HistoryTab assetId={asset.id} />
          </TabsContent>
        </Tabs>
      </div>

      <EditAssetDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ["itam-asset-detail", assetId] });
          }
        }}
        asset={asset}
      />
    </div>
  );
};

export default AssetDetail;
