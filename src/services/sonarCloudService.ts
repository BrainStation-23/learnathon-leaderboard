import { SonarCloudData, SonarMetrics, GitHubRepoData } from "@/types";
import { logger } from "@/services/logService";

export async function fetchSonarCloudData(
  orgSlug: string,
  repos: GitHubRepoData[]
): Promise<Map<string, SonarCloudData>> {
  try {
    const sonarDataMap = new Map<string, SonarCloudData>();
    
    await Promise.all(
      repos.map(async (repo) => {
        try {
          // Use the standardized project key format
          const projectKey = `Learnathon-By-Geeky-Solutions_${repo.name}`;
          
          logger.info(`Attempting to fetch SonarCloud data for repository: ${repo.name}`, { 
            projectKey,
            repository: repo.name
          }, 'sonarcloud');

          // Fetch core metrics
          const apiUrl = `https://sonarcloud.io/api/measures/component?component=${projectKey}&metricKeys=ncloc,coverage,bugs,vulnerabilities,code_smells,sqale_index,cognitive_complexity`;
          
          const metricsResponse = await fetch(apiUrl, {
            headers: {
              Accept: "application/json",
            },
          });

          if (!metricsResponse.ok) {
            logger.warn(`Failed to fetch SonarCloud data for ${repo.name}`, {
              projectKey,
              status: metricsResponse.status,
              statusText: metricsResponse.statusText
            }, 'sonarcloud');
            return;
          }

          const metricsData = await metricsResponse.json();
          logger.info(`Successfully fetched SonarCloud data for ${repo.name}`, {
            projectKey,
            rawData: JSON.stringify(metricsData).substring(0, 500) // Log first 500 chars
          }, 'sonarcloud');

          const metrics = extractMetrics(metricsData);
          
          // Only save if we have valid metrics
          if (Object.keys(metrics).length > 0) {
            sonarDataMap.set(repo.name, {
              project_key: projectKey,
              name: repo.name,
              metrics,
            });

            logger.info(`Processed SonarCloud metrics for ${repo.name}`, { 
              metrics: JSON.stringify(metrics)
            }, 'sonarcloud');
          } else {
            logger.warn(`No valid metrics found in SonarCloud response for ${repo.name}`, {
              projectKey
            }, 'sonarcloud');
          }
        } catch (error) {
          logger.error(`Error processing SonarCloud data for ${repo.name}`, { error }, 'sonarcloud');
        }
      })
    );

    return sonarDataMap;
  } catch (error) {
    logger.error("Error in fetchSonarCloudData", { error }, 'sonarcloud');
    throw error;
  }
}

function extractMetrics(metricsData: any): SonarMetrics {
  const measures = metricsData.component?.measures || [];
  const metrics: SonarMetrics = {};

  logger.info("Processing SonarCloud measures", {
    rawMeasures: JSON.stringify(measures)
  }, 'sonarcloud');

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
        metrics.technical_debt = formatTechnicalDebt(parseInt(measure.value, 10));
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
