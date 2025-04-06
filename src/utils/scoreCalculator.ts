
import { SonarMetrics } from "@/types";

/**
 * Calculate code coverage score out of 20 points
 */
export function calculateCoverageScore(coverage: number | null | undefined): number {
  if (coverage === null || coverage === undefined) return 0;
  
  if (coverage >= 90) return 20;
  if (coverage >= 80) return 17;
  if (coverage >= 70) return 14;
  if (coverage >= 60) return 10;
  return 5;
}

/**
 * Calculate bugs score out of 15 points
 */
export function calculateBugsScore(bugs: number | null | undefined): number {
  if (bugs === null || bugs === undefined) return 0;
  
  if (bugs <= 1) return 15;
  if (bugs <= 3) return 12;
  if (bugs <= 6) return 9;
  if (bugs <= 10) return 5;
  return 2;
}

/**
 * Calculate vulnerabilities score out of 15 points
 */
export function calculateVulnerabilitiesScore(vulnerabilities: number | null | undefined): number {
  if (vulnerabilities === null || vulnerabilities === undefined) return 0;
  
  if (vulnerabilities === 0) return 15;
  if (vulnerabilities === 1) return 12;
  if (vulnerabilities <= 3) return 9;
  if (vulnerabilities <= 5) return 5;
  return 2;
}

/**
 * Calculate code smells score out of 20 points
 */
export function calculateCodeSmellsScore(codeSmells: number | null | undefined): number {
  if (codeSmells === null || codeSmells === undefined) return 0;
  
  if (codeSmells <= 10) return 20;
  if (codeSmells <= 25) return 15;
  if (codeSmells <= 50) return 10;
  if (codeSmells <= 100) return 5;
  return 2;
}

/**
 * Calculate technical debt score out of 20 points
 * @param technicalDebt A string like "5d 3h" or "7h"
 */
export function calculateTechnicalDebtScore(technicalDebt: string | null | undefined): number {
  if (!technicalDebt) return 0;
  
  // Convert the technical debt string to hours
  const hours = convertTechnicalDebtToHours(technicalDebt);
  
  if (hours <= 5) return 20;
  if (hours <= 15) return 15;
  if (hours <= 30) return 10;
  if (hours <= 50) return 5;
  return 2;
}

/**
 * Calculate complexity score out of 10 points
 */
export function calculateComplexityScore(complexity: number | null | undefined): number {
  if (complexity === null || complexity === undefined) return 0;
  
  if (complexity <= 50) return 10;
  if (complexity <= 100) return 8;
  if (complexity <= 200) return 6;
  if (complexity <= 300) return 4;
  return 2;
}

/**
 * Calculate the total score for a repository based on its Sonar metrics
 */
export function calculateTotalScore(metrics: SonarMetrics | undefined | null): number {
  if (!metrics) return 0;
  
  const coverageScore = calculateCoverageScore(metrics.coverage);
  const bugsScore = calculateBugsScore(metrics.bugs);
  const vulnerabilitiesScore = calculateVulnerabilitiesScore(metrics.vulnerabilities);
  const codeSmellsScore = calculateCodeSmellsScore(metrics.code_smells);
  const technicalDebtScore = calculateTechnicalDebtScore(metrics.technical_debt);
  const complexityScore = calculateComplexityScore(metrics.complexity);
  
  return coverageScore + bugsScore + vulnerabilitiesScore + 
         codeSmellsScore + technicalDebtScore + complexityScore;
}

/**
 * Helper function to convert technical debt string to hours
 * Handles formats like "5d 3h", "7h", etc.
 */
function convertTechnicalDebtToHours(technicalDebt: string): number {
  const daysMatch = technicalDebt.match(/(\d+)d/);
  const hoursMatch = technicalDebt.match(/(\d+)h/);
  
  let totalHours = 0;
  
  if (daysMatch && daysMatch[1]) {
    totalHours += parseInt(daysMatch[1], 10) * 24;
  }
  
  if (hoursMatch && hoursMatch[1]) {
    totalHours += parseInt(hoursMatch[1], 10);
  }
  
  return totalHours;
}
