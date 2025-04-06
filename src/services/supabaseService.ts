
// This file is kept for backwards compatibility
// It re-exports functionality from the new service files

import { saveRepositoryData as _saveRepositoryData, ProgressCallback } from './repository/repositoryService';
import { saveSonarData as _saveSonarData } from './sonar/sonarService';
import { fetchDashboardData as _fetchDashboardData } from './dashboard/dashboardService';

// Re-export the functions with the same names as before
export const saveRepositoryData = _saveRepositoryData;
export const saveSonarData = _saveSonarData;
export const fetchDashboardData = _fetchDashboardData;

// Export the types as well
export type { ProgressCallback };
