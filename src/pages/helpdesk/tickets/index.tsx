import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Ticket, AlertTriangle, Search, LayoutDashboard, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateProblemDialog } from "@/components/helpdesk/CreateProblemDialog";
import { TicketFilters } from "@/components/helpdesk/TicketFilters";
import { BulkActionsButton } from "@/components/helpdesk/BulkActionsButton";
import { BulkActionsProblemButton } from "@/components/helpdesk/BulkActionsProblemButton";
import { TicketTableView } from "@/components/helpdesk/TicketTableView";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditTicketDialog } from "@/components/helpdesk/EditTicketDialog";
import { AssignTicketDialog } from "@/components/helpdesk/AssignTicketDialog";
import { EditProblemDialog } from "@/components/helpdesk/EditProblemDialog";
import { AssignProblemDialog } from "@/components/helpdesk/AssignProblemDialog";
import { ProblemTableView } from "@/components/helpdesk/ProblemTableView";
import { useHelpdeskStats } from "@/hooks/useHelpdeskStats";

export default function TicketsModule() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Set active tab based on route
  useEffect(() => {
    if (location.pathname === "/helpdesk/problems") {
      setActiveTab("problems");
    }
  }, [location.pathname]);
  const [createProblemOpen, setCreateProblemOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [editTicket, setEditTicket] = useState<any>(null);
  const [assignTicket, setAssignTicket] = useState<any>(null);
  const [editProblem, setEditProblem] = useState<any>(null);
  const [assignProblem, setAssignProblem] = useState<any>(null);
  const [selectedProblemIds, setSelectedProblemIds] = useState<number[]>([]);
  const [problemFilters, setProblemFilters] = useState<Record<string, any>>({});
  const {
    data: allTickets,
    isLoading
  } = useQuery({
    queryKey: ['helpdesk-tickets-all'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('helpdesk_tickets').select('*, category:helpdesk_categories(name), assignee:users!helpdesk_tickets_assignee_id_fkey(name), created_by_user:users!helpdesk_tickets_created_by_fkey(name, email)').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data || [];
    }
  });

  // Client-side filtering
  const tickets = (allTickets || []).filter((ticket: any) => {
    if (filters.status && ticket.status !== filters.status) return false;
    if (filters.priority && ticket.priority !== filters.priority) return false;
    if (filters.category && ticket.category_id?.toString() !== filters.category) return false;
    if (filters.assignee === 'unassigned' && ticket.assignee_id) return false;
    if (filters.assignee && filters.assignee !== 'unassigned' && ticket.assignee_id !== filters.assignee) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch = ticket.title?.toLowerCase().includes(search) || ticket.description?.toLowerCase().includes(search) || ticket.ticket_number?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    if (filters.dateFrom && new Date(ticket.created_at) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(ticket.created_at) > new Date(filters.dateTo)) return false;
    return true;
  });
  const {
    data: allProblems
  } = useQuery({
    queryKey: ['helpdesk-problems'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase
        .from('helpdesk_problems')
        .select(`
          *,
          category:helpdesk_categories(name)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Fetch created_by users separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(p => p.created_by).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', userIds);
          
          if (users) {
            const userMap = Object.fromEntries(users.map(u => [u.id, u]));
            return data.map(problem => ({
              ...problem,
              created_by_user: problem.created_by ? userMap[problem.created_by] : null
            }));
          }
        }
      }
      
      return data || [];
    }
  });
  
  // Client-side filtering for problems
  const problems = (allProblems || []).filter((problem: any) => {
    if (problemFilters.status && problem.status !== problemFilters.status) return false;
    if (problemFilters.priority && problem.priority !== problemFilters.priority) return false;
    if (problemFilters.search) {
      const search = problemFilters.search.toLowerCase();
      const matchesSearch = 
        problem.title?.toLowerCase().includes(search) || 
        problem.description?.toLowerCase().includes(search) || 
        problem.problem_number?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    return true;
  });
  const handleSelectTicket = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? tickets.map((t: any) => t.id) : []);
  };
  const handleSelectProblem = (id: number) => {
    setSelectedProblemIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const handleSelectAllProblems = (checked: boolean) => {
    setSelectedProblemIds(checked ? problems.map((p: any) => p.id) : []);
  };

  const { data: stats, isLoading: statsLoading } = useHelpdeskStats();

  const quickLinks: any[] = [];
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
              <TabsTrigger value="tickets" className="gap-1.5 px-3 text-sm h-7">
                <Ticket className="h-3.5 w-3.5" />
                All Tickets
                {tickets.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                    {tickets.length}
                  </Badge>}
              </TabsTrigger>
              <TabsTrigger value="problems" className="gap-1.5 px-3 text-sm h-7">
                <AlertTriangle className="h-3.5 w-3.5" />
                Problems
                {problems.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                    {problems.length}
                  </Badge>}
              </TabsTrigger>
            </TabsList>

            {activeTab === 'tickets' && (
              <>
                <div className="relative w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-9 h-8"
                  />
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <BulkActionsButton 
                    selectedIds={selectedIds} 
                    onClearSelection={() => setSelectedIds([])} 
                  />
                  
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? null : value })}
                  >
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
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

                  <Button size="sm" onClick={() => navigate('/helpdesk/new')} className="gap-1.5 h-8">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-sm">New Ticket</span>
                  </Button>
                </div>
              </>
            )}

            {activeTab === 'problems' && (
              <>
                <div className="relative w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search problems..."
                    value={problemFilters.search || ''}
                    onChange={(e) => setProblemFilters({ ...problemFilters, search: e.target.value })}
                    className="pl-9 h-8"
                  />
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <BulkActionsProblemButton 
                    selectedIds={selectedProblemIds} 
                    onClearSelection={() => setSelectedProblemIds([])} 
                  />
                  
                  <Select
                    value={problemFilters.status || 'all'}
                    onValueChange={(value) => setProblemFilters({ ...problemFilters, status: value === 'all' ? null : value })}
                  >
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="known_error">Known Error</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={problemFilters.priority || 'all'}
                    onValueChange={(value) => setProblemFilters({ ...problemFilters, priority: value === 'all' ? null : value })}
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

                  <Button size="sm" onClick={() => setCreateProblemOpen(true)} className="gap-1.5 h-8">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-sm">New Problem</span>
                  </Button>
                </div>
              </>
            )}
          </div>

          <TabsContent value="overview" className="space-y-4 mt-2">
            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("tickets")}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Ticket className="h-4 w-4 text-primary" />
                        <span className="text-2xl font-bold">{stats?.total || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Total Tickets</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("tickets")}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span className="text-2xl font-bold">{stats?.open || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Open Tickets</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("tickets")}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-2xl font-bold">{stats?.inProgress || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">In Progress</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("tickets")}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-2xl font-bold">{stats?.resolved || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Resolved</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("tickets")}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-2xl font-bold">{stats?.urgent || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Urgent Tickets</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("tickets")}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Clock className="h-4 w-4 text-destructive" />
                        <span className="text-2xl font-bold">{stats?.slaBreached || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">SLA Breached</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("tickets")}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                        <span className="text-2xl font-bold">{stats?.recentTickets || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Last 7 Days</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="tickets" className="space-y-2 mt-2">
            {/* Tickets Content */}
            {isLoading ? <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading tickets...</p>
                </div>
              </div> : tickets.length === 0 ? <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
                <div className="rounded-full bg-muted p-4 mb-3">
                  <Ticket className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">No tickets found</h3>
                <p className="text-xs text-muted-foreground mb-4 text-center max-w-md">
                  {Object.keys(filters).length > 0 ? "Try adjusting your filters to see more tickets" : "Get started by creating your first support ticket"}
                </p>
                {Object.keys(filters).length === 0 && <Button onClick={() => navigate('/helpdesk/new')} size="sm" className="gap-1.5 h-8">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-sm">Create First Ticket</span>
                  </Button>}
              </div> : <TicketTableView 
                tickets={tickets} 
                selectedIds={selectedIds} 
                onSelectTicket={handleSelectTicket} 
                onSelectAll={handleSelectAll}
                onEditTicket={setEditTicket}
                onAssignTicket={setAssignTicket}
              />}
          </TabsContent>

          <TabsContent value="problems" className="space-y-2">
            {problems.length === 0 ? <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
                <div className="rounded-full bg-muted p-4 mb-3">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">No problems found</h3>
                <p className="text-xs text-muted-foreground mb-4 text-center max-w-md">
                  Create a problem record to track recurring issues and document solutions
                </p>
                <Button onClick={() => setCreateProblemOpen(true)} size="sm" className="gap-1.5 h-8">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-sm">Create First Problem</span>
                </Button>
              </div> : <ProblemTableView 
                problems={problems} 
                selectedIds={selectedProblemIds} 
                onSelectProblem={handleSelectProblem} 
                onSelectAll={handleSelectAllProblems}
                onEditProblem={setEditProblem}
                onAssignProblem={setAssignProblem}
              />}
          </TabsContent>
        </Tabs>

        <CreateProblemDialog open={createProblemOpen} onOpenChange={setCreateProblemOpen} />
        {editTicket && (
          <EditTicketDialog 
            open={!!editTicket} 
            onOpenChange={(open) => !open && setEditTicket(null)}
            ticket={editTicket}
          />
        )}
        {assignTicket && (
          <AssignTicketDialog 
            open={!!assignTicket} 
            onOpenChange={(open) => !open && setAssignTicket(null)}
            ticket={assignTicket}
          />
        )}
        {editProblem && (
          <EditProblemDialog 
            open={!!editProblem} 
            onOpenChange={(open) => !open && setEditProblem(null)}
            problem={editProblem}
          />
        )}
        {assignProblem && (
          <AssignProblemDialog 
            open={!!assignProblem} 
            onOpenChange={(open) => !open && setAssignProblem(null)}
            problem={assignProblem}
          />
        )}
      </div>
    </div>;
}