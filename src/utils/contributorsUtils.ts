
import { GitHubContributor } from "@/types";

/**
 * Filters out contributors that are in the filtered list
 * 
 * @param contributors - The list of contributors
 * @param filteredList - The list of contributor logins to filter out
 * @returns The filtered list of contributors
 */
export function filterContributors(
  contributors?: GitHubContributor[], 
  filteredList: string[] = []
): GitHubContributor[] {
  if (!contributors) return [];
  
  return contributors.filter(
    contributor => !filteredList.includes(contributor.login)
  );
}
