
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
          // Format repository name to handle special characters
          const formattedRepoName = repo.name.replace(/[^a-zA-Z0-9-_]/g, "-");
          
          // Try different project key formats with proper casing
          // Format 1: Original format (orgSlug_repoName)
          // Format 2: PascalCase org with underscore (Org_repo)
          // Format 3: Original org with hyphen (org-repo)
          // Format 4: PascalCase everything (Org_RepoName)
          // Format 5: The format you mentioned (PascalCase-With-Hyphens_repoName)
          
          const pascalCaseOrg = orgSlug.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('-');
            
          const pascalCaseRepo = formattedRepoName.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
          
          const possibleProjectKeys = [
            // Original formats we were trying
            `${orgSlug}_${formattedRepoName}`,
            `${orgSlug}-${formattedRepoName}`,
            `${formattedRepoName}`,
            // New formats with proper casing
            `${pascalCaseOrg}_${formattedRepoName}`,
            `${pascalCaseOrg}-${formattedRepoName}_${formattedRepoName}`,
            `${pascalCaseOrg}_${pascalCaseRepo}`,
          ];
          
          logger.info(`Trying to find SonarCloud project for ${repo.name}`, { 
            possibleKeys: possibleProjectKeys 
          }, 'sonarcloud');

          let metricsData = null;
          let usedKey = '';
          
          // Try each project key format until we find one that works
          for (const projectKey of possibleProjectKeys) {
            try {
              // Fetch core metrics
              const apiUrl = `https://sonarcloud.io/api/measures/component?component=${projectKey}&metricKeys=ncloc,coverage,bugs,vulnerabilities,code_smells,sqale_index,cognitive_complexity`;
              
              logger.info(`Trying SonarCloud key: ${projectKey}`, {}, 'sonarcloud');
              console.log(`Trying SonarCloud key: ${projectKey}`);
              
              const metricsResponse = await fetch(
                apiUrl,
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
                console.log(`Found SonarCloud project using key: ${projectKey}`);
                break; // Found a working key format, stop trying others
              } else {
                console.log(`Failed with key ${projectKey}: ${metricsResponse.status}`);
              }
            } catch (error) {
              // Continue to the next key format on error
              console.error(`Error with key format ${projectKey}:`, error);
            }
          }

          if (metricsData) {
            const metrics = extractMetrics(metricsData);
            
            // Log the actual metrics received from SonarCloud
            logger.info(`Extracted SonarCloud metrics for ${repo.name}`, { 
              metrics: JSON.stringify(metrics),
              raw_data: JSON.stringify(metricsData).substring(0, 500) // Log first 500 chars to avoid excessively long logs
            }, 'sonarcloud');
            
            sonarDataMap.set(repo.name, {
              project_key: usedKey,
              name: repo.name,
              metrics,
            });
          } else {
            // Failed with all key formats, log it
            console.log(`No SonarCloud data found for repository: ${repo.name}`);
            logger.info(`No SonarCloud data found for repository: ${repo.name}`, {}, 'sonarcloud');
          }
        } catch (error) {
          console.error(`Error fetching SonarCloud data for ${repo.name}:`, error);
          logger.error(`Error fetching SonarCloud data for ${repo.name}`, { error }, 'sonarcloud');
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

  // Log the raw measures data
  console.log("Raw SonarCloud measures:", measures);

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

  // Log the final metrics object we're returning
  console.log("Extracted SonarCloud metrics:", metrics);
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
