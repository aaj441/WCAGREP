import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "./status-badge";
import { Search, Mail, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";

interface Prospect {
  id: string;
  company: string;
  industry: string;
  icpScore: number;
  violations: number;
  violationSeverity?: string;
  status: "active" | "paused" | "completed";
  riskLevel: "high-risk" | "medium-risk" | "low-risk";
  lastContact: string;
  currentTouch?: string;
  nextTouch?: string;
}

interface ProspectTableProps {
  prospects: Prospect[];
}

export function ProspectTable({ prospects }: ProspectTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Prospect>("icpScore");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: keyof Prospect) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredProspects = prospects
    .filter(p => 
      p.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.industry.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === undefined || bVal === undefined) return 0;
      const multiplier = sortDirection === "asc" ? 1 : -1;
      return aVal > bVal ? multiplier : -multiplier;
    });

  return (
    <div className="space-y-4" data-testid="prospect-table">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prospects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-prospects"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover-elevate px-2 py-1 rounded"
                  onClick={() => handleSort("company")}
                >
                  Company
                  {sortField === "company" && (
                    sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover-elevate px-2 py-1 rounded"
                  onClick={() => handleSort("violations")}
                >
                  Violations
                  {sortField === "violations" && (
                    sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center gap-1 hover-elevate px-2 py-1 rounded"
                  onClick={() => handleSort("icpScore")}
                >
                  ICP Score
                  {sortField === "icpScore" && (
                    sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next Touch</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProspects.map((prospect) => (
              <TableRow key={prospect.id} className="hover-elevate" data-testid={`row-prospect-${prospect.id}`}>
                <TableCell className="font-medium">{prospect.company}</TableCell>
                <TableCell className="text-muted-foreground">{prospect.industry}</TableCell>
                <TableCell>
                  <div>
                    <span className="font-semibold">{prospect.violations}</span>
                    {prospect.violationSeverity && (
                      <span className="text-xs text-red-600 ml-1">{prospect.violationSeverity}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-lg ${
                      prospect.icpScore >= 80 ? 'text-green-600' : 
                      prospect.icpScore >= 50 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {prospect.icpScore}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {prospect.currentTouch && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {prospect.currentTouch}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {prospect.nextTouch || prospect.lastContact}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" data-testid={`button-view-${prospect.id}`}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
