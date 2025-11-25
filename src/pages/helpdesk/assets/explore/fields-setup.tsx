import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Building2, MapPin, FolderTree, Briefcase, Hash } from "lucide-react";
import { toast } from "sonner";

export default function FieldsSetupPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("company");

  // Mock data - would be from DB in production
  const [sites, setSites] = useState([
    { id: 1, name: "Head Office", code: "HO", address: "123 Main St" },
    { id: 2, name: "Branch Office", code: "BR", address: "456 Side St" },
  ]);

  const [locations, setLocations] = useState([
    { id: 1, name: "Server Room", site: "Head Office", floor: "3rd Floor" },
    { id: 2, name: "Office Space", site: "Head Office", floor: "2nd Floor" },
  ]);

  const [categories, setCategories] = useState([
    { id: 1, name: "Laptop", code: "LTP" },
    { id: 2, name: "Desktop", code: "DSK" },
    { id: 3, name: "Monitor", code: "MON" },
  ]);

  const [departments, setDepartments] = useState([
    { id: 1, name: "IT", code: "IT" },
    { id: 2, name: "Finance", code: "FIN" },
    { id: 3, name: "HR", code: "HR" },
  ]);

  const [tagFormat, setTagFormat] = useState({
    prefix: "RT-",
    startNumber: "0001",
    autoIncrement: true,
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">Fields Setup</h1>
            <p className="text-sm text-muted-foreground">Configure asset management fields</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="tag-format">Tag Format</TabsTrigger>
          </TabsList>

          {/* Company Info */}
          <TabsContent value="company" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Update your company profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" placeholder="Enter company name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-code">Company Code</Label>
                    <Input id="company-code" placeholder="e.g., ACME" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Address</Label>
                  <Textarea id="company-address" placeholder="Enter company address" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-email">Email</Label>
                    <Input id="company-email" type="email" placeholder="contact@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">Phone</Label>
                    <Input id="company-phone" placeholder="+1234567890" />
                  </div>
                </div>
                <Button size="sm">Save Company Info</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sites */}
          <TabsContent value="sites" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Sites
                  </CardTitle>
                  <CardDescription className="text-xs">Manage site locations</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-3 w-3 mr-2" />
                  Add Site
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NAME</TableHead>
                      <TableHead>CODE</TableHead>
                      <TableHead>ADDRESS</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sites.map((site) => (
                      <TableRow key={site.id}>
                        <TableCell className="font-medium">{site.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{site.code}</Badge>
                        </TableCell>
                        <TableCell>{site.address}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations */}
          <TabsContent value="locations" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Locations
                  </CardTitle>
                  <CardDescription className="text-xs">Manage locations within sites</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-3 w-3 mr-2" />
                  Add Location
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NAME</TableHead>
                      <TableHead>SITE</TableHead>
                      <TableHead>FLOOR</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">{location.name}</TableCell>
                        <TableCell>{location.site}</TableCell>
                        <TableCell>{location.floor}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderTree className="h-4 w-4" />
                    Categories
                  </CardTitle>
                  <CardDescription className="text-xs">Manage asset categories</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-3 w-3 mr-2" />
                  Add Category
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NAME</TableHead>
                      <TableHead>CODE</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{category.code}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departments */}
          <TabsContent value="departments" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Departments
                  </CardTitle>
                  <CardDescription className="text-xs">Manage departments</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-3 w-3 mr-2" />
                  Add Department
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NAME</TableHead>
                      <TableHead>CODE</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{dept.code}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tag Format */}
          <TabsContent value="tag-format" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Asset Tag Format
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure how asset tags are generated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tag-prefix">Prefix</Label>
                    <Input
                      id="tag-prefix"
                      value={tagFormat.prefix}
                      onChange={(e) => setTagFormat({ ...tagFormat, prefix: e.target.value })}
                      placeholder="e.g., RT-, IT-, AS-"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tag-start">Starting Number</Label>
                    <Input
                      id="tag-start"
                      value={tagFormat.startNumber}
                      onChange={(e) => setTagFormat({ ...tagFormat, startNumber: e.target.value })}
                      placeholder="e.g., 0001, 0100, 5000"
                    />
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <div className="text-sm font-medium mb-2">Preview:</div>
                  <div className="text-lg font-mono">
                    {tagFormat.prefix}{tagFormat.startNumber}
                  </div>
                </div>
                <Button size="sm" onClick={() => toast.success("Tag format saved")}>
                  Save Tag Format
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
