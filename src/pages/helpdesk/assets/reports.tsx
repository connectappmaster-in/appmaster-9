import { BackButton } from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, TrendingUp, Package, DollarSign } from "lucide-react";

const AssetReports = () => {
  const reports = [
    {
      title: "Asset Inventory Report",
      description: "Complete list of all assets with details",
      icon: Package,
    },
    {
      title: "Assignment History",
      description: "Historical record of asset assignments",
      icon: FileText,
    },
    {
      title: "Repair Cost Analysis",
      description: "Analysis of repair and maintenance costs",
      icon: DollarSign,
    },
    {
      title: "Utilization Report",
      description: "Asset and license utilization metrics",
      icon: TrendingUp,
    },
    {
      title: "Warranty Expiry Report",
      description: "Assets with expiring warranties",
      icon: FileText,
    },
    {
      title: "Depreciation Report",
      description: "Asset depreciation calculations",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Generate insights and export data
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <Card key={report.title} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <report.icon className="h-8 w-8 text-primary" />
                <Button size="sm" variant="ghost">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <h3 className="font-semibold mb-2">{report.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <Button size="sm" variant="outline" className="w-full">
                Generate Report
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssetReports;
