import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useHelpdeskModuleStats = () => {
  return useQuery({
    queryKey: ["helpdesk-module-stats"],
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

      // Fetch all stats in parallel
      const [
        ticketsData,
        srmData,
        assetsData,
        subscriptionsData,
        systemUpdatesData,
        monitoringData,
      ] = await Promise.all([
        // Tickets
        supabase
          .from("helpdesk_tickets")
          .select("*", { count: "exact", head: false })
          .eq("is_deleted", false)
          .then(({ data, count }) => ({
            total: count || 0,
            open: data?.filter(t => t.status === "open").length || 0,
            inProgress: data?.filter(t => t.status === "in_progress").length || 0,
            resolved: data?.filter(t => t.status === "resolved").length || 0,
          })),

        // Service Requests
        supabase
          .from("srm_requests")
          .select("*", { count: "exact", head: false })
          .then(({ data, count }) => ({
            total: count || 0,
            pending: data?.filter(r => r.status === "pending").length || 0,
            approved: data?.filter(r => r.status === "approved").length || 0,
            fulfilled: data?.filter(r => r.status === "fulfilled").length || 0,
          })),

        // Assets
        supabase
          .from("itam_assets")
          .select("*", { count: "exact", head: false })
          .eq("is_deleted", false)
          .then(({ data, count }) => ({
            total: count || 0,
            available: data?.filter(a => a.status === "available").length || 0,
            assigned: data?.filter(a => a.status === "assigned").length || 0,
            inRepair: data?.filter(a => a.status === "in_repair").length || 0,
          })),

        // Subscriptions
        supabase
          .from("subscriptions_tools")
          .select("*", { count: "exact", head: false })
          .then(({ data, count }) => ({
            total: count || 0,
            active: data?.filter(s => s.status === "active").length || 0,
            expiringSoon: data?.filter(s => {
              if (!s.renewal_date) return false;
              const daysUntilRenewal = Math.ceil(
                (new Date(s.renewal_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              return daysUntilRenewal <= 30 && daysUntilRenewal >= 0;
            }).length || 0,
          })),

        // System Updates
        supabase
          .from("system_devices")
          .select("*", { count: "exact", head: false })
          .then(({ data, count }) => ({
            total: count || 0,
            compliant: data?.filter(d => d.failed_updates_count === 0).length || 0,
            nonCompliant: data?.filter(d => d.failed_updates_count > 0).length || 0,
            pendingUpdates: data?.filter(d => d.failed_updates_count > 0).length || 0,
          })),

        // Monitoring (Critical Systems)
        supabase
          .from("critical_systems")
          .select("*", { count: "exact", head: false })
          .then(({ data, count }) => ({
            total: count || 0,
            healthy: data?.filter(s => s.status === "healthy").length || 0,
            warning: data?.filter(s => s.status === "warning").length || 0,
            critical: data?.filter(s => s.status === "critical").length || 0,
          })),
      ]);

      // KB Stats (mock data for now as there's no KB table in the schema)
      const kbData = {
        total: 0,
        published: 0,
        draft: 0,
        views: 0,
      };

      // Audit Logs
      const auditData = await supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .then(({ count }) => ({
          last30Days: count || 0,
        }));

      return {
        tickets: ticketsData,
        serviceRequests: srmData,
        assets: assetsData,
        subscriptions: subscriptionsData,
        systemUpdates: systemUpdatesData,
        monitoring: monitoringData,
        kb: kbData,
        audit: auditData,
      };
    },
  });
};
