
import Papa from "papaparse";
import { LeaderboardItem } from "@/types/leaderboard";

/**
 * Converts leaderboard data to CSV format and triggers a download
 */
export const exportLeaderboardToCsv = (data: LeaderboardItem[]): void => {
  // Format data for CSV
  const csvData = data.map((item, index) => ({
    Rank: index + 1,
    Repository: item.repositoryName,
    TotalScore: item.totalScore,
    LinesOfCode: item.linesOfCode || 'N/A',
    Coverage: item.coverage ? `${item.coverage.toFixed(2)}%` : 'N/A',
    CoverageScore: item.coverageScore,
    Bugs: item.bugs || 'N/A',
    BugsScore: item.bugsScore,
    Vulnerabilities: item.vulnerabilities || 'N/A',
    VulnerabilitiesScore: item.vulnerabilitiesScore,
    CodeSmells: item.codeSmells || 'N/A',
    CodeSmellsScore: item.codeSmellsScore,
    TechnicalDebt: item.technicalDebt || 'N/A',
    TechnicalDebtScore: item.technicalDebtScore,
    Complexity: item.complexity || 'N/A',
    ComplexityScore: item.complexityScore,
    Contributors: item.contributors ? item.contributors.length : 0,
    Commits: item.commitsCount || 'N/A',
    TechStacks: item.techStacks ? item.techStacks.join(", ") : 'N/A',
    LastUpdated: new Date(item.lastUpdated).toLocaleDateString(),
    GitHubUrl: item.githubUrl || 'N/A'
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
  link.setAttribute("download", `leaderboard-export-${date}.csv`);
  link.style.visibility = 'hidden';
  
  // Append to document, trigger download and cleanup
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
