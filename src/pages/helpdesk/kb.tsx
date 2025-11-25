import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Download, Filter, Calendar, Eye, Edit, Trash2, BarChart, BookOpen, LayoutDashboard, FileText, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

interface KBArticle {
  id: number;
  title: string;
  category: string;
  created_by: string;
  updated_at: string;
  status: 'published' | 'draft';
  views: number;
  helpful_count: number;
}

export default function KnowledgeBaseModule() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Empty articles array - ready for backend data
  const allArticles: KBArticle[] = [];

  // Client-side filtering
  const articles = allArticles.filter((article) => {
    if (statusFilter !== 'all' && article.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && article.category !== categoryFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchesSearch = article.title?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    return true;
  });

  const handleSelectArticle = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? articles.map(a => a.id) : []);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-300';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-4 pt-2 pb-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <TabsList className="h-8">
              <TabsTrigger value="overview" className="gap-1.5 px-3 text-sm h-7">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="articles" className="gap-1.5 px-3 text-sm h-7">
                <BookOpen className="h-3.5 w-3.5" />
                Articles
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("articles")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-bold">0</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Total Articles</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("articles")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <BookOpen className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold">0</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Published</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("articles")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <span className="text-2xl font-bold">0</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Draft</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("articles")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-2xl font-bold">0</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="articles" className="space-y-2 mt-2">
            {/* Compact Single Row Header - Match Tickets Layout */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
          <div className="relative w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Getting Started">Getting Started</SelectItem>
                <SelectItem value="Account Management">Account Management</SelectItem>
                <SelectItem value="Troubleshooting">Troubleshooting</SelectItem>
                <SelectItem value="Integrations">Integrations</SelectItem>
              </SelectContent>
            </Select>

              <Button size="sm" className="gap-1.5 h-8">
                <Download className="h-3.5 w-3.5" />
                <span className="text-sm">New Article</span>
              </Button>
            </div>
          </div>

        {/* Table View - Match Tickets Layout */}
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
            <div className="rounded-full bg-muted p-4 mb-3">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-1">No articles found</h3>
            <p className="text-xs text-muted-foreground mb-4 text-center max-w-md">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? "Try adjusting your filters to see more articles"
                : "Get started by creating your first knowledge base article"}
            </p>
            {searchQuery === '' && statusFilter === 'all' && categoryFilter === 'all' && (
              <Button size="sm" className="gap-1.5 h-8">
                <Download className="h-3.5 w-3.5" />
                <span className="text-sm">Create First Article</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden text-[0.85rem]">
            <Table>
              <TableHeader>
                <TableRow className="h-9">
                  <TableHead className="w-10 py-2">
                    <Checkbox
                      checked={selectedIds.length === articles.length && articles.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="py-2">Title</TableHead>
                  <TableHead className="py-2">Category</TableHead>
                  <TableHead className="py-2">Status</TableHead>
                  <TableHead className="py-2">Created By</TableHead>
                  <TableHead className="py-2">Views</TableHead>
                  <TableHead className="py-2">Helpful</TableHead>
                  <TableHead className="py-2">Last Updated</TableHead>
                  <TableHead className="text-right py-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow 
                    key={article.id} 
                    className="cursor-pointer hover:bg-muted/50 h-11"
                  >
                    <TableCell onClick={(e) => e.stopPropagation()} className="py-1.5">
                      <Checkbox
                        checked={selectedIds.includes(article.id)}
                        onCheckedChange={() => handleSelectArticle(article.id)}
                      />
                    </TableCell>
                    <TableCell className="py-1.5">
                      <div className="max-w-md">
                        <div className="font-medium truncate text-[0.85rem]">{article.title}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant="outline" className="text-[0.75rem] px-1.5 py-0.5">
                        {article.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant="outline" className={`${getStatusColor(article.status)} text-[0.75rem] px-1.5 py-0.5 capitalize`}>
                        {article.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <span className="text-[0.8rem]">{article.created_by}</span>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <span className="text-[0.8rem]">{article.views.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <span className="text-[0.8rem]">{article.helpful_count}</span>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <div className="text-[0.8rem]">
                        {format(new Date(article.updated_at), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
