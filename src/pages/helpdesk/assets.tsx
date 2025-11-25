import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, UserCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AssetsList } from "@/components/ITAM/AssetsList";
import { CreateAssetDialog } from "@/components/ITAM/CreateAssetDialog";
import { AssetAssignmentsList } from "@/components/ITAM/AssetAssignmentsList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function HelpdeskAssets() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Fetch assets count for badges
  const { data: allAssets = [] } = useQuery({
    queryKey: ["assets-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

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

      let query = supabase.from("itam_assets").select("*").eq("is_deleted", false);

      if (orgId) {
        query = query.eq("organisation_id", orgId);
      } else {
        query = query.eq("tenant_id", tenantId);
      }

      const { data } = await query;
      return data || [];
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["asset-assignments-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

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
        .from("asset_assignments")
        .select("*")
        .is("returned_at", null);

      if (orgId) {
        query = query.eq("organisation_id", orgId);
      } else {
        query = query.eq("tenant_id", tenantId);
      }

      const { data } = await query;
      return data || [];
    },
  });

  const availableAssets = allAssets.filter(a => a.status === 'available');
  const maintenanceAssets = allAssets.filter(a => a.status === 'in_repair');

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-4 pt-2 pb-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
          {/* Compact Single Row Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <TabsList className="h-8">
              <TabsTrigger value="all" className="gap-1.5 px-3 text-sm h-7">
                <Package className="h-3.5 w-3.5" />
                All Assets
                {allAssets.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                    {allAssets.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="assigned" className="gap-1.5 px-3 text-sm h-7">
                <UserCheck className="h-3.5 w-3.5" />
                Assigned
                {assignments.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                    {assignments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="available" className="gap-1.5 px-3 text-sm h-7">
                Available
                {availableAssets.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                    {availableAssets.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="explore" className="gap-1.5 px-3 text-sm h-7">
                Explore
              </TabsTrigger>
            </TabsList>

            {activeTab !== 'assigned' && (
              <>
                <div className="relative w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assets..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-9 h-8"
                  />
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? null : value })}
                  >
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_repair">In Repair</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="disposed">Disposed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.type || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, type: value === 'all' ? null : value })}
                  >
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
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

                  <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="gap-1.5 h-8">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-sm">Add Asset</span>
                  </Button>
                </div>
              </>
            )}

            {activeTab === 'assigned' && (
              <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="gap-1.5 h-8 ml-auto">
                <Plus className="h-3.5 w-3.5" />
                <span className="text-sm">Add Asset</span>
              </Button>
            )}
          </div>

          {/* All Assets Tab */}
          <TabsContent value="all" className="space-y-2 mt-2">
            <AssetsList filters={filters} />
          </TabsContent>

          {/* Assigned Assets Tab */}
          <TabsContent value="assigned" className="space-y-2 mt-2">
            <AssetAssignmentsList />
          </TabsContent>

          {/* Available Assets Tab */}
          <TabsContent value="available" className="space-y-2 mt-2">
            <AssetsList status="available" filters={filters} />
          </TabsContent>

          {/* Explore Tab */}
          <TabsContent value="explore" className="space-y-2 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {/* Bulk Actions */}
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/helpdesk/assets/explore/bulk-actions')}
              >
                <Package className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Bulk Actions</div>
                  <div className="text-xs text-muted-foreground">Check Out, Check In, Dispose, Maintenance</div>
                </div>
              </Button>

              {/* Lists */}
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/helpdesk/assets/explore/lists')}
              >
                <Package className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Lists</div>
                  <div className="text-xs text-muted-foreground">Maintenances, Warranties</div>
                </div>
              </Button>

              {/* Reports */}
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/helpdesk/assets/explore/reports')}
              >
                <Package className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Reports</div>
                  <div className="text-xs text-muted-foreground">Asset, Audit, Check-Out, Maintenance</div>
                </div>
              </Button>

              {/* Tools */}
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/helpdesk/assets/explore/tools')}
              >
                <Package className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Tools</div>
                  <div className="text-xs text-muted-foreground">Import, Export, Galleries, Audit</div>
                </div>
              </Button>

              {/* Advanced */}
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/helpdesk/assets/explore/advanced')}
              >
                <Package className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Advanced</div>
                  <div className="text-xs text-muted-foreground">Employees, Users</div>
                </div>
              </Button>

              {/* Fields Setup */}
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/helpdesk/assets/explore/fields-setup')}
              >
                <Package className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Fields Setup</div>
                  <div className="text-xs text-muted-foreground">Company, Sites, Categories, Tag Format</div>
                </div>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog */}
      <CreateAssetDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
