
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Repository {
  id: string;
  name: string;
  description: string | null;
  isFiltered: boolean;
  reason: string;
  label: string | null;
}

interface RepoFilterListProps {
  repositories: Repository[];
  setRepositories: React.Dispatch<React.SetStateAction<any[]>>;
  setFilteredRepos: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function RepoFilterList({ repositories, setRepositories, setFilteredRepos }: RepoFilterListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [reason, setReason] = useState("");
  const [label, setLabel] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const filterLabels = [
    { value: "dropped-out", label: "Dropped Out" },
    { value: "no-contact", label: "No Contact" },
    { value: "got-job", label: "Got Job" },
    { value: "other", label: "Other" },
  ];

  const handleFilterRepo = async (repo: Repository) => {
    setSelectedRepo(repo);
    setReason(repo.reason || "");
    setLabel(repo.label || null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedRepo) return;
    
    setSubmitting(true);
    try {
      // Insert into filtered_repositories with type assertion
      const { error } = await (supabase
        .from('filtered_repositories' as any)
        .insert({
          repository_id: selectedRepo.id,
          reason: reason.trim(),
          label: label
        }));
      
      if (error) throw error;
      
      // Update local state
      const updatedRepositories = repositories.map(repo => 
        repo.id === selectedRepo.id 
          ? { ...repo, isFiltered: true, reason, label } 
          : repo
      );
      
      setRepositories(updatedRepositories);
      setFilteredRepos(updatedRepositories.filter(repo => repo.isFiltered));
      
      toast({
        title: "Repository filtered",
        description: `${selectedRepo.name} has been excluded from the leaderboard.`,
      });
      
      setDialogOpen(false);
    } catch (error) {
      console.error("Error filtering repository:", error);
      toast({
        title: "Error filtering repository",
        description: "Failed to filter repository. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (repositories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No repositories found matching your criteria.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Repository</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repositories.map((repo) => (
              <TableRow key={repo.id} className={repo.isFiltered ? "bg-muted/30" : ""}>
                <TableCell className="font-medium">{repo.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {repo.description || "No description"}
                </TableCell>
                <TableCell>
                  {repo.isFiltered ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled
                    >
                      Filtered
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleFilterRepo(repo)}
                    >
                      Filter
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Repository</DialogTitle>
            <DialogDescription>
              This repository will be excluded from the leaderboard and dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="repoName">Repository</Label>
              <Input id="repoName" value={selectedRepo?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Why is this repository being filtered?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label (optional)</Label>
              <Select value={label || undefined} onValueChange={setLabel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a label" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {filterLabels.map((filterLabel) => (
                    <SelectItem key={filterLabel.value} value={filterLabel.value}>
                      {filterLabel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Filtering...
                </>
              ) : (
                "Filter Repository"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
