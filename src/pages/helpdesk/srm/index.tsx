import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Calendar, Search, LayoutDashboard, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSRMStats } from "@/hooks/useSRMStats";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Edit, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InlineServiceRequestForm } from "@/components/SRM/InlineServiceRequestForm";
import { InlineChangeRequestForm } from "@/components/SRM/InlineChangeRequestForm";
import { ServiceRequestDetailsView } from "@/components/SRM/ServiceRequestDetailsView";
import { ChangeRequestDetailsView } from "@/components/SRM/ChangeRequestDetailsView";

type ViewMode = 'list' | 'form' | 'details';

export default function ServiceRequests() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: stats } = useSRMStats();
  const [filters, setFilters] = useState<Record<string, any>>({});
  
  // View state for Service Requests
  const [requestViewMode, setRequestViewMode] = useState<ViewMode>('list');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  // View state for Change Management
  const [changeViewMode, setChangeViewMode] = useState<ViewMode>('list');
  const [selectedChange, setSelectedChange] = useState<any>(null);

  // Fetch Service Requests from database
  const { data: requests = [], isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ["srm-requests", filters],
    queryFn: async () => {
      let query = supabase
        .from("srm_requests")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq("status", filters.status);
      }
      if (filters.priority && filters.priority !== 'all') {
        query = query.eq("priority", filters.priority);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,request_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch Change Requests from database
  const { data: changes = [], isLoading: changesLoading, refetch: refetchChanges } = useQuery({
    queryKey: ["change-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("change_requests")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = requestsLoading || changesLoading;

  const handleRequestSuccess = (newRequest: any) => {
    refetchRequests();
    setSelectedRequest(newRequest);
    setRequestViewMode('details');
  };

  const handleChangeSuccess = (newChange: any) => {
    refetchChanges();
    setSelectedChange(newChange);
    setChangeViewMode('details');
  };

  const handleRequestClose = () => {
    setRequestViewMode('list');
    setSelectedRequest(null);
    refetchRequests();
  };

  const handleChangeClose = () => {
    setChangeViewMode('list');
    setSelectedChange(null);
    refetchChanges();
  };

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
              <TabsTrigger value="requests" className="gap-1.5 px-3 text-sm h-7">
                <FileText className="h-3.5 w-3.5" />
                Service Requests
                {requests.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                    {requests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="changes" className="gap-1.5 px-3 text-sm h-7">
                <Calendar className="h-3.5 w-3.5" />
                Change Management
                {changes.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                    {changes.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {activeTab === 'requests' && (
              <>
                <div className="relative w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="fulfilled">Fulfilled</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.priority || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, priority: value === 'all' ? null : value })}
                  >
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    size="sm" 
                    onClick={() => setRequestViewMode('form')} 
                    className="gap-1.5 h-8"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-sm">New Request</span>
                  </Button>
                </div>
              </>
            )}

            {activeTab === 'changes' && (
              <Button 
                size="sm" 
                onClick={() => setChangeViewMode('form')} 
                className="gap-1.5 h-8 ml-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-sm">New Change</span>
              </Button>
            )}
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("requests")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold">{stats?.total || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Total Service Requests</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("requests")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-2xl font-bold">{stats?.pending || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Pending Requests</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("requests")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-2xl font-bold">{stats?.inProgress || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("requests")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold">{stats?.fulfilled || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Fulfilled</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Service Requests Tab */}
          <TabsContent value="requests" className="space-y-2 mt-2">
            {requestViewMode === 'form' && (
              <InlineServiceRequestForm
                onSuccess={handleRequestSuccess}
                onCancel={() => setRequestViewMode('list')}
              />
            )}

            {requestViewMode === 'details' && selectedRequest && (
              <ServiceRequestDetailsView
                request={selectedRequest}
                onClose={handleRequestClose}
              />
            )}

            {requestViewMode === 'list' && (
              <>
                {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading requests...</p>
                </div>
              </div>
                ) : requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
                    <div className="rounded-full bg-muted p-4 mb-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold mb-1">No service requests found</h3>
                    <p className="text-xs text-muted-foreground mb-4 text-center max-w-md">
                      Get started by creating your first service request
                    </p>
                    <Button onClick={() => setRequestViewMode('form')} size="sm" className="gap-1.5 h-8">
                      <Plus className="h-3.5 w-3.5" />
                      <span className="text-sm">Create First Request</span>
                    </Button>
                  </div>
                ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-medium h-9">REQUEST #</TableHead>
                      <TableHead className="text-xs font-medium h-9">TITLE</TableHead>
                      <TableHead className="text-xs font-medium h-9">STATUS</TableHead>
                      <TableHead className="text-xs font-medium h-9">PRIORITY</TableHead>
                      <TableHead className="text-xs font-medium h-9">REQUESTER</TableHead>
                      <TableHead className="text-xs font-medium h-9">CREATED</TableHead>
                      <TableHead className="text-xs font-medium h-9 text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {requests.map((request: any) => (
                       <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50">
                         <TableCell className="font-mono text-xs py-2">{request.request_number || 'N/A'}</TableCell>
                         <TableCell className="py-2">
                           <div className="max-w-[300px]">
                             <div className="font-medium text-sm truncate">{request.title}</div>
                             <div className="text-xs text-muted-foreground truncate">{request.description}</div>
                           </div>
                         </TableCell>
                         <TableCell className="py-2">
                           <Badge variant="outline" className="text-xs">
                             {request.status}
                           </Badge>
                         </TableCell>
                         <TableCell className="py-2">
                           <Badge variant="outline" className="text-xs">
                             {request.priority || 'medium'}
                           </Badge>
                         </TableCell>
                         <TableCell className="text-sm py-2">{request.requester_id || 'N/A'}</TableCell>
                         <TableCell className="text-xs text-muted-foreground py-2">
                           {new Date(request.created_at).toLocaleDateString()}
                         </TableCell>
                         <TableCell className="text-right py-2">
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                 <MoreHorizontal className="h-3.5 w-3.5" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                               <DropdownMenuItem onClick={() => {
                                 setSelectedRequest(request);
                                 setRequestViewMode('details');
                               }}>
                                 <Eye className="h-3.5 w-3.5 mr-2" />
                                 View Details
                               </DropdownMenuItem>
                               <DropdownMenuItem>
                                 <Edit className="h-3.5 w-3.5 mr-2" />
                                 Edit Request
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
             )}
          </>
        )}
      </TabsContent>

      {/* Change Management Tab */}
      <TabsContent value="changes" className="space-y-2 mt-2">
            {changeViewMode === 'form' && (
              <InlineChangeRequestForm
                onSuccess={handleChangeSuccess}
                onCancel={() => setChangeViewMode('list')}
              />
            )}

            {changeViewMode === 'details' && selectedChange && (
              <ChangeRequestDetailsView
                change={selectedChange}
                onClose={handleChangeClose}
              />
            )}

            {changeViewMode === 'list' && (
              <>
                {changes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
                    <div className="rounded-full bg-muted p-4 mb-3">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold mb-1">No change requests found</h3>
                    <p className="text-xs text-muted-foreground mb-4 text-center max-w-md">
                      Get started by creating your first change request
                    </p>
                    <Button onClick={() => setChangeViewMode('form')} size="sm" className="gap-1.5 h-8">
                      <Plus className="h-3.5 w-3.5" />
                      <span className="text-sm">Create First Change</span>
                    </Button>
                  </div>
                ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-medium h-9">CHANGE #</TableHead>
                      <TableHead className="text-xs font-medium h-9">TITLE</TableHead>
                      <TableHead className="text-xs font-medium h-9">STATUS</TableHead>
                      <TableHead className="text-xs font-medium h-9">RISK</TableHead>
                      <TableHead className="text-xs font-medium h-9">IMPACT</TableHead>
                      <TableHead className="text-xs font-medium h-9">CREATED</TableHead>
                      <TableHead className="text-xs font-medium h-9 text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changes.map((change: any) => (
                      <TableRow key={change.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono text-xs py-2">{change.change_number}</TableCell>
                        <TableCell className="py-2">
                          <div className="max-w-[300px]">
                            <div className="font-medium text-sm truncate">{change.title}</div>
                            <div className="text-xs text-muted-foreground truncate">{change.description}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="outline" className="text-xs">
                            {change.status || 'draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="outline" className="text-xs">
                            {change.risk || 'low'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm py-2">{change.impact || 'low'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2">
                          {new Date(change.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                               <DropdownMenuItem onClick={() => {
                                 setSelectedChange(change);
                                 setChangeViewMode('details');
                               }}>
                                 <Eye className="h-3.5 w-3.5 mr-2" />
                                 View Details
                               </DropdownMenuItem>
                               <DropdownMenuItem>
                                 <Edit className="h-3.5 w-3.5 mr-2" />
                                 Edit Change
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </TabsContent>
    </Tabs>
      </div>
    </div>
  );
}
