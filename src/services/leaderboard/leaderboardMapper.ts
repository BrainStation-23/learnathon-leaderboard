
import { GitHubContributor } from "@/types";
import { LeaderboardItem } from "@/types/leaderboard";
import { 
  calculateCoverageScore, 
  calculateBugsScore,
  calculateVulnerabilitiesScore,
  calculateCodeSmellsScore,
  calculateTechnicalDebtScore,
  calculateComplexityScore,
  calculateTotalScore
} from "@/utils/scoreCalculator";

/**
 * Maps repository data from database to the LeaderboardItem format
 */
export function mapToLeaderboardItem(
  repository: any, 
  contributors: GitHubContributor[], 
  filteredContributorsList: string[]
): LeaderboardItem {
  // Log contributors before filtering
  console.log(`Repository ${repository.name} - All contributors:`, contributors.map(c => c.login));
  
  console.log(`Repository ${repository.name} - Filtering out:`, filteredContributorsList);
  
  // Filter out contributors based on the filtered_contributors list
  let filteredContributors = contributors;
  if (filteredContributorsList && filteredContributorsList.length > 0) {
    filteredContributors = contributors.filter(
      contributor => !filteredContributorsList.includes(contributor.login)
    );
    console.log(`Repository ${repository.name} - After filtering:`, filteredContributors.map(c => c.login));
  } else {
    console.log(`Repository ${repository.name} - No filtering applied, using all contributors`);
  }
  
  // Calculate the commit count based on filtered contributors
  const totalCommits = filteredContributors.reduce(
    (sum, contributor) => sum + contributor.contributions, 
    0
  );
  
  console.log(`Repository ${repository.name} - Total commits after filtering: ${totalCommits}`);

  const metrics = {
    lines_of_code: repository.lines_of_code,
    coverage: repository.coverage,
    bugs: repository.bugs,
    vulnerabilities: repository.vulnerabilities,
    code_smells: repository.code_smells,
    technical_debt: repository.technical_debt,
    complexity: repository.complexity
  };
  
  const totalScore = calculateTotalScore(metrics);
  
  return {
    repositoryId: repository.id,
    repositoryName: repository.name,
    totalScore,
    linesOfCode: repository.lines_of_code,
    coverage: repository.coverage,
    coverageScore: calculateCoverageScore(repository.coverage),
    bugs: repository.bugs,
    bugsScore: calculateBugsScore(repository.bugs),
    vulnerabilities: repository.vulnerabilities,
    vulnerabilitiesScore: calculateVulnerabilitiesScore(repository.vulnerabilities),
    codeSmells: repository.code_smells,
    codeSmellsScore: calculateCodeSmellsScore(repository.code_smells),
    technicalDebt: repository.technical_debt,
    technicalDebtScore: calculateTechnicalDebtScore(repository.technical_debt),
    complexity: repository.complexity,
    complexityScore: calculateComplexityScore(repository.complexity),
    lastUpdated: repository.updated_at,
    contributors: filteredContributors,
    commitsCount: totalCommits,
    githubUrl: repository.html_url // Add GitHub URL to the LeaderboardItem
  };
}
