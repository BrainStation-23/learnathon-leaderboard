
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TeamDashboardData, GitHubContributor } from "@/types";
import { calculateTotalScore } from "@/utils/scoreCalculator";

export interface LeaderboardItem {
  repositoryId: string;
  repositoryName: string;
  totalScore: number;
  linesOfCode: number | null;
  coverage: number | null;
  coverageScore: number;
  bugs: number | null;
  bugsScore: number;
  vulnerabilities: number | null;
  vulnerabilitiesScore: number;
  codeSmells: number | null;
  codeSmellsScore: number;
  technicalDebt: string | null;
  technicalDebtScore: number;
  complexity: number | null;
  complexityScore: number;
  lastUpdated: string;
  contributors?: GitHubContributor[];
  commitsCount?: number;
}

export function useLeaderboardData() {
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filteredContributors, setFilteredContributors] = useState<string[]>([]);

  // Function to fetch filter settings
  const fetchFilterSettings = async () => {
    try {
      // Get the filtered contributors list from the most recent configuration
      const { data, error } = await supabase
        .from('configurations')
        .select('filtered_contributors')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!error && data && data.filtered_contributors) {
        setFilteredContributors(data.filtered_contributors);
      }
    } catch (err) {
      console.error("Error fetching filter settings:", err);
      // We don't set an error state here as this is optional enhancement
    }
  };

  const fetchLeaderboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch filter settings first to ensure we have the latest filters
      await fetchFilterSettings();
      
      // Use the function that returns repositories with metrics
      const { data: reposData, error: repoError } = await supabase
        .rpc('get_repositories_with_metrics');

      if (repoError) {
        console.error("Error fetching leaderboard data:", repoError);
        setError("Failed to load leaderboard data");
        return;
      }

      // Fetch contributors for each repository
      const contributorPromises = reposData
        .filter(item => item.sonar_project_key) // Only include repos with Sonar data
        .map(async (repo) => {
          const { data: contributors, error: contribError } = await supabase
            .from('contributors')
            .select('*')
            .eq('repository_id', repo.id);
            
          if (contribError) {
            console.error(`Error fetching contributors for ${repo.name}:`, contribError);
            return { repoId: repo.id, contributors: [] };
          }
          
          // Convert to GitHubContributor format
          const formattedContributors: GitHubContributor[] = contributors.map(c => ({
            id: c.github_id,
            login: c.login,
            avatar_url: c.avatar_url || '',
            contributions: c.contributions
          }));
          
          return { repoId: repo.id, contributors: formattedContributors };
        });
        
      const contributorsResults = await Promise.all(contributorPromises);
      const contributorsMap = contributorsResults.reduce((acc, item) => {
        acc[item.repoId] = item.contributors;
        return acc;
      }, {} as Record<string, GitHubContributor[]>);

      // Process the data to calculate scores
      const leaderboardItems = reposData
        .filter(item => item.sonar_project_key) // Only include repos with Sonar data
        .map(item => {
          const metrics = {
            lines_of_code: item.lines_of_code,
            coverage: item.coverage,
            bugs: item.bugs,
            vulnerabilities: item.vulnerabilities,
            code_smells: item.code_smells,
            technical_debt: item.technical_debt,
            complexity: item.complexity
          };
          
          const totalScore = calculateTotalScore(metrics);
          
          // Filter out contributors based on the filtered_contributors list
          let contributors = contributorsMap[item.id] || [];
          if (filteredContributors.length > 0) {
            contributors = contributors.filter(
              contributor => !filteredContributors.includes(contributor.login)
            );
          }
          
          // Calculate the commit count based on filtered contributors
          const totalCommits = contributors.reduce(
            (sum, contributor) => sum + contributor.contributions, 
            0
          );
          
          return {
            repositoryId: item.id,
            repositoryName: item.name,
            totalScore,
            linesOfCode: item.lines_of_code,
            coverage: item.coverage,
            coverageScore: calculateCoverageScore(item.coverage),
            bugs: item.bugs,
            bugsScore: calculateBugsScore(item.bugs),
            vulnerabilities: item.vulnerabilities,
            vulnerabilitiesScore: calculateVulnerabilitiesScore(item.vulnerabilities),
            codeSmells: item.code_smells,
            codeSmellsScore: calculateCodeSmellsScore(item.code_smells),
            technicalDebt: item.technical_debt,
            technicalDebtScore: calculateTechnicalDebtScore(item.technical_debt),
            complexity: item.complexity,
            complexityScore: calculateComplexityScore(item.complexity),
            lastUpdated: item.updated_at,
            contributors,
            commitsCount: totalCommits
          };
        })
        .sort((a, b) => b.totalScore - a.totalScore); // Sort by total score in descending order
      
      setLeaderboardData(leaderboardItems);
    } catch (err) {
      console.error("Error in leaderboard data processing:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  return {
    loading,
    leaderboardData,
    error,
    refreshData: fetchLeaderboardData
  };
}

// Import calculation functions to use in the hook
import { 
  calculateCoverageScore, 
  calculateBugsScore,
  calculateVulnerabilitiesScore,
  calculateCodeSmellsScore,
  calculateTechnicalDebtScore,
  calculateComplexityScore
} from "@/utils/scoreCalculator";
