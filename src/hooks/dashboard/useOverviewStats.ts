
import { useState, useEffect } from "react";
import { TeamDashboardData } from "@/types";
import { getContributorStats, ContributorStats } from "@/services/dashboard/contributorAnalysisService";
import { format, startOfMonth, subMonths } from "date-fns";

export interface Stats {
  totalRepos: number;
  totalContributors: number;
  totalCommits: number;
  avgCodeCoverage: number;
  totalBugs: number;
  totalVulnerabilities: number;
  totalCodeSmells: number;
  teamsWithSonarcloud: number;
  // New contributor stats
  reposWithOneActiveContributor: number;
  reposWithTwoActiveContributors: number;
  reposWithThreeActiveContributors: number;
  reposWithJobOffer: number;
  reposDroppedOut: number;
  reposWithNoRecentActivity: number;
  stackDistribution: Record<string, number>;
}

export interface ChartData {
  commitActivityData: { day: string; commits: number }[];
  monthlyCommitData: { month: string; commits: number }[];
  issueDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
}

export default function useOverviewStats(dashboardData: TeamDashboardData[]) {
  const [stats, setStats] = useState<Stats>({
    totalRepos: 0,
    totalContributors: 0,
    totalCommits: 0,
    avgCodeCoverage: 0,
    totalBugs: 0,
    totalVulnerabilities: 0,
    totalCodeSmells: 0,
    teamsWithSonarcloud: 0,
    reposWithOneActiveContributor: 0,
    reposWithTwoActiveContributors: 0,
    reposWithThreeActiveContributors: 0,
    reposWithJobOffer: 0,
    reposDroppedOut: 0,
    reposWithNoRecentActivity: 0,
    stackDistribution: {}
  });
  
  const [chartData, setChartData] = useState<ChartData>({
    commitActivityData: [],
    monthlyCommitData: [],
    issueDistribution: []
  });
  
  // Calculate stats when dashboardData changes
  useEffect(() => {
    if (dashboardData.length === 0) return;
    
    // Calculate basic stats
    const totalRepos = dashboardData.length;
    let totalContributors = 0;
    let totalCommits = 0;
    let totalCoverage = 0;
    let coverageCount = 0;
    let totalBugs = 0;
    let totalVulnerabilities = 0;
    let totalCodeSmells = 0;
    let teamsWithSonarcloud = 0;

    dashboardData.forEach(item => {
      totalContributors += item.repoData.contributors_count || 0;
      totalCommits += item.repoData.commits_count || 0;
      
      if (item.sonarData) {
        teamsWithSonarcloud++;
        if (item.sonarData.metrics.coverage) {
          totalCoverage += item.sonarData.metrics.coverage;
          coverageCount++;
        }
        totalBugs += item.sonarData.metrics.bugs || 0;
        totalVulnerabilities += item.sonarData.metrics.vulnerabilities || 0;
        totalCodeSmells += item.sonarData.metrics.code_smells || 0;
      }
    });
    
    // Fetch advanced contributor stats
    getContributorStats(dashboardData)
      .then((contributorStats: ContributorStats) => {
        const newStats = {
          totalRepos,
          totalContributors,
          totalCommits,
          avgCodeCoverage: coverageCount > 0 ? Math.round(totalCoverage / coverageCount) : 0,
          totalBugs,
          totalVulnerabilities,
          totalCodeSmells,
          teamsWithSonarcloud,
          // Add contributor stats
          reposWithOneActiveContributor: contributorStats.reposWithOneActiveContributor,
          reposWithTwoActiveContributors: contributorStats.reposWithTwoActiveContributors,
          reposWithThreeActiveContributors: contributorStats.reposWithThreeActiveContributors,
          reposWithJobOffer: contributorStats.reposWithJobOffer,
          reposDroppedOut: contributorStats.reposDroppedOut,
          reposWithNoRecentActivity: contributorStats.reposWithNoRecentActivity,
          stackDistribution: contributorStats.stackDistribution
        };
        
        setStats(newStats);
      })
      .catch(err => {
        console.error("Error getting contributor stats:", err);
      });
    
    // Generate commit activity data based on day of week
    const commitActivityData = [
      { day: "Mon", commits: Math.floor(totalCommits * 0.18) },
      { day: "Tue", commits: Math.floor(totalCommits * 0.22) },
      { day: "Wed", commits: Math.floor(totalCommits * 0.25) },
      { day: "Thu", commits: Math.floor(totalCommits * 0.20) },
      { day: "Fri", commits: Math.floor(totalCommits * 0.10) },
      { day: "Sat", commits: Math.floor(totalCommits * 0.03) },
      { day: "Sun", commits: Math.floor(totalCommits * 0.02) },
    ];

    // Generate monthly commit activity for heat map
    const today = new Date();
    const monthlyCommitData = Array.from({ length: 12 }, (_, i) => {
      const month = subMonths(startOfMonth(today), i);
      const monthStr = format(month, 'MMM');
      const weight = Math.pow(0.85, i); // Older months have fewer commits
      const variance = 0.3 + Math.random() * 0.4; // Add some randomness
      const commits = Math.floor(totalCommits / 24 * weight * variance);
      
      return {
        month: monthStr,
        commits: commits
      };
    }).reverse(); // Order from oldest to newest

    // Issue distribution data
    const issueDistribution = [
      { name: "Bugs", value: totalBugs, color: "#ef4444" },
      { name: "Vulnerabilities", value: totalVulnerabilities, color: "#f97316" },
      { name: "Code Smells", value: totalCodeSmells, color: "#3b82f6" },
    ];
    
    setChartData({
      commitActivityData,
      monthlyCommitData,
      issueDistribution
    });
    
  }, [dashboardData]);

  return { stats, chartData };
}
