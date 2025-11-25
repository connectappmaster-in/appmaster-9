import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, UserCheck, Search, LayoutDashboard, FileText, Wrench, Settings, AlertCircle, CheckCircle, Clock, BookOpen, Activity, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AssetsList } from "@/components/ITAM/AssetsList";
import { CreateAssetDialog } from "@/components/ITAM/CreateAssetDialog";
import { AssetAssignmentsList } from "@/components/ITAM/AssetAssignmentsList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHelpdeskModuleStats } from "@/hooks/useHelpdeskModuleStats";
import { Skeleton } from "@/components/ui/skeleton";

export default function HelpdeskAssets() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  
  const { data: moduleStats, isLoading: statsLoading } = useHelpdeskModuleStats();

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
              <TabsTrigger value="overview" className="gap-1.5 px-3 text-sm h-7">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Overview
              </TabsTrigger>
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

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-2">
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : (
              <>
                {/* All Modules Stats */}
                <div className="px-4 pt-4">
                  <h3 className="text-lg font-semibold mb-4">Helpdesk Modules Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Tickets */}
                    <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/helpdesk/tickets')}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tickets</div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-semibold text-foreground mb-1">{moduleStats?.tickets.total || 0}</h3>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>Open: {moduleStats?.tickets.open || 0}</span>
                        <span>•</span>
                        <span>Resolved: {moduleStats?.tickets.resolved || 0}</span>
                      </div>
                    </div>

                    {/* Service Requests */}
                    <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/helpdesk/service-requests')}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Service Requests</div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-semibold text-foreground mb-1">{moduleStats?.serviceRequests.total || 0}</h3>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>Pending: {moduleStats?.serviceRequests.pending || 0}</span>
                        <span>•</span>
                        <span>Fulfilled: {moduleStats?.serviceRequests.fulfilled || 0}</span>
                      </div>
                    </div>

                    {/* Assets */}
                    <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab("all")}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assets</div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-semibold text-foreground mb-1">{moduleStats?.assets.total || 0}</h3>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>Available: {moduleStats?.assets.available || 0}</span>
                        <span>•</span>
                        <span>Assigned: {moduleStats?.assets.assigned || 0}</span>
                      </div>
                    </div>

                    {/* Subscriptions */}
                    <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/helpdesk/subscription')}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subscriptions</div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-semibold text-foreground mb-1">{moduleStats?.subscriptions.total || 0}</h3>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>Active: {moduleStats?.subscriptions.active || 0}</span>
                        <span>•</span>
                        <span>Expiring: {moduleStats?.subscriptions.expiringSoon || 0}</span>
                      </div>
                    </div>

                    {/* System Updates */}
                    <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/helpdesk/system-updates')}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">System Updates</div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-semibold text-foreground mb-1">{moduleStats?.systemUpdates.total || 0}</h3>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>Compliant: {moduleStats?.systemUpdates.compliant || 0}</span>
                        <span>•</span>
                        <span>Pending: {moduleStats?.systemUpdates.pendingUpdates || 0}</span>
                      </div>
                    </div>

                    {/* Knowledge Base */}
                    <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/helpdesk/kb')}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Knowledge Base</div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-semibold text-foreground mb-1">{moduleStats?.kb.total || 0}</h3>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>Published: {moduleStats?.kb.published || 0}</span>
                        <span>•</span>
                        <span>Draft: {moduleStats?.kb.draft || 0}</span>
                      </div>
                    </div>

                    {/* Monitoring */}
                    <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/helpdesk/monitoring')}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monitoring</div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-sm">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-semibold text-foreground mb-1">{moduleStats?.monitoring.total || 0}</h3>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>Healthy: {moduleStats?.monitoring.healthy || 0}</span>
                        <span>•</span>
                        <span>Critical: {moduleStats?.monitoring.critical || 0}</span>
                      </div>
                    </div>

                    {/* Audit */}
                    <div className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/helpdesk/audit')}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Audit Logs</div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-semibold text-foreground mb-1">{moduleStats?.audit.last30Days || 0}</h3>
                      <div className="text-xs text-muted-foreground">Last 30 days</div>
                    </div>
                  </div>
                </div>

                {/* Quick Access Section */}
                <div className="px-4 pb-4">
                  <h3 className="text-lg font-semibold mb-4">Asset Management Quick Access</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                      <FileText className="h-5 w-5" />
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
                      <FileText className="h-5 w-5" />
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
                      <Settings className="h-5 w-5" />
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
                      <Settings className="h-5 w-5" />
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
                      <Settings className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-semibold">Fields Setup</div>
                        <div className="text-xs text-muted-foreground">Company, Sites, Categories, Tag Format</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

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
