import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, UserCheck, Search, LayoutDashboard, FileText, Wrench, Settings, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AssetsList } from "@/components/ITAM/AssetsList";
import { CreateAssetDialog } from "@/components/ITAM/CreateAssetDialog";
import { AssetAssignmentsList } from "@/components/ITAM/AssetAssignmentsList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
export default function HelpdeskAssets() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
  const [bulkActions, setBulkActions] = useState<any>(null);

  // Fetch assets count for badges
  const {
    data: allAssets = []
  } = useQuery({
    queryKey: ["assets-count"],
    queryFn: async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return [];
      const {
        data: userData
      } = await supabase.from("users").select("organisation_id").eq("auth_user_id", user.id).single();
      const {
        data: profileData
      } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).maybeSingle();
      const tenantId = profileData?.tenant_id || 1;
      const orgId = userData?.organisation_id;
      let query = supabase.from("itam_assets").select("*").eq("is_deleted", false);
      if (orgId) {
        query = query.eq("organisation_id", orgId);
      } else {
        query = query.eq("tenant_id", tenantId);
      }
      const {
        data
      } = await query;
      return data || [];
    }
  });
  const {
    data: assignments = []
  } = useQuery({
    queryKey: ["asset-assignments-count"],
    queryFn: async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return [];
      const {
        data: userData
      } = await supabase.from("users").select("organisation_id").eq("auth_user_id", user.id).single();
      const {
        data: profileData
      } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).maybeSingle();
      const tenantId = profileData?.tenant_id || 1;
      const orgId = userData?.organisation_id;
      let query = supabase.from("asset_assignments").select("*").is("returned_at", null);
      if (orgId) {
        query = query.eq("organisation_id", orgId);
      } else {
        query = query.eq("tenant_id", tenantId);
      }
      const {
        data
      } = await query;
      return data || [];
    }
  });
  const availableAssets = allAssets.filter(a => a.status === 'available');
  const maintenanceAssets = allAssets.filter(a => a.status === 'in_repair');
  return <div className="min-h-screen bg-background">
      <div className="w-full px-4 pt-2 pb-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
          {/* Compact Single Row Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <TabsList className="h-8">
              <TabsTrigger value="overview" className="gap-1.5 px-3 text-sm h-7">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-1.5 px-3 text-sm h-7">
                <Package className="h-3.5 w-3.5" />
                All Assets
                {allAssets.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                    {allAssets.length}
                  </Badge>}
              </TabsTrigger>
              <TabsTrigger value="explore" className="gap-1.5 px-3 text-sm h-7">
                Explore
              </TabsTrigger>
            </TabsList>

            {activeTab !== 'overview' && <>
                <div className="relative w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search assets..." value={filters.search || ''} onChange={e => setFilters({
                ...filters,
                search: e.target.value
              })} className="pl-9 h-8" />
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {selectedAssetIds.length > 0 && bulkActions && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8">
                          Bulk Actions ({selectedAssetIds.length})
                          <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={bulkActions.handleCheckOut}>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Check Out
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={bulkActions.handleCheckIn}>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Check In
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={bulkActions.handleMaintenance}>
                          <Wrench className="mr-2 h-4 w-4" />
                          Maintenance
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={bulkActions.handleDispose}>
                          <Settings className="mr-2 h-4 w-4" />
                          Dispose
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={bulkActions.handleDelete} className="text-destructive">
                          <Package className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
                  <Select value={filters.status || 'all'} onValueChange={value => setFilters({
                ...filters,
                status: value === 'all' ? null : value
              })}>
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_repair">In Repair</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="disposed">Disposed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.type || 'all'} onValueChange={value => setFilters({
                ...filters,
                type: value === 'all' ? null : value
              })}>
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
              </>}

          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
              {/* Number of Active Assets */}
              <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab("all")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Number of Active Assets</div>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-semibold text-foreground">{allAssets.filter(a => a.status !== 'retired' && a.status !== 'disposed').length}</h3>
                <p className="text-sm text-muted-foreground mt-1">Total Assets: {allAssets.length}</p>
              </div>

              {/* Available Assets */}
              <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab("available")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Available Assets</div>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-semibold text-foreground">{availableAssets.length}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  ₹{availableAssets.reduce((sum, a) => sum + (a.purchase_price || 0), 0).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Value of Assets */}
              <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab("all")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Value of Assets</div>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-semibold text-foreground">
                  ₹{allAssets.reduce((sum, a) => sum + (a.purchase_price || 0), 0).toLocaleString('en-IN')}
                </h3>
              </div>

              {/* In Repair */}
              <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">In Repair</div>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-semibold text-foreground">{maintenanceAssets.length}</h3>
                <p className="text-sm text-muted-foreground mt-1">{maintenanceAssets.length} Assets</p>
              </div>
            </div>

            {/* Charts and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 pb-4">
              {/* Asset Value by Category - Placeholder for chart */}
              <div className="p-6 border rounded-lg bg-card">
                <h3 className="text-lg font-semibold mb-4">Asset Value by Category</h3>
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Chart visualization coming soon</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="p-6 border rounded-lg bg-card">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <Tabs defaultValue="assigned" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="assigned">Checked In</TabsTrigger>
                    <TabsTrigger value="repair">Under Repair</TabsTrigger>
                  </TabsList>
                  <TabsContent value="assigned" className="space-y-2">
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {assignments.slice(0, 5).map((assignment) => {
                        const asset = allAssets.find(a => a.id === assignment.asset_id);
                        return (
                          <div key={assignment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{asset?.asset_tag || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">{asset?.name || 'Unknown'}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(assignment.assigned_at || '').toLocaleDateString()}
                            </p>
                          </div>
                        );
                      })}
                      {assignments.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent assignments</p>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="repair" className="space-y-2">
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {maintenanceAssets.slice(0, 5).map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{asset.asset_tag || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{asset.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {asset.category || 'N/A'}
                          </p>
                        </div>
                      ))}
                      {maintenanceAssets.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No assets under repair</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </TabsContent>

          {/* All Assets Tab */}
          <TabsContent value="all" className="space-y-2 mt-2">
            <AssetsList 
              filters={filters} 
              onSelectionChange={(selectedIds, actions) => {
                setSelectedAssetIds(selectedIds);
                setBulkActions(actions);
              }}
            />
          </TabsContent>


          {/* Explore Tab */}
          <TabsContent value="explore" className="space-y-2 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {/* Bulk Actions */}
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/helpdesk/assets/explore/bulk-actions')}>
                <Package className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Bulk Actions</div>
                  <div className="text-xs text-muted-foreground">Check Out, Check In, Dispose, Maintenance</div>
                </div>
              </Button>

              {/* Lists */}
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/helpdesk/assets/explore/lists')}>
                <Package className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Lists</div>
                  <div className="text-xs text-muted-foreground">Maintenances, Warranties</div>
                </div>
              </Button>

              {/* Reports */}
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/helpdesk/assets/explore/reports')}>
                <Package className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Reports</div>
                  <div className="text-xs text-muted-foreground">Asset, Audit, Check-Out, Maintenance</div>
                </div>
              </Button>

              {/* Tools */}
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/helpdesk/assets/explore/tools')}>
                <Package className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Tools</div>
                  <div className="text-xs text-muted-foreground">Import, Export, Galleries, Audit</div>
                </div>
              </Button>

              {/* Advanced */}
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/helpdesk/assets/explore/advanced')}>
                <Package className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Advanced</div>
                  <div className="text-xs text-muted-foreground">Employees, Users</div>
                </div>
              </Button>

              {/* Fields Setup */}
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/helpdesk/assets/explore/fields-setup')}>
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
      <CreateAssetDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>;
}