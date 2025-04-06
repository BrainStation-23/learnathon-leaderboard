
import { SonarCloudData, SonarMetrics, GitHubRepoData } from "@/types";
import { logger } from "@/services/logService";

export async function fetchSonarCloudData(
  orgSlug: string,
  repos: GitHubRepoData[]
): Promise<Map<string, SonarCloudData>> {
  try {
    const sonarDataMap = new Map<string, SonarCloudData>();
    
    // We'll fetch data for each repo in parallel
    await Promise.all(
      repos.map(async (repo) => {
        try {
          // Try different project key formats
          // Format 1: org_repo-name (common convention)
          // Format 2: org-repo-name (alternative format)
          // Format 3: repo-name (some organizations do this)
          const possibleProjectKeys = [
            `${orgSlug}_${repo.name.replace(/[^a-zA-Z0-9-_]/g, "-")}`,
            `${orgSlug}-${repo.name.replace(/[^a-zA-Z0-9-_]/g, "-")}`,
            `${repo.name.replace(/[^a-zA-Z0-9-_]/g, "-")}`
          ];
          
          let metricsData = null;
          let usedKey = '';
          
          // Try each project key format until we find one that works
          for (const projectKey of possibleProjectKeys) {
            try {
              // Fetch core metrics
              const metricsResponse = await fetch(
                `https://sonarcloud.io/api/measures/component?component=${projectKey}&metricKeys=ncloc,coverage,bugs,vulnerabilities,code_smells,sqale_index,cognitive_complexity`,
                {
                  headers: {
                    Accept: "application/json",
                  },
                }
              );

              if (metricsResponse.ok) {
                metricsData = await metricsResponse.json();
                usedKey = projectKey;
                logger.info(`Found SonarCloud project using key format: ${projectKey}`, {}, 'sonarcloud');
                break; // Found a working key format, stop trying others
              }
            } catch (error) {
              // Continue to the next key format on error
              console.error(`Failed with key format ${projectKey}:`, error);
            }
          }

          if (metricsData) {
            const metrics = extractMetrics(metricsData);
            
            sonarDataMap.set(repo.name, {
              project_key: usedKey,
              name: repo.name,
              metrics,
            });
          } else {
            // Failed with all key formats, log it
            console.log(`No SonarCloud data found for repository: ${repo.name}`);
          }
        } catch (error) {
          console.error(`Error fetching SonarCloud data for ${repo.name}:`, error);
        }
      })
    );

    return sonarDataMap;
  } catch (error) {
    console.error("Error fetching SonarCloud data:", error);
    throw error;
  }
}

function extractMetrics(metricsData: any): SonarMetrics {
  const measures = metricsData.component?.measures || [];
  const metrics: SonarMetrics = {};

  // Map the SonarCloud metrics to our data structure
  measures.forEach((measure: any) => {
    switch (measure.metric) {
      case "ncloc":
        metrics.lines_of_code = parseInt(measure.value, 10);
        break;
      case "coverage":
        metrics.coverage = parseFloat(measure.value);
        break;
      case "bugs":
        metrics.bugs = parseInt(measure.value, 10);
        break;
      case "vulnerabilities":
        metrics.vulnerabilities = parseInt(measure.value, 10);
        break;
      case "code_smells":
        metrics.code_smells = parseInt(measure.value, 10);
        break;
      case "sqale_index":
        // Convert minutes to a readable format (e.g. "2d 5h")
        const minutes = parseInt(measure.value, 10);
        metrics.technical_debt = formatTechnicalDebt(minutes);
        break;
      case "cognitive_complexity":
        metrics.complexity = parseInt(measure.value, 10);
        break;
    }
  });

  return metrics;
}

function formatTechnicalDebt(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
}
