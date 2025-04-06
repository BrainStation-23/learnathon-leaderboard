
import { GitHubContributor } from "./index";

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
  techStacks?: string[];
}
