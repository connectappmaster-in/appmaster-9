import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Archive,
  Wrench,
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

const AssetDetail = () => {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
              onClick={() => navigate(`/helpdesk/assets/edit/${asset.id}`)}
              className="gap-1"
            >
              <Edit className="h-4 w-4" />
              Edit Asset
            </Button>

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="gap-1">
                  More Actions
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {asset.status === "available" && (
                  <DropdownMenuItem onClick={() => navigate(`/helpdesk/assets/assign?assetId=${asset.id}`)}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Check-out
                  </DropdownMenuItem>
                )}
                {asset.status === "assigned" && (
                  <DropdownMenuItem onClick={() => navigate(`/helpdesk/assets/return?assetId=${asset.id}`)}>
                    <Archive className="h-4 w-4 mr-2" />
                    Check-in
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => {}}>
                  Dispose
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/helpdesk/assets/repairs/create?assetId=${asset.id}`)}>
                  <Wrench className="h-4 w-4 mr-2" />
                  Maintenance
                </DropdownMenuItem>
                <DropdownMenuItem>Reserve</DropdownMenuItem>
                <DropdownMenuItem>Upload Docs</DropdownMenuItem>
                <DropdownMenuItem>Link Assets</DropdownMenuItem>
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

              {/* Asset Details Grid */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Asset Tag ID</p>
                    <p className="text-base font-medium text-primary hover:underline cursor-pointer">{asset.asset_id || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Site</p>
                    <p className="text-base text-primary hover:underline cursor-pointer">{asset.site || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Purchase Date</p>
                    <p className="text-base">{asset.purchase_date ? format(new Date(asset.purchase_date), "dd/MM/yyyy") : '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Location</p>
                    <p className="text-base">{asset.location || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Cost</p>
                    <p className="text-base font-semibold">₹{asset.cost?.toLocaleString() || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Category</p>
                    <p className="text-base">{asset.category || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Brand</p>
                    <p className="text-base">{asset.brand || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Department</p>
                    <p className="text-base">{asset.department || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Model</p>
                    <p className="text-base">{asset.model || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Assigned to</p>
                    <p className="text-base text-primary hover:underline cursor-pointer">{asset.assigned_to || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Status</p>
                    <Badge variant="outline" className={`${getStatusColor(asset.status) === 'default' ? 'bg-green-100 text-green-800' : ''} capitalize`}>
                      {asset.status === 'assigned' ? 'Checked out' : asset.status || 'available'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid grid-cols-6 lg:grid-cols-11 w-full h-9">
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
            <Card>
              <CardContent className="pt-4">
                <p className="text-center text-muted-foreground py-6">Linking feature coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-center text-muted-foreground py-6">Maintenance records coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="mt-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-center text-muted-foreground py-6">Contracts feature coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reserve" className="mt-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-center text-muted-foreground py-6">Reservation system coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-center text-muted-foreground py-6">Audit logs coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-3">
            <HistoryTab assetId={asset.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AssetDetail;
