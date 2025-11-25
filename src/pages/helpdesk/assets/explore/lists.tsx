import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ListsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("maintenances");

  const { data: maintenances = [], isLoading: maintenancesLoading } = useQuery({
    queryKey: ["asset-maintenances"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profileData } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      const tenantId = profileData?.tenant_id || 1;

      const { data } = await supabase
        .from("asset_maintenance")
        .select("*, itam_assets(asset_id, brand, model)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      return data || [];
    },
  });

  const { data: warranties = [], isLoading: warrantiesLoading } = useQuery({
    queryKey: ["asset-warranties"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profileData } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      const tenantId = profileData?.tenant_id || 1;

      const { data } = await supabase
        .from("asset_warranties")
        .select("*, itam_assets(asset_id, brand, model)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">Lists</h1>
            <p className="text-sm text-muted-foreground">View maintenance and warranty records</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="maintenances">Maintenances</TabsTrigger>
            <TabsTrigger value="warranties">Warranties</TabsTrigger>
          </TabsList>

          <TabsContent value="maintenances" className="mt-4">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ASSET ID</TableHead>
                    <TableHead>BRAND / MODEL</TableHead>
                    <TableHead>ISSUE</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead>COST</TableHead>
                    <TableHead>CREATED</TableHead>
                    <TableHead>RESOLVED</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenancesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading maintenances...
                      </TableCell>
                    </TableRow>
                  ) : maintenances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No maintenance records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    maintenances.map((maintenance) => (
                      <TableRow key={maintenance.id}>
                        <TableCell className="font-medium">
                          {maintenance.itam_assets?.asset_id || "—"}
                        </TableCell>
                        <TableCell>
                          {maintenance.itam_assets?.brand} {maintenance.itam_assets?.model}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {maintenance.issue_description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={maintenance.status === "resolved" ? "default" : "secondary"}
                          >
                            {maintenance.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{maintenance.cost ? `$${maintenance.cost}` : "—"}</TableCell>
                        <TableCell>
                          {format(new Date(maintenance.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {maintenance.resolved_at
                            ? format(new Date(maintenance.resolved_at), "MMM dd, yyyy")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="warranties" className="mt-4">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ASSET ID</TableHead>
                    <TableHead>BRAND / MODEL</TableHead>
                    <TableHead>WARRANTY START</TableHead>
                    <TableHead>WARRANTY END</TableHead>
                    <TableHead>AMC START</TableHead>
                    <TableHead>AMC END</TableHead>
                    <TableHead>STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warrantiesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading warranties...
                      </TableCell>
                    </TableRow>
                  ) : warranties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No warranty records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    warranties.map((warranty) => {
                      const warrantyEnd = warranty.warranty_end ? new Date(warranty.warranty_end) : null;
                      const isExpired = warrantyEnd && warrantyEnd < new Date();
                      const isExpiringSoon = warrantyEnd && warrantyEnd > new Date() && 
                        warrantyEnd < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                      return (
                        <TableRow key={warranty.id}>
                          <TableCell className="font-medium">
                            {warranty.itam_assets?.asset_id || "—"}
                          </TableCell>
                          <TableCell>
                            {warranty.itam_assets?.brand} {warranty.itam_assets?.model}
                          </TableCell>
                          <TableCell>
                            {warranty.warranty_start
                              ? format(new Date(warranty.warranty_start), "MMM dd, yyyy")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {warranty.warranty_end
                              ? format(new Date(warranty.warranty_end), "MMM dd, yyyy")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {warranty.amc_start
                              ? format(new Date(warranty.amc_start), "MMM dd, yyyy")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {warranty.amc_end
                              ? format(new Date(warranty.amc_end), "MMM dd, yyyy")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                isExpired ? "destructive" : isExpiringSoon ? "secondary" : "default"
                              }
                            >
                              {isExpired ? "Expired" : isExpiringSoon ? "Expiring Soon" : "Active"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
