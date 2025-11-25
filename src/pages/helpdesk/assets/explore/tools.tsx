import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileImage, File, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ToolsPage() {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImporting(true);
      // Simulate import
      setTimeout(() => {
        setImporting(false);
        toast.success(`Imported ${file.name} successfully`);
      }, 2000);
    }
  };

  const handleExport = () => {
    toast.success("Export initiated");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">Tools</h1>
            <p className="text-sm text-muted-foreground">Import, export, and manage asset data</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Import */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import Assets
              </CardTitle>
              <CardDescription className="text-xs">
                Upload CSV or Excel file to import assets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input type="file" accept=".csv,.xlsx" onChange={handleImport} disabled={importing} />
              <Button size="sm" variant="outline" className="w-full" disabled={importing}>
                {importing ? "Importing..." : "Choose File"}
              </Button>
            </CardContent>
          </Card>

          {/* Export */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Assets
              </CardTitle>
              <CardDescription className="text-xs">
                Download asset data as CSV or Excel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button size="sm" onClick={handleExport} className="w-full">
                <Download className="h-3 w-3 mr-2" />
                Export All Assets
              </Button>
            </CardContent>
          </Card>

          {/* Documents Gallery */}
          <Card className="hover:border-primary cursor-pointer transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <File className="h-4 w-4" />
                Documents Gallery
              </CardTitle>
              <CardDescription className="text-xs">
                View and manage all asset documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="outline" className="w-full">
                Open Gallery
              </Button>
            </CardContent>
          </Card>

          {/* Image Gallery */}
          <Card className="hover:border-primary cursor-pointer transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileImage className="h-4 w-4" />
                Image Gallery
              </CardTitle>
              <CardDescription className="text-xs">
                View and manage all asset images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="outline" className="w-full">
                Open Gallery
              </Button>
            </CardContent>
          </Card>

          {/* Audit */}
          <Card className="hover:border-primary cursor-pointer transition-colors md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Audit Activity Log
              </CardTitle>
              <CardDescription className="text-xs">
                Track all changes and activities on assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="outline" className="w-full">
                View Audit Log
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
