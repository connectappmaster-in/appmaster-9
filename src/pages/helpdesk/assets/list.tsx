import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganisation } from "@/contexts/OrganisationContext";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Filter } from "lucide-react";

const AssetsList = () => {
  const navigate = useNavigate();
  const { organisation } = useOrganisation();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["itam-assets-list", organisation?.id, statusFilter, typeFilter],
    queryFn: async () => {
      if (!organisation?.id) return [];
      
      let query = supabase
        .from("itam_assets")
        .select("*")
        .eq("organisation_id", organisation.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (typeFilter && typeFilter !== "all") {
        query = query.or(`type.eq.${typeFilter},category.eq.${typeFilter}`);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!organisation?.id,
  });

  const filteredAssets = assets.filter((asset) =>
    search
      ? asset.name?.toLowerCase().includes(search.toLowerCase()) ||
        asset.asset_tag?.toLowerCase().includes(search.toLowerCase()) ||
        asset.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
        asset.asset_id?.toLowerCase().includes(search.toLowerCase()) ||
        asset.brand?.toLowerCase().includes(search.toLowerCase()) ||
        asset.model?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "in_repair":
        return "bg-yellow-100 text-yellow-800";
      case "retired":
        return "bg-gray-100 text-gray-800";
      case "lost":
        return "bg-red-100 text-red-800";
      case "disposed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleExport = () => {
    // Convert to CSV
    const headers = ["Asset ID", "Brand", "Model", "Description", "Serial No", "Category", "Status", "Assigned To"];
    const csvData = filteredAssets.map((asset) => [
      asset.asset_id || "",
      asset.brand || "",
      asset.model || "",
      asset.description || "",
      asset.serial_number || "",
      asset.category || "",
      asset.status || "",
      asset.assigned_to || "",
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assets-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold">Asset Inventory</h1>
              <p className="text-sm text-muted-foreground">
                {filteredAssets.length} assets found
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => navigate("/helpdesk/assets/add")} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
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
        </div>

        {/* Assets Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ASSET ID</TableHead>
                <TableHead>BRAND</TableHead>
                <TableHead>MODEL</TableHead>
                <TableHead>DESCRIPTION</TableHead>
                <TableHead>SERIAL NO</TableHead>
                <TableHead>CATEGORY</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>ASSIGNED TO</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading assets...
                  </TableCell>
                </TableRow>
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No assets found. Add your first asset to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => navigate(`/helpdesk/assets/detail/${asset.id}`)}
                  >
                    <TableCell>
                      <div className="font-medium">{asset.asset_id || '—'}</div>
                    </TableCell>
                    <TableCell>{asset.brand || '—'}</TableCell>
                    <TableCell>{asset.model || '—'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {asset.description || '—'}
                    </TableCell>
                    <TableCell>{asset.serial_number || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{asset.category || '—'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={asset.status === 'available' ? 'default' : 'secondary'}
                        className={asset.status === 'available' ? 'bg-green-500 text-white' : ''}
                      >
                        {asset.status || 'available'}
                      </Badge>
                    </TableCell>
                    <TableCell>{asset.assigned_to || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/helpdesk/assets/detail/${asset.id}`);
                        }}
                        className="h-8 w-8"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AssetsList;
