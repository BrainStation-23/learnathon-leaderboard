
import Papa from "papaparse";
import { TeamDashboardData } from "@/types";
import { formatDistanceToNow, format } from "date-fns";

/**
 * Converts repository data to CSV format and triggers a download
 */
export const exportRepositoriesToCsv = (repositories: TeamDashboardData[]): void => {
  // Format data for CSV
  const csvData = repositories.map((repo) => ({
    RepositoryName: repo.repoData.name,
    Description: repo.repoData.description || 'N/A',
    LastCommitDate: repo.repoData.last_commit_date 
      ? format(new Date(repo.repoData.last_commit_date), 'yyyy-MM-dd') 
      : 'N/A',
    LastUpdated: repo.repoData.last_commit_date 
      ? formatDistanceToNow(new Date(repo.repoData.last_commit_date), { addSuffix: true })
      : 'N/A',
    Contributors: repo.repoData.contributors_count || 'N/A',
    CommitsCount: repo.repoData.commits_count || 'N/A',
    SecurityIssuesCount: repo.securityIssues?.length || 0,
    GitHubUrl: repo.repoData.html_url || 'N/A'
  }));

  // Convert to CSV string using PapaParse
  const csv = Papa.unparse(csvData, {
    header: true,
    delimiter: ",",
  });

  // Create Blob and download link
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  // Set download attributes
  const date = new Date().toISOString().split('T')[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `repositories-export-${date}.csv`);
  link.style.visibility = 'hidden';
  
  // Append to document, trigger download and cleanup
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
