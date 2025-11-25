import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Download, 
  Search, 
  RefreshCw, 
  Settings,
  Plus,
  Eye,
  Calendar,
  RotateCcw
} from "lucide-react";
import { SystemUpdate } from "@/components/SystemUpdates/UpdateCard";
import { ScheduleUpdateDialog } from "@/components/SystemUpdates/ScheduleUpdateDialog";
import { UpdateDetailsDialog } from "@/components/SystemUpdates/UpdateDetailsDialog";
import { toast } from "sonner";
import { format } from "date-fns";

export default function SystemUpdates() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<SystemUpdate | undefined>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [updates, setUpdates] = useState<SystemUpdate[]>([]);

  const filteredUpdates = updates.filter(update => {
    const matchesStatus = statusFilter === 'all' || update.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || update.category === categoryFilter;
    const matchesSearch = update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         update.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         update.version?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const handleInstall = (id: string) => {
    setUpdates(prev => prev.map(u => 
      u.id === id ? { ...u, status: 'installing' as const, progress: 0 } : u
    ));
    toast.success("Update installation started");

    // Simulate installation progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUpdates(prev => prev.map(u => 
        u.id === id ? { ...u, progress: Math.min(progress, 100) } : u
      ));
      
      if (progress >= 100) {
        clearInterval(interval);
        setUpdates(prev => prev.map(u => 
          u.id === id ? { ...u, status: 'installed' as const, progress: undefined } : u
        ));
        toast.success("Update installed successfully");
      }
    }, 500);
  };

  const handleSchedule = (id: string) => {
    const update = updates.find(u => u.id === id);
    setSelectedUpdate(update);
    setScheduleDialogOpen(true);
  };

  const handleScheduleConfirm = (date: Date, time: string) => {
    if (selectedUpdate) {
      setUpdates(prev => prev.map(u => 
        u.id === selectedUpdate.id ? { ...u, status: 'scheduled' as const } : u
      ));
      toast.success(`Update scheduled for ${date.toLocaleDateString()} at ${time}`);
    }
  };

  const handleViewDetails = (id: string) => {
    const update = updates.find(u => u.id === id);
    setSelectedUpdate(update);
    setDetailsDialogOpen(true);
  };

  const handleRefresh = () => {
    toast.info("Checking for new updates...");
    // In production, this would fetch from your backend
  };

  const handleInstallAll = () => {
    const pendingUpdates = updates.filter(u => u.status === 'pending');
    if (pendingUpdates.length === 0) {
      toast.info("No pending updates to install");
      return;
    }
    toast.success(`Installing ${pendingUpdates.length} updates...`);
    pendingUpdates.forEach(u => handleInstall(u.id));
  };

  const handleSelectUpdate = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredUpdates.map(u => u.id) : []);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 hover:bg-red-600 text-white';
      case 'high': return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'low': return 'bg-green-500 hover:bg-green-600 text-white';
      default: return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'scheduled': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'installing': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'installed': return 'bg-green-100 text-green-800 border-green-300';
      case 'failed': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-4 pt-2 pb-3">
        {/* Compact Single Row Header - Match Tickets Layout */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <div className="relative w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search updates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="gap-1.5 h-8"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="text-sm">Check</span>
            </Button>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="installing">Installing</SelectItem>
                <SelectItem value="installed">Installed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="windows">Windows</SelectItem>
                <SelectItem value="server">Server</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="firmware">Firmware</SelectItem>
                <SelectItem value="application">Application</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              size="sm" 
              onClick={handleInstallAll}
              className="gap-1.5 h-8"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="text-sm">Install All</span>
            </Button>

            <Button 
              variant="outline" 
              size="icon"
              className="h-8 w-8"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Table View - Match Tickets Layout */}
        {filteredUpdates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
            <div className="rounded-full bg-muted p-4 mb-3">
              <Download className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-1">No updates found</h3>
            <p className="text-xs text-muted-foreground mb-4 text-center max-w-md">
              {Object.keys({statusFilter, categoryFilter, searchQuery}).length > 0 
                ? "Try adjusting your filters to see more updates" 
                : "No system updates available at this time"}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden text-[0.85rem]">
            <Table>
              <TableHeader>
                <TableRow className="h-9">
                  <TableHead className="w-10 py-2">
                    <Checkbox
                      checked={selectedIds.length === filteredUpdates.length && filteredUpdates.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="py-2">Update ID</TableHead>
                  <TableHead className="py-2">Title</TableHead>
                  <TableHead className="py-2">Category</TableHead>
                  <TableHead className="py-2">Status</TableHead>
                  <TableHead className="py-2">Severity</TableHead>
                  <TableHead className="py-2">Version</TableHead>
                  <TableHead className="py-2">Size</TableHead>
                  <TableHead className="py-2">Date</TableHead>
                  <TableHead className="text-right py-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUpdates.map((update) => (
                  <TableRow 
                    key={update.id} 
                    className="cursor-pointer hover:bg-muted/50 h-11"
                    onClick={() => handleViewDetails(update.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()} className="py-1.5">
                      <Checkbox
                        checked={selectedIds.includes(update.id)}
                        onCheckedChange={() => handleSelectUpdate(update.id)}
                      />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <span className="font-mono text-[0.85rem]">{update.id}</span>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <div className="max-w-sm">
                        <div className="font-medium truncate text-[0.85rem]">{update.title}</div>
                        <div className="text-[0.75rem] text-muted-foreground truncate">
                          {update.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant="outline" className="text-[0.75rem] px-1.5 py-0.5 capitalize">
                        {update.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant="outline" className={`${getStatusColor(update.status)} text-[0.75rem] px-1.5 py-0.5`}>
                        {update.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge className={`${getSeverityColor(update.severity)} text-[0.75rem] px-1.5 py-0.5`}>
                        {update.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <span className="font-mono text-[0.8rem]">{update.version}</span>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <span className="text-[0.8rem]">{update.size}</span>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <div className="text-[0.8rem]">
                        {format(new Date(update.date), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleViewDetails(update.id)}
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {update.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSchedule(update.id);
                              }}
                              title="Schedule"
                            >
                              <Calendar className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInstall(update.id);
                              }}
                              title="Install Now"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {update.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInstall(update.id);
                            }}
                            title="Retry"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialogs */}
        <ScheduleUpdateDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          updateTitle={selectedUpdate?.title}
          onSchedule={handleScheduleConfirm}
        />

        <UpdateDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          update={selectedUpdate}
        />
      </div>
    </div>
  );
}
